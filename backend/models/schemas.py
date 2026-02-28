"""FastAPI 요청/응답 Pydantic 모델."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─── 요청 ────────────────────────────────────────────────

class AnalyzeVideoRequest(BaseModel):
    """전체 영상 분석 요청."""

    video_url: str = Field(description="YouTube 영상 URL")


class AnalyzeCommentRequest(BaseModel):
    """단일 댓글 분석 요청 (POC)."""

    comment_text: str = Field(description="분석할 댓글 텍스트")
    transcript: str = Field(default="", description="영상 자막 맥락 (선택)")


# ─── 응답 ────────────────────────────────────────────────

class TaggedCommentResponse(BaseModel):
    """태깅된 댓글."""

    comment_id: str
    author: str
    text: str
    published_at: str
    like_count: int
    toxicity_score: int
    toxicity_level: str
    categories: list[str]
    explanation: str
    suggestion: str | None = None
    analysis_source: str


class PipelineStatsResponse(BaseModel):
    """파이프라인 통계."""

    rule_skipped: int
    llm_analyzed: int
    skip_ratio: float


class SummaryResponse(BaseModel):
    """분석 요약."""

    total_comments: int
    clean_comments: int
    clean_percentage: float
    toxic_comments: int
    toxic_percentage: float
    average_toxicity_score: float
    category_distribution: dict[str, int]
    level_distribution: dict[str, int]
    pipeline_stats: PipelineStatsResponse


class AnalyzeVideoResponse(BaseModel):
    """전체 영상 분석 응답."""

    video_id: str
    transcript_length: int
    total_comments: int
    tagged_comments: list[TaggedCommentResponse]
    summary: SummaryResponse


class AnalyzeCommentResponse(BaseModel):
    """단일 댓글 분석 응답."""

    tagged_comment: TaggedCommentResponse
