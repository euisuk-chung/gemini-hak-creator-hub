import argparse
import html
import json
import os
import re
import sys
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import urlopen
from xml.etree import ElementTree as ET


YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
YOUTUBE_TIMEDTEXT_BASE = "https://www.youtube.com/api/timedtext"


def load_dotenv(path: str = ".env") -> None:
    """환경변수 로드"""
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def get_api_key(cli_api_key: str | None) -> str | None:
    """유튜브 api key 가져오기"""
    if cli_api_key:
        return cli_api_key
    return os.getenv("YOUTUBE_API_KEY") or os.getenv("YOUTUBE_APIKEY")


def extract_video_id(video: str) -> str:
    """Extract a YouTube video ID from either raw ID or URL."""
    parsed = urlparse(video)
    if not parsed.scheme:
        return video.strip()

    if parsed.netloc in {"youtu.be", "www.youtu.be"}:
        return parsed.path.lstrip("/")

    if "youtube.com" in parsed.netloc:
        if parsed.path == "/watch":
            query = parse_qs(parsed.query)
            return query.get("v", [""])[0]
        if parsed.path.startswith("/shorts/"):
            return parsed.path.split("/shorts/")[-1].split("/")[0]
        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/")[-1].split("/")[0]

    return video.strip()


def youtube_get(endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    query = urlencode({k: v for k, v in params.items() if v is not None})
    url = f"{YOUTUBE_API_BASE}/{endpoint}?{query}"
    with urlopen(url) as response:
        return json.loads(response.read().decode("utf-8"))


def get_video_metadata(video_id: str, api_key: str) -> dict[str, Any]:
    data = youtube_get(
        "videos",
        {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": api_key,
        },
    )
    items = data.get("items", [])
    if not items:
        raise ValueError("해당 video_id의 영상을 찾을 수 없습니다.")
    return items[0]


def get_video_comments(
    video_id: str,
    api_key: str,
    max_comments: int = 50,
    order: str = "relevance",
) -> list[dict[str, Any]]:
    comments: list[dict[str, Any]] = []
    next_page_token: str | None = None

    while len(comments) < max_comments:
        batch_size = min(100, max_comments - len(comments))
        data = youtube_get(
            "commentThreads",
            {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": batch_size,
                "order": order,
                "textFormat": "plainText",
                "pageToken": next_page_token,
                "key": api_key,
            },
        )

        for item in data.get("items", []):
            top_level = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
            comments.append(
                {
                    "author": top_level.get("authorDisplayName"),
                    "text": top_level.get("textDisplay"),
                    "likeCount": top_level.get("likeCount"),
                    "publishedAt": top_level.get("publishedAt"),
                    "updatedAt": top_level.get("updatedAt"),
                }
            )

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

    return comments


def youtube_timedtext_get(params: dict[str, Any]) -> str:
    query = urlencode({k: v for k, v in params.items() if v is not None})
    url = f"{YOUTUBE_TIMEDTEXT_BASE}?{query}"
    with urlopen(url) as response:
        return response.read().decode("utf-8", errors="replace")


def get_video_transcript(video_id: str, language_order: list[str] | None = None) -> str | None:
    language_order = language_order or ["ko", "en", "en-US"]
    tracks_xml = youtube_timedtext_get({"type": "list", "v": video_id})
    if not tracks_xml.strip():
        return None

    try:
        root = ET.fromstring(tracks_xml)
    except ET.ParseError:
        return None

    tracks: list[dict[str, str]] = []
    for track in root.findall("track"):
        tracks.append(
            {
                "lang_code": track.attrib.get("lang_code", ""),
                "name": track.attrib.get("name", ""),
                "kind": track.attrib.get("kind", ""),
            }
        )

    if not tracks:
        return None

    # Prefer explicit language order, then first available track.
    selected = None
    for lang in language_order:
        selected = next((t for t in tracks if t["lang_code"] == lang), None)
        if selected:
            break
    if not selected:
        selected = tracks[0]

    transcript_xml = youtube_timedtext_get(
        {
            "v": video_id,
            "lang": selected["lang_code"],
            "name": selected["name"] or None,
            "kind": selected["kind"] or None,
        }
    )

    if not transcript_xml.strip():
        return None

    try:
        transcript_root = ET.fromstring(transcript_xml)
    except ET.ParseError:
        return None

    chunks: list[str] = []
    for node in transcript_root.findall("text"):
        if node.text:
            chunks.append(html.unescape(node.text).strip())

    text = " ".join(chunk for chunk in chunks if chunk)
    return text or None


def _split_sentences(text: str) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return []
    # Korean/English mixed text splitter.
    parts = re.split(r"(?<=[.!?])\s+", clean)
    return [p.strip() for p in parts if p.strip()]


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9가-힣]{2,}", text.lower())


def summarize_text(text: str, max_sentences: int = 5) -> list[str]:
    sentences = _split_sentences(text)
    if len(sentences) <= max_sentences:
        return sentences

    stopwords = {
        "the", "and", "for", "that", "with", "this", "from", "have", "you", "your",
        "are", "was", "were", "will", "what", "when", "where", "how", "about", "into",
        "입니다", "그리고", "하지만", "그러나", "에서", "에게", "으로", "하다", "있는", "하는",
        "것", "수", "등", "더", "좀", "또", "이", "그", "저",
    }

    freqs: dict[str, int] = {}
    for token in _tokenize(text):
        if token in stopwords:
            continue
        freqs[token] = freqs.get(token, 0) + 1

    if not freqs:
        return sentences[:max_sentences]

    scored: list[tuple[int, float, str]] = []
    for idx, sentence in enumerate(sentences):
        tokens = [t for t in _tokenize(sentence) if t not in stopwords]
        if not tokens:
            score = 0.0
        else:
            score = sum(freqs.get(t, 0) for t in tokens) / len(tokens)
        scored.append((idx, score, sentence))

    top = sorted(scored, key=lambda x: x[1], reverse=True)[:max_sentences]
    top_sorted = sorted(top, key=lambda x: x[0])
    return [sentence for _, _, sentence in top_sorted]


def build_video_summary(
    metadata: dict[str, Any],
    comments: list[dict[str, Any]],
    transcript: str | None,
    max_sentences: int,
) -> tuple[str, str]:
    if transcript:
        summary_lines = summarize_text(transcript, max_sentences=max_sentences)
        return "\n".join(f"- {line}" for line in summary_lines), "transcript"

    description = metadata.get("snippet", {}).get("description", "") or ""
    comment_text = " ".join((c.get("text") or "") for c in comments[:20])
    source_text = f"{description} {comment_text}".strip()
    if source_text:
        summary_lines = summarize_text(source_text, max_sentences=max_sentences)
        return "\n".join(f"- {line}" for line in summary_lines), "description_comments"

    return "요약할 텍스트를 찾지 못했습니다.", "none"


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser(
        description="YouTube API로 영상 메타데이터와 댓글을 가져옵니다."
    )
    parser.add_argument(
        "--video",
        required=True,
        help="YouTube video URL 또는 video ID",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="YouTube Data API Key (기본: .env 또는 환경변수 YOUTUBE_API_KEY/YOUTUBE_APIKEY)",
    )
    parser.add_argument(
        "--max-comments",
        type=int,
        default=30,
        help="가져올 최대 댓글 수 (기본: 30)",
    )
    parser.add_argument(
        "--order",
        choices=["relevance", "time"],
        default="time",
        help="댓글 정렬 방식 (기본: time)",
    )
    parser.add_argument(
        "--output",
        help="결과를 저장할 JSON 파일 경로",
    )
    parser.add_argument(
        "--include-summary",
        action="store_true",
        help="영상 요약을 함께 생성",
    )
    parser.add_argument(
        "--summary-sentences",
        type=int,
        default=100,
        help="요약 문장 수 (기본: 5)",
    )
    args = parser.parse_args()

    api_key = get_api_key(args.api_key)
    if not api_key:
        raise ValueError("--api-key를 지정하거나 YOUTUBE_API_KEY 환경변수를 설정하세요.")

    video_id = extract_video_id(args.video)
    if not video_id:
        raise ValueError("유효한 video ID를 추출하지 못했습니다.")

    try:
        metadata = get_video_metadata(video_id, api_key)
        comments = get_video_comments(
            video_id=video_id,
            api_key=api_key,
            max_comments=args.max_comments,
            order=args.order,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"오류가 발생했습니다: {exc}", file=sys.stderr)
        sys.exit(1)

    transcript: str | None = None
    summary: str | None = None
    summary_source: str | None = None
    if args.include_summary:
        transcript = get_video_transcript(video_id)
        summary, summary_source = build_video_summary(
            metadata=metadata,
            comments=comments,
            transcript=transcript,
            max_sentences=max(1, args.summary_sentences),
        )

    result = {
        "videoId": video_id,
        "title": metadata.get("snippet", {}).get("title"),
        "channelTitle": metadata.get("snippet", {}).get("channelTitle"),
        "publishedAt": metadata.get("snippet", {}).get("publishedAt"),
        "description": metadata.get("snippet", {}).get("description"),
        "tags": metadata.get("snippet", {}).get("tags", []),
        "statistics": metadata.get("statistics", {}),
        "contentDetails": metadata.get("contentDetails", {}),
        "comments": comments,
        "summary": summary,
        "summarySource": summary_source,
    }

    output_text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_text)
        print(f"저장 완료: {args.output}")
    else:
        print(output_text)


if __name__ == "__main__":
    main()
