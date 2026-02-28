"""LangGraph 파이프라인 상태 정의."""

from __future__ import annotations

from typing import TypedDict


class CommentRaw(TypedDict):
    """YouTube 댓글 원본."""

    comment_id: str
    author: str
    text: str
    published_at: str
    like_count: int


class PrescreenResult(TypedDict):
    """Rule pre-screen 결과."""

    comment_id: str
    toxicity_score: int
    matched_categories: list[str]
    matched_patterns: list[str]
    matched_rules: list[str]
    is_toxic: bool


class TaggedComment(TypedDict):
    """최종 태깅된 댓글."""

    comment_id: str
    author: str
    text: str
    published_at: str
    like_count: int
    # 태깅 결과
    toxicity_score: int
    toxicity_level: str  # safe | mild | moderate | severe | critical
    categories: list[str]
    explanation: str
    suggestion: str | None
    # 메타
    analysis_source: str  # "rule_only" | "llm" | "llm+rule"


class PipelineState(TypedDict, total=False):
    """LangGraph 파이프라인 전체 상태."""

    # 입력
    video_url: str
    video_id: str

    # 수집 데이터
    video_title: str
    channel_title: str
    transcript: str
    comments: list[CommentRaw]

    # Pre-screen
    prescreen_results: list[PrescreenResult]
    safe_comments: list[CommentRaw]
    suspect_comments: list[CommentRaw]

    # Retrieval
    graph_evidences: NotRequired[List[Evidence]]
    graph_retrieval_elapsed: NotRequired[float]

    # LLM 분석
    llm_results: list[dict]

    # 최종
    tagged_comments: list[TaggedComment]
    summary: dict
