"""Rule 기반 pre-screen 노드.

scripts/korean_profanity.py의 analyze_comment()를 활용하여
댓글을 safe / suspect로 분류한다.
"""

from __future__ import annotations

import sys
from pathlib import Path

from backend.config import settings
from backend.graph.state import CommentRaw, PipelineState, PrescreenResult

# scripts/ import
_scripts_dir = str(settings.project_root / "scripts")
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

from korean_profanity import analyze_comment  # noqa: E402

PRESCREEN_THRESHOLD = settings.prescreen_threshold


def prescreen_node(state: PipelineState) -> dict:
    """Rule pre-screen: 댓글을 safe / suspect로 분류."""
    comments = state.get("comments", [])

    prescreen_results: list[PrescreenResult] = []
    safe_comments: list[CommentRaw] = []
    suspect_comments: list[CommentRaw] = []

    for comment in comments:
        result = analyze_comment(comment["text"])

        pr: PrescreenResult = {
            "comment_id": comment["comment_id"],
            "toxicity_score": result.toxicity_score,
            "matched_categories": result.matched_categories,
            "matched_patterns": result.matched_patterns,
            "matched_rules": result.matched_rules,
            "is_toxic": result.is_toxic,
        }
        prescreen_results.append(pr)

        if result.toxicity_score < PRESCREEN_THRESHOLD and not result.matched_categories:
            safe_comments.append(comment)
        else:
            suspect_comments.append(comment)

    return {
        "prescreen_results": prescreen_results,
        "safe_comments": safe_comments,
        "suspect_comments": suspect_comments,
    }
