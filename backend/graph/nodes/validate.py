"""교차검증 + 최종 태깅 노드.

Rule pre-screen 결과와 LLM 분석 결과를 합쳐서 최종 tagged_comments를 생성.
"""

from __future__ import annotations

from backend.graph.state import PipelineState, PrescreenResult, TaggedComment


def _get_level(score: int) -> str:
    """점수 → 독성 수준."""
    if score >= 80:
        return "critical"
    if score >= 60:
        return "severe"
    if score >= 40:
        return "moderate"
    if score >= 20:
        return "mild"
    return "safe"


def validate_node(state: PipelineState) -> dict:
    """Rule ↔ LLM 교차검증 + 최종 태깅."""
    safe_comments = state.get("safe_comments", [])
    suspect_comments = state.get("suspect_comments", [])
    prescreen_results = state.get("prescreen_results", [])
    llm_results = state.get("llm_results", [])

    # prescreen 결과를 comment_id로 인덱싱
    prescreen_map: dict[str, PrescreenResult] = {
        pr["comment_id"]: pr for pr in prescreen_results
    }
    # LLM 결과를 comment_id로 인덱싱
    llm_map: dict[str, dict] = {
        lr["comment_id"]: lr for lr in llm_results
    }

    tagged: list[TaggedComment] = []

    # 1. Safe 댓글: Rule 결과만 사용
    for comment in safe_comments:
        cid = comment["comment_id"]
        pr = prescreen_map.get(cid)
        score = pr["toxicity_score"] if pr else 0

        tagged.append({
            "comment_id": cid,
            "author": comment["author"],
            "text": comment["text"],
            "published_at": comment["published_at"],
            "like_count": comment["like_count"],
            "toxicity_score": score,
            "toxicity_level": _get_level(score),
            "categories": pr["matched_categories"] if pr else [],
            "explanation": "",
            "suggestion": None,
            "analysis_source": "rule_only",
        })

    # 2. Suspect 댓글: LLM + Rule 가중 합산
    for comment in suspect_comments:
        cid = comment["comment_id"]
        pr = prescreen_map.get(cid)
        lr = llm_map.get(cid)

        rule_score = pr["toxicity_score"] if pr else 0
        rule_categories = pr["matched_categories"] if pr else []

        if lr and lr["toxicity_score"] is not None:
            ai_score = lr["toxicity_score"]

            # 가중 합산: AI×0.7 + Rule×0.3, AI 하한선 보장
            merged_score = round(ai_score * 0.7 + rule_score * 0.3)
            final_score = max(merged_score, ai_score - 10)
            final_score = min(final_score, 100)

            # 카테고리: union
            ai_categories = lr.get("categories", [])
            merged_categories = list(dict.fromkeys(ai_categories + rule_categories))

            tagged.append({
                "comment_id": cid,
                "author": comment["author"],
                "text": comment["text"],
                "published_at": comment["published_at"],
                "like_count": comment["like_count"],
                "toxicity_score": final_score,
                "toxicity_level": _get_level(final_score),
                "categories": merged_categories,
                "explanation": lr.get("explanation", ""),
                "suggestion": lr.get("suggestion"),
                "analysis_source": "llm+rule",
            })
        else:
            # LLM 실패: Rule 결과만 사용
            tagged.append({
                "comment_id": cid,
                "author": comment["author"],
                "text": comment["text"],
                "published_at": comment["published_at"],
                "like_count": comment["like_count"],
                "toxicity_score": rule_score,
                "toxicity_level": _get_level(rule_score),
                "categories": rule_categories,
                "explanation": lr.get("explanation", "") if lr else "",
                "suggestion": None,
                "analysis_source": "rule_only",
            })

    # 3. Summary 집계
    total = len(tagged)
    toxic_count = sum(1 for t in tagged if t["toxicity_score"] >= 30)
    avg_score = round(sum(t["toxicity_score"] for t in tagged) / total, 1) if total else 0

    category_dist: dict[str, int] = {}
    level_dist: dict[str, int] = {"safe": 0, "mild": 0, "moderate": 0, "severe": 0, "critical": 0}
    for t in tagged:
        level_dist[t["toxicity_level"]] = level_dist.get(t["toxicity_level"], 0) + 1
        for cat in t["categories"]:
            category_dist[cat] = category_dist.get(cat, 0) + 1

    skipped = len(safe_comments)
    analyzed = len(suspect_comments)

    summary = {
        "total_comments": total,
        "toxic_comments": toxic_count,
        "toxic_percentage": round(toxic_count / total * 100, 1) if total else 0,
        "average_toxicity_score": avg_score,
        "category_distribution": category_dist,
        "level_distribution": level_dist,
        "pipeline_stats": {
            "rule_skipped": skipped,
            "llm_analyzed": analyzed,
            "skip_ratio": round(skipped / total * 100, 1) if total else 0,
        },
    }

    return {
        "tagged_comments": tagged,
        "summary": summary,
    }
