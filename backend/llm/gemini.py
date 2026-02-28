"""Gemini LLM 클라이언트 설정."""

from __future__ import annotations

from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import settings
from backend.llm.schemas import CommentTagging


def get_tagging_llm() -> ChatGoogleGenerativeAI:
    """구조화된 출력용 Gemini LLM 인스턴스."""
    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY가 설정되지 않았습니다.")

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        max_retries=2,
    )

    return llm.with_structured_output(CommentTagging)
