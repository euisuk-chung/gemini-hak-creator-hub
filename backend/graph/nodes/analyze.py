"""Gemini LLM 분석 노드.

suspect_comments를 하나씩 Gemini에 보내서 구조화된 태깅 결과를 받는다.
transcript를 맥락으로 제공.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from backend.llm.gemini import get_tagging_llm
from backend.prompts import SYSTEM_PROMPT, build_user_prompt
from backend.graph.state import PipelineState

logger = logging.getLogger(__name__)


def analyze_node(state: PipelineState) -> dict:
    """LLM 분석: suspect_comments를 하나씩 태깅."""
    suspect_comments = state.get("suspect_comments", [])
    transcript = state.get("transcript", "")
    video_title = state.get("video_title", "")
    prescreen_results = state.get("prescreen_results", [])

    # prescreen 결과를 comment_id로 인덱싱
    prescreen_map = {pr["comment_id"]: pr for pr in prescreen_results}

    if not suspect_comments:
        return {"llm_results": []}

    llm = get_tagging_llm()
    llm_results: list[dict] = []

    for comment in suspect_comments:
        try:
            # Rule이 사전 탐지한 카테고리를 레퍼런스로 전달
            pr = prescreen_map.get(comment["comment_id"])
            rule_categories = pr["matched_categories"] if pr else []

            user_prompt = build_user_prompt(
                comment["text"],
                transcript,
                video_title=video_title,
                rule_categories=rule_categories if rule_categories else None,
            )
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ]
            result = llm.invoke(messages)

            llm_results.append({
                "comment_id": comment["comment_id"],
                "toxicity_score": result.toxicity_score,
                "toxicity_level": result.toxicity_level,
                "categories": result.categories,
                "explanation": result.explanation,
                "suggestion": result.suggestion,
            })
        except Exception as e:
            logger.warning("LLM 분석 실패 (comment_id=%s): %s", comment["comment_id"], e)
            # 실패 시 Rule 결과로 폴백
            llm_results.append({
                "comment_id": comment["comment_id"],
                "toxicity_score": None,  # validate에서 Rule 결과 사용
                "toxicity_level": None,
                "categories": [],
                "explanation": f"LLM 분석 실패: {e}",
                "suggestion": None,
            })

    return {"llm_results": llm_results}
