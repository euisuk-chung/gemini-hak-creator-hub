"""YouTube 데이터 수집 노드: transcript + comments."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi

from backend.config import settings
from backend.graph.state import CommentRaw, PipelineState

# scripts/ 모듈 import를 위해 경로 추가
_scripts_dir = str(settings.project_root / "scripts")
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

from collect_comments import build_youtube_client, fetch_comments as _yt_fetch  # noqa: E402


def extract_video_id(url: str) -> str:
    """YouTube URL에서 video ID 추출."""
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    # URL 자체가 11자 video ID인 경우
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url
    raise ValueError(f"유효한 YouTube URL이 아닙니다: {url}")


def _fetch_video_info(video_id: str) -> tuple[str, str]:
    """YouTube Data API로 영상 제목과 채널명 가져오기.

    Returns:
        (video_title, channel_title) 튜플. 실패 시 빈 문자열.
    """
    if not settings.youtube_api_key:
        return "", ""
    try:
        youtube = build_youtube_client(settings.youtube_api_key)
        resp = youtube.videos().list(part="snippet", id=video_id).execute()
        items = resp.get("items", [])
        if items:
            snippet = items[0]["snippet"]
            return snippet.get("title", ""), snippet.get("channelTitle", "")
    except Exception:
        pass
    return "", ""


def fetch_transcript_node(state: PipelineState) -> dict:
    """YouTube 자막 + 제목 + 채널명 수집 노드."""
    video_id = extract_video_id(state["video_url"])

    transcript_text = ""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(
            video_id, languages=["ko", "en"]
        )
        transcript_text = " ".join(entry["text"] for entry in transcript_list)
    except Exception:
        # 자막이 없는 경우 빈 문자열 (파이프라인은 계속 진행)
        transcript_text = ""

    video_title, channel_title = _fetch_video_info(video_id)

    return {
        "video_id": video_id,
        "video_title": video_title,
        "channel_title": channel_title,
        "transcript": transcript_text,
    }


def fetch_comments_node(state: PipelineState) -> dict:
    """YouTube 댓글 수집 노드."""
    video_id = state["video_id"]

    if not settings.youtube_api_key:
        raise ValueError("YOUTUBE_API_KEY가 설정되지 않았습니다.")

    youtube = build_youtube_client(settings.youtube_api_key)
    raw_comments = _yt_fetch(youtube, video_id, max_comments=100)

    comments: list[CommentRaw] = [
        {
            "comment_id": c["commentId"],
            "author": c["author"],
            "text": c["text"],
            "published_at": c["publishedAt"],
            "like_count": c["likeCount"],
        }
        for c in raw_comments
    ]

    return {"comments": comments}
