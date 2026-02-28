"""LangGraph ?�이?�라??조립.

START ??fetch_transcript ??fetch_comments ??prescreen ??(conditional) ??analyze ??validate ??END
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from backend.graph.state import PipelineState
from backend.graph.nodes.fetch import fetch_comments_node, fetch_transcript_node
from backend.graph.nodes.prescreen import prescreen_node
from backend.graph.nodes.analyze import analyze_node
from backend.graph.nodes.validate import validate_node
from backend.graph.nodes.retrieval import retrieval_graph_node


def _should_run_llm(state: PipelineState) -> str:
    """LLM 분석이 필요한지 판단 (conditional edge)."""
    suspect = state.get("suspect_comments", [])
    if suspect:
        # retrieval based RAG route (enable when needed):
        return "retrieval"
    return "validate"


def build_pipeline() -> StateGraph:
    """전체 분석 파이프라인 빌드."""
    graph = StateGraph(PipelineState)

    # 노드 등록
    graph.add_node("fetch_transcript", fetch_transcript_node)
    graph.add_node("fetch_comments", fetch_comments_node)
    graph.add_node("prescreen", prescreen_node)
    graph.add_node("analyze", analyze_node)
    graph.add_node("validate", validate_node)
    graph.add_node("retrieval", retrieval_graph_node)

    # 엣지: START → transcript → comments → prescreen
    graph.add_edge(START, "fetch_transcript")
    graph.add_edge("fetch_transcript", "fetch_comments")
    graph.add_edge("fetch_comments", "prescreen")

    # 조건부 엣지: suspect 있으면 LLM, 없으면 바로 validate
    graph.add_conditional_edges("prescreen", _should_run_llm, {
        "retrieval": "retrieval",  # RAG route (currently disabled)
        "validate": "validate",
    })

    # graph.add_edge("retrieval", "analyze")  # RAG route (currently disabled)
    graph.add_edge("analyze", "validate")
    graph.add_edge("validate", END)

    return graph.compile()


def build_single_comment_pipeline() -> StateGraph:
    """단일 댓글 분석 파이프라인 (POC용).

    transcript + comment_text를 직접 받아서
    prescreen → (conditional) → analyze → validate 수행.
    """
    graph = StateGraph(PipelineState)

    graph.add_node("prescreen", prescreen_node)
    graph.add_node("analyze", analyze_node)
    graph.add_node("validate", validate_node)

    graph.add_edge(START, "prescreen")
    graph.add_conditional_edges("prescreen", _should_run_llm, {
        "retrieval": "retrieval",  # RAG route (currently disabled)
        "validate": "validate",
    })
    graph.add_edge("retrieval", "analyze")  # RAG route (currently disabled)
    graph.add_edge("analyze", "validate")
    graph.add_edge("validate", END)

    return graph.compile()
