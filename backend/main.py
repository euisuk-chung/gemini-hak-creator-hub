"""FastAPI 서버 — LangGraph 악성 댓글 태깅 파이프라인.

실행:
    uv run uvicorn backend.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, HTTPException

from backend.graph.pipeline import build_pipeline, build_single_comment_pipeline
from backend.models.schemas import (
    AnalyzeCommentRequest,
    AnalyzeCommentResponse,
    AnalyzeVideoRequest,
    AnalyzeVideoResponse,
    TaggedCommentResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NVC Chat Talk — 악성 댓글 태깅 API",
    description="LangGraph 기반 Rule + Gemini AI 통합 파이프라인",
    version="0.1.0",
)


@app.post("/analyze", response_model=AnalyzeVideoResponse)
async def analyze_video(req: AnalyzeVideoRequest):
    """전체 영상 분석: URL → 댓글 수집 → Rule pre-screen → LLM 분석 → 태깅."""
    logger.info("분석 시작: %s", req.video_url)

    pipeline = build_pipeline()

    try:
        result = pipeline.invoke({"video_url": req.video_url})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("파이프라인 오류")
        raise HTTPException(status_code=500, detail=f"분석 중 오류: {e}")

    tagged = result.get("tagged_comments", [])
    summary = result.get("summary", {})

    logger.info(
        "분석 완료: %d개 댓글, %d개 악성 (skip %s%%)",
        summary.get("total_comments", 0),
        summary.get("toxic_comments", 0),
        summary.get("pipeline_stats", {}).get("skip_ratio", 0),
    )

    return AnalyzeVideoResponse(
        video_id=result.get("video_id", ""),
        transcript_length=len(result.get("transcript", "")),
        total_comments=len(tagged),
        tagged_comments=[TaggedCommentResponse(**t) for t in tagged],
        summary=summary,
    )


@app.post("/analyze/comment", response_model=AnalyzeCommentResponse)
async def analyze_single_comment(req: AnalyzeCommentRequest):
    """단일 댓글 분석 (POC): 댓글 텍스트 + 선택적 transcript → 태깅."""
    pipeline = build_single_comment_pipeline()

    # 단일 댓글을 comments 리스트로 래핑
    comment_id = str(uuid.uuid4())[:8]
    initial_state = {
        "video_url": "",
        "video_id": "",
        "transcript": req.transcript,
        "comments": [
            {
                "comment_id": comment_id,
                "author": "",
                "text": req.comment_text,
                "published_at": "",
                "like_count": 0,
            }
        ],
    }

    try:
        result = pipeline.invoke(initial_state)
    except Exception as e:
        logger.exception("단일 댓글 분석 오류")
        raise HTTPException(status_code=500, detail=f"분석 중 오류: {e}")

    tagged = result.get("tagged_comments", [])
    if not tagged:
        raise HTTPException(status_code=500, detail="태깅 결과 없음")

    return AnalyzeCommentResponse(
        tagged_comment=TaggedCommentResponse(**tagged[0]),
    )


@app.get("/health")
async def health():
    """헬스체크."""
    return {"status": "ok"}
