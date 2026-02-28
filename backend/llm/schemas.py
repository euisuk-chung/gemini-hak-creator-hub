"""Pydantic 구조화 출력 스키마 (Gemini LLM 응답)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

TOXIC_CATEGORIES = Literal[
    "PROFANITY",
    "BLAME",
    "MOCKERY",
    "PERSONAL_ATTACK",
    "HATE_SPEECH",
    "THREAT",
    "SEXUAL",
    "DISCRIMINATION",
    "FAN_WAR",
    "SPAM",
]

TOXICITY_LEVELS = Literal["safe", "mild", "moderate", "severe", "critical"]


class CommentTagging(BaseModel):
    """LLM이 반환하는 단일 댓글 태깅 결과."""

    toxicity_score: int = Field(ge=0, le=100, description="독성 점수 (0-100)")
    toxicity_level: TOXICITY_LEVELS = Field(description="독성 수준")
    categories: list[TOXIC_CATEGORIES] = Field(
        default_factory=list,
        description="해당 카테고리 (복수 가능, 없으면 빈 배열)",
    )
    explanation: str = Field(description="이 점수를 부여한 이유 (한국어)")
    suggestion: str | None = Field(
        default=None,
        description="크리에이터 대응 제안 (moderate 이상만)",
    )
