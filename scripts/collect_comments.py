"""
YouTube Comment Collector for Korean Toxicity Analysis

Collects comments from Korean YouTube channels and analyzes them
using the ontology-based toxicity detection rules.

Usage:
    python scripts/collect_comments.py                     # 전체 채널 수집
    python scripts/collect_comments.py --channel "침착맨"   # 특정 채널만
    python scripts/collect_comments.py --guide              # API 키 발급 안내
    python scripts/collect_comments.py --stats              # 수집 통계 조회
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Windows cp949 인코딩 문제 방지
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv

# ─── Paths ─────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CHANNELS_FILE = SCRIPT_DIR / "channels.json"
DATA_DIR = SCRIPT_DIR / "data"

load_dotenv(PROJECT_ROOT / ".env")


# ─── API Guide ─────────────────────────────────────────────────────

API_GUIDE = """
================================================================
  YouTube Data API v3 키 발급 안내
================================================================

  1. Google Cloud Console 접속
     https://console.cloud.google.com/

  2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)

  3. APIs & Services > Library
     > "YouTube Data API v3" 검색 > 사용 설정

  4. APIs & Services > Credentials
     > Create Credentials > API Key

  5. 생성된 키를 프로젝트 루트의 .env 파일에 저장:

     YOUTUBE_API_KEY=AIzaSy...your_key_here

  ---------------------------------------------------------------
  무료 할당량: 일일 10,000 units
  채널 1개 (50영상 x 100댓글) = 약 3,000 units
  하루에 약 3개 채널 수집 가능
================================================================
"""


# ─── YouTube API Client ───────────────────────────────────────────

def build_youtube_client(api_key: str):
    """Build YouTube Data API v3 client."""
    from googleapiclient.discovery import build

    return build("youtube", "v3", developerKey=api_key)


def resolve_channel_id(youtube, handle: str) -> str | None:
    """Resolve a YouTube handle (@name) to a channel ID."""
    # Try search by handle
    clean_handle = handle.lstrip("@")

    # Method 1: channels.list with forHandle
    try:
        resp = youtube.channels().list(
            part="id,snippet",
            forHandle=clean_handle,
        ).execute()
        if resp.get("items"):
            return resp["items"][0]["id"]
    except Exception:
        pass

    # Method 2: search by channel name
    try:
        resp = youtube.search().list(
            part="snippet",
            q=clean_handle,
            type="channel",
            maxResults=1,
        ).execute()
        if resp.get("items"):
            return resp["items"][0]["snippet"]["channelId"]
    except Exception:
        pass

    return None


def get_channel_info(youtube, channel_id: str) -> dict:
    """Fetch channel metadata."""
    resp = youtube.channels().list(
        part="snippet,statistics",
        id=channel_id,
    ).execute()

    if not resp.get("items"):
        raise ValueError(f"채널을 찾을 수 없습니다: {channel_id}")

    item = resp["items"][0]
    return {
        "channelId": channel_id,
        "name": item["snippet"]["title"],
        "handle": item["snippet"].get("customUrl", ""),
        "subscriberCount": int(item["statistics"].get("subscriberCount", 0)),
        "videoCount": int(item["statistics"].get("videoCount", 0)),
    }


def get_recent_videos(youtube, channel_id: str, max_videos: int = 50) -> list[dict]:
    """Fetch recent video IDs from a channel."""
    videos: list[dict] = []
    page_token = None

    while len(videos) < max_videos:
        per_page = min(50, max_videos - len(videos))
        request = youtube.search().list(
            part="id,snippet",
            channelId=channel_id,
            order="date",
            type="video",
            maxResults=per_page,
            pageToken=page_token,
        )
        resp = request.execute()

        for item in resp.get("items", []):
            videos.append({
                "videoId": item["id"]["videoId"],
                "title": item["snippet"]["title"],
                "publishedAt": item["snippet"]["publishedAt"],
            })

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return videos[:max_videos]


def get_video_stats(youtube, video_ids: list[str]) -> dict[str, dict]:
    """Fetch view/comment counts for multiple videos (batch of 50)."""
    stats: dict[str, dict] = {}

    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = youtube.videos().list(
            part="statistics",
            id=",".join(batch),
        ).execute()

        for item in resp.get("items", []):
            stats[item["id"]] = {
                "viewCount": int(item["statistics"].get("viewCount", 0)),
                "likeCount": int(item["statistics"].get("likeCount", 0)),
                "commentCount": int(item["statistics"].get("commentCount", 0)),
            }

    return stats


def fetch_comments(
    youtube, video_id: str, max_comments: int = 100
) -> list[dict]:
    """Fetch comments for a video."""
    comments: list[dict] = []
    page_token = None

    while len(comments) < max_comments:
        per_page = min(100, max_comments - len(comments))
        try:
            resp = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=per_page,
                order="relevance",
                textFormat="plainText",
                pageToken=page_token,
            ).execute()
        except Exception as e:
            error_msg = str(e)
            if "commentsDisabled" in error_msg:
                break
            if "forbidden" in error_msg.lower():
                break
            raise

        for item in resp.get("items", []):
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "commentId": item["snippet"]["topLevelComment"]["id"],
                "author": snippet["authorDisplayName"],
                "text": snippet["textDisplay"],
                "publishedAt": snippet["publishedAt"],
                "likeCount": snippet.get("likeCount", 0),
            })

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return comments


# ─── Collection Pipeline ──────────────────────────────────────────

def collect_channel(
    youtube,
    channel_config: dict,
    verbose: bool = True,
) -> dict:
    """Full collection pipeline for a single channel."""
    from korean_profanity import analyze_comment, CATEGORIES

    name = channel_config["name"]
    handle = channel_config["handle"]
    max_videos = channel_config.get("max_videos", 50)
    max_comments = channel_config.get("max_comments_per_video", 100)

    if verbose:
        print(f"\n{'='*60}")
        print(f"  채널 수집 시작: {name} ({handle})")
        print(f"{'='*60}")

    # 1. Resolve channel ID (use pre-configured channelId if available)
    channel_id = channel_config.get("channelId")
    if not channel_id:
        if verbose:
            print(f"  [1/5] 채널 ID 조회 중...")
        channel_id = resolve_channel_id(youtube, handle)
        if not channel_id:
            print(f"  x 채널을 찾을 수 없습니다: {handle}")
            return {}
    elif verbose:
        print(f"  [1/5] 채널 ID: {channel_id}")

    # 2. Get channel info
    if verbose:
        print(f"  [2/5] 채널 정보 조회 중...")
    channel_info = get_channel_info(youtube, channel_id)
    if verbose:
        print(f"        구독자: {channel_info['subscriberCount']:,}명")

    # 3. Get recent videos
    if verbose:
        print(f"  [3/5] 최근 영상 {max_videos}개 조회 중...")
    videos = get_recent_videos(youtube, channel_id, max_videos)
    if verbose:
        print(f"        발견: {len(videos)}개 영상")

    # 4. Get video stats
    video_ids = [v["videoId"] for v in videos]
    stats = get_video_stats(youtube, video_ids)

    # 5. Collect comments for each video
    if verbose:
        print(f"  [4/5] 댓글 수집 및 분석 중...")

    total_comments = 0
    toxic_comments = 0
    category_counts: dict[str, int] = {cat: 0 for cat in CATEGORIES}
    total_score = 0
    video_results: list[dict] = []

    for i, video in enumerate(videos):
        vid = video["videoId"]
        video_stat = stats.get(vid, {})

        if verbose:
            progress = f"[{i+1}/{len(videos)}]"
            print(f"        {progress} {video['title'][:40]}...", end="", flush=True)

        try:
            comments = fetch_comments(youtube, vid, max_comments)
        except Exception as e:
            if verbose:
                print(f" ✗ ({e})")
            comments = []

        analyzed_comments: list[dict] = []
        for comment in comments:
            analysis = analyze_comment(comment["text"])
            comment_data = {
                **comment,
                "analysis": {
                    "toxicityScore": analysis.toxicity_score,
                    "matchedCategories": analysis.matched_categories,
                    "matchedPatterns": analysis.matched_patterns,
                    "matchedRules": analysis.matched_rules,
                },
            }
            analyzed_comments.append(comment_data)

            total_comments += 1
            if analysis.is_toxic:
                toxic_comments += 1
            total_score += analysis.toxicity_score
            for cat in analysis.matched_categories:
                category_counts[cat] = category_counts.get(cat, 0) + 1

        video_results.append({
            "videoId": vid,
            "title": video["title"],
            "publishedAt": video["publishedAt"],
            "viewCount": video_stat.get("viewCount", 0),
            "commentCount": video_stat.get("commentCount", 0),
            "comments": analyzed_comments,
        })

        if verbose:
            toxic_in_video = sum(
                1 for c in analyzed_comments if c["analysis"]["toxicityScore"] >= 30
            )
            print(f" ✓ {len(comments)}개 댓글 (독성: {toxic_in_video}개)")

        # Rate limiting: small delay between requests
        time.sleep(0.1)

    # 6. Build result
    avg_score = total_score / total_comments if total_comments > 0 else 0
    toxic_pct = (toxic_comments / total_comments * 100) if total_comments > 0 else 0

    result = {
        "channel": channel_info,
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "totalComments": total_comments,
        "toxicComments": toxic_comments,
        "videos": video_results,
        "statistics": {
            "categoryDistribution": category_counts,
            "averageToxicityScore": round(avg_score, 1),
            "toxicPercentage": round(toxic_pct, 1),
        },
    }

    if verbose:
        print(f"\n  [5/5] 결과 요약")
        print(f"        총 댓글: {total_comments:,}개")
        print(f"        독성 댓글: {toxic_comments:,}개 ({toxic_pct:.1f}%)")
        print(f"        평균 독성 점수: {avg_score:.1f}")
        print(f"        카테고리 분포:")
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
            if count > 0:
                print(f"          {cat}: {count}")

    return result


def save_result(channel_name: str, result: dict) -> Path:
    """Save collection result as JSON."""
    # Sanitize directory name
    safe_name = "".join(c if c.isalnum() or c in "._- " else "_" for c in channel_name)
    channel_dir = DATA_DIR / safe_name
    channel_dir.mkdir(parents=True, exist_ok=True)

    output_path = channel_dir / "comments.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # Also save metadata separately for quick reference
    metadata = {
        "channel": result.get("channel", {}),
        "collectedAt": result.get("collectedAt"),
        "totalComments": result.get("totalComments", 0),
        "toxicComments": result.get("toxicComments", 0),
        "statistics": result.get("statistics", {}),
    }
    metadata_path = channel_dir / "metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    return output_path


# ─── Stats Command ─────────────────────────────────────────────────

def show_stats():
    """Show collection statistics from saved data."""
    if not DATA_DIR.exists():
        print("아직 수집된 데이터가 없습니다.")
        return

    print(f"\n{'='*60}")
    print(f"  수집 데이터 통계")
    print(f"{'='*60}\n")

    total_all = 0
    toxic_all = 0

    for channel_dir in sorted(DATA_DIR.iterdir()):
        if not channel_dir.is_dir():
            continue

        metadata_path = channel_dir / "metadata.json"
        if not metadata_path.exists():
            continue

        with open(metadata_path, encoding="utf-8") as f:
            meta = json.load(f)

        channel_name = meta.get("channel", {}).get("name", channel_dir.name)
        total = meta.get("totalComments", 0)
        toxic = meta.get("toxicComments", 0)
        pct = meta.get("statistics", {}).get("toxicPercentage", 0)
        avg_score = meta.get("statistics", {}).get("averageToxicityScore", 0)
        collected = meta.get("collectedAt", "N/A")

        total_all += total
        toxic_all += toxic

        print(f"  {channel_name}")
        print(f"    수집일: {collected[:10] if collected != 'N/A' else 'N/A'}")
        print(f"    총 댓글: {total:,}개 | 독성: {toxic:,}개 ({pct}%)")
        print(f"    평균 독성 점수: {avg_score}")

        dist = meta.get("statistics", {}).get("categoryDistribution", {})
        top_cats = sorted(dist.items(), key=lambda x: -x[1])[:3]
        if top_cats:
            top_str = ", ".join(f"{c}({n})" for c, n in top_cats)
            print(f"    상위 카테고리: {top_str}")
        print()

    if total_all > 0:
        pct_all = toxic_all / total_all * 100
        print(f"  ── 전체 합계 ──")
        print(f"    총 댓글: {total_all:,}개 | 독성: {toxic_all:,}개 ({pct_all:.1f}%)")


# ─── CLI ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="한국 유튜브 댓글 수집기 (독성 분석 포함)",
    )
    parser.add_argument(
        "--channel",
        type=str,
        help="특정 채널만 수집 (channels.json의 name 필드)",
    )
    parser.add_argument(
        "--guide",
        action="store_true",
        help="YouTube Data API 키 발급 안내 출력",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="수집된 데이터 통계 조회",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="진행 상황 출력 최소화",
    )

    args = parser.parse_args()

    # Guide mode
    if args.guide:
        print(API_GUIDE)
        return

    # Stats mode
    if args.stats:
        show_stats()
        return

    # Check API key
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print("✗ YOUTUBE_API_KEY가 설정되지 않았습니다.")
        print("  발급 안내: python scripts/collect_comments.py --guide")
        sys.exit(1)

    # Load channels config
    if not CHANNELS_FILE.exists():
        print(f"✗ 채널 설정 파일을 찾을 수 없습니다: {CHANNELS_FILE}")
        sys.exit(1)

    with open(CHANNELS_FILE, encoding="utf-8") as f:
        config = json.load(f)

    channels = config["channels"]

    # Filter to specific channel if requested
    if args.channel:
        channels = [c for c in channels if args.channel in c["name"]]
        if not channels:
            print(f"✗ '{args.channel}'에 해당하는 채널을 찾을 수 없습니다.")
            print(f"  사용 가능한 채널:")
            for c in config["channels"]:
                print(f"    - {c['name']} ({c['handle']})")
            sys.exit(1)

    # Build YouTube client
    youtube = build_youtube_client(api_key)

    # Collect comments for each channel
    verbose = not args.quiet
    for channel_config in channels:
        try:
            result = collect_channel(youtube, channel_config, verbose=verbose)
            if result:
                output_path = save_result(channel_config["name"], result)
                if verbose:
                    print(f"\n  저장 완료: {output_path}")
        except Exception as e:
            print(f"\n  ✗ 오류 발생 ({channel_config['name']}): {e}")
            continue

    if verbose:
        print(f"\n{'='*60}")
        print(f"  수집 완료!")
        print(f"  통계 확인: python scripts/collect_comments.py --stats")
        print(f"{'='*60}")


if __name__ == "__main__":
    # Ensure korean_profanity module is importable
    sys.path.insert(0, str(SCRIPT_DIR))
    main()
