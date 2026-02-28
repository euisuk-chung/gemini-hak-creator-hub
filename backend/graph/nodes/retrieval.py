import os
import time
from typing import Any

import requests

from backend.graph.state import PipelineState


def _build_dataset_url() -> str:
    # FUSEKI_URL can be either base server URL or dataset URL.
    fuseki_url = os.getenv("FUSEKI_URL", "http://localhost:3030").rstrip("/")
    dataset = os.getenv("FUSEKI_DATASET", "hackathon_nvc_dataset").strip("/")

    if fuseki_url.endswith(f"/{dataset}"):
        return fuseki_url
    return f"{fuseki_url}/{dataset}"


def _sparql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _build_candidates(state: PipelineState) -> list[str]:
    """Build retrieval candidates from suspect comments and rule prescreen results."""
    suspect_comments = state.get("suspect_comments", []) or []
    prescreen_results = state.get("prescreen_results", []) or []

    prescreen_map = {pr["comment_id"]: pr for pr in prescreen_results}
    candidates: list[str] = []
    seen: set[str] = set()

    for comment in suspect_comments:
        text = (comment.get("text") or "").strip()
        if text and text not in seen:
            seen.add(text)
            candidates.append(text)

        pr = prescreen_map.get(comment.get("comment_id"), {})
        for category in pr.get("matched_categories", []) or []:
            c = (category or "").strip()
            if c and c not in seen:
                seen.add(c)
                candidates.append(c)

        for pattern in pr.get("matched_patterns", []) or []:
            p = (pattern or "").strip()
            if p and p not in seen:
                seen.add(p)
                candidates.append(p)

    return candidates


def retrieval_graph_node(state: PipelineState) -> dict[str, Any]:
    candidates = _build_candidates(state)

    if not state.get("suspect_comments", []) or not candidates:
        return {**state, "graph_evidences": [], "graph_retrieval_elapsed": 0.0}

    values = " ".join(f'"{_sparql_escape(c)}"' for c in candidates[:12])

    sparql = f"""
PREFIX nvc: <http://example.org/nvc#>

SELECT ?kw ?indicatorText ?categoryName
WHERE {{
  VALUES ?kw {{ {values} }}
  ?ind a nvc:LexicalIndicator ;
       nvc:indicatorText ?indicatorText .
  ?cat a nvc:ToxicCategory ;
       nvc:hasIndicator ?ind .
  BIND(REPLACE(STR(?cat), '^.*#', '') AS ?categoryName)
  FILTER(
    CONTAINS(LCASE(?kw), LCASE(?indicatorText)) ||
    CONTAINS(LCASE(?indicatorText), LCASE(?kw))
  )
}}
""".strip()

    dataset_url = _build_dataset_url()
    sparql_endpoint = f"{dataset_url}/sparql"

    t0 = time.perf_counter()
    graph_evidences: list[dict[str, Any]] = []

    try:
        resp = requests.post(
            sparql_endpoint,
            data={"query": sparql},
            headers={"Accept": "application/sparql-results+json"},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        bindings = data.get("results", {}).get("bindings", [])

        for row in bindings:
            kw = row.get("kw", {}).get("value", "")
            indicator = row.get("indicatorText", {}).get("value", "")
            category = row.get("categoryName", {}).get("value", "")

            content = f"키워드 '{kw}'가 지표 '{indicator}'와 매칭되며 카테고리 '{category}' 근거가 됩니다."
            graph_evidences.append(
                {
                    "source": "graph",
                    "score": 0.8,
                    "payload": {
                        "content": content,
                        "metadata": {
                            "keyword": kw,
                            "indicator": indicator,
                            "category": category,
                            "dataset_url": dataset_url,
                        },
                    },
                }
            )

    except Exception as exc:
        # Keep workflow alive even when Fuseki retrieval fails.
        graph_evidences.append(
            {
                "source": "graph",
                "score": 0.0,
                "payload": {
                    "content": "그래프 조회 실패",
                    "metadata": {"error": str(exc), "dataset_url": dataset_url},
                },
            }
        )

    elapsed = time.perf_counter() - t0

    return {
        **state,
        "graph_evidences": graph_evidences,
        "graph_retrieval_elapsed": float(elapsed),
    }
