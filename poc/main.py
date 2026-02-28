import argparse
import json
import os
import re
import time
from collections import Counter
from pathlib import Path
from typing import Any

try:
    from langgraph.graph import END, StateGraph
except ImportError as exc:  # pragma: no cover
    raise SystemExit("langgraph가 설치되어 있지 않습니다. `pip install langgraph` 후 다시 실행하세요.") from exc

import extract_bad_comments as ebc
import youtube_data as yd
from state import CommentAnalysisRow, CommentItem, PipelineState

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
AUTO_TOXIC_CATEGORIES = {"Threat", "HateSpeech"}


def _parse_comments_payload(payload: Any) -> list[CommentItem]:
    if isinstance(payload, dict) and "comments" in payload:
        payload = payload["comments"]
    if not isinstance(payload, list):
        raise ValueError("댓글 입력은 JSON 배열이어야 합니다.")

    comments: list[CommentItem] = []
    for i, item in enumerate(payload):
        if isinstance(item, str):
            text = item.strip()
            if text:
                comments.append({"text": text, "author": None})
            continue
        if isinstance(item, dict):
            text = str(item.get("text", "")).strip()
            if text:
                author = item.get("author")
                comments.append({"text": text, "author": str(author) if author is not None else None})
            continue
        raise ValueError(f"{i}번째 댓글 형식이 잘못되었습니다. 문자열 또는 객체여야 합니다.")
    return comments


def load_comments_from_file(path: Path) -> list[CommentItem]:
    if not path.exists():
        raise FileNotFoundError(f"입력 파일을 찾을 수 없습니다: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    return _parse_comments_payload(payload)


def load_comments_from_json_arg(raw: str) -> list[CommentItem]:
    payload = json.loads(raw)
    return _parse_comments_payload(payload)


def load_comments_from_result_json(path: Path) -> tuple[str, list[CommentItem]]:
    if not path.exists():
        raise FileNotFoundError(f"입력 파일을 찾을 수 없습니다: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("result.json 입력은 객체(JSON object)여야 합니다.")
    video_id = str(payload.get("videoId", "unknown"))
    comments = _parse_comments_payload(payload)
    return video_id, comments


def fetch_comments_from_youtube(video: str, max_comments: int) -> tuple[str, list[CommentItem]]:
    yd.load_dotenv()
    api_key = yd.get_api_key(None)
    if not api_key:
        raise ValueError("YouTube API key가 없습니다. .env의 YOUTUBE_APIKEY 또는 YOUTUBE_API_KEY를 확인하세요.")
    video_id = yd.extract_video_id(video)
    comments_raw = yd.get_video_comments(
        video_id=video_id,
        api_key=api_key,
        max_comments=max_comments,
        order="relevance",
    )
    comments: list[CommentItem] = []
    for c in comments_raw:
        text = str(c.get("text", "")).strip()
        if not text:
            continue
        author = c.get("author")
        comments.append({"text": text, "author": str(author) if author is not None else None})
    return video_id, comments


def _extract_json_from_text(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        parsed = json.loads(text[start : end + 1])
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("Gemini 응답에서 JSON 파싱 실패")


def _parse_retry_seconds(error_text: str) -> float | None:
    m = re.search(r"retry in ([0-9.]+)s", error_text, flags=re.IGNORECASE)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def call_gemini_for_toxicity(text: str, api_key: str, model: str, max_retries: int) -> dict[str, Any]:
    try:
        from google import genai
    except ImportError as exc:
        raise RuntimeError("google-genai 패키지가 필요합니다. `pip install google-genai` 후 다시 실행하세요.") from exc

    prompt = (
        "다음 YouTube 댓글의 전체 문맥을 보고 악성인지 판정해줘. JSON만 반환해.\n"
        '반환 스키마: {"is_toxic": boolean, "confidence": number, "reason": string, "labels": string[]}\n'
        "labels는 Threat/HateSpeech/PersonalInsult/Sarcasm/Overgeneralization/"
        "Dismissal/Spam/NonToxic 중에서 사용.\n"
        f"댓글: {text}"
    )
    client = genai.Client(api_key=api_key)
    resp = None
    for attempt in range(max_retries + 1):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "temperature": 0.1,
                    "response_mime_type": "application/json",
                },
            )
            break
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            retryable = "429" in msg or "RESOURCE_EXHAUSTED" in msg
            if not retryable or attempt >= max_retries:
                raise RuntimeError(f"Gemini 호출 실패: {exc}") from exc
            wait_seconds = _parse_retry_seconds(msg)
            if wait_seconds is None:
                wait_seconds = (2**attempt) * 2.0
            time.sleep(max(1.0, wait_seconds))
    if resp is None:
        raise RuntimeError("Gemini 호출 실패: 응답 없음")

    text_part = getattr(resp, "text", None)
    if not text_part:
        raise RuntimeError(f"Gemini 응답 형식 오류: {resp}")
    parsed = _extract_json_from_text(text_part)
    labels_raw = parsed.get("labels", [])
    labels = [str(x) for x in labels_raw] if isinstance(labels_raw, list) else []
    return {
        "is_toxic": bool(parsed.get("is_toxic", False)),
        "confidence": max(0.0, min(1.0, float(parsed.get("confidence", 0.0)))),
        "reason": str(parsed.get("reason", "")).strip(),
        "labels": labels,
    }


def _sanitize_hits(hits: dict[str, list[str]], original_text: str) -> dict[str, list[str]]:
    clean = {k: list(v) for k, v in hits.items()}
    if "Sarcasm" in clean and "laughing" in clean["Sarcasm"]:
        if not any(token in original_text for token in ("ㅋㅋ", "ㅎㅎ", "^^")):
            clean["Sarcasm"] = [x for x in clean["Sarcasm"] if x != "laughing"]
    lower = original_text.lower()
    if "http://" in lower or "https://" in lower or "www." in lower:
        clean.setdefault("Spam", [])
        if "url" not in clean["Spam"]:
            clean["Spam"].append("url")
    return clean


def _decide_rule_path(hit_categories: list[str]) -> str:
    if not hit_categories:
        return "auto_safe"
    if any(cat in AUTO_TOXIC_CATEGORIES for cat in hit_categories):
        return "auto_toxic"
    return "ambiguous"


def node_load_comments(state: PipelineState) -> PipelineState:
    try:
        video_id: str | None = None
        if state.get("comments_json"):
            comments = load_comments_from_json_arg(state["comments_json"])
            source = "comments_arg"
        elif state.get("comments_file"):
            comments = load_comments_from_file(Path(state["comments_file"]))
            source = "comments_file"
        elif state.get("input_path"):
            input_path = Path(state["input_path"])
            if input_path.exists():
                video_id, comments = load_comments_from_result_json(input_path)
                source = "result_json"
            else:
                video = state.get("video")
                if not video:
                    raise FileNotFoundError(
                        f"입력 파일이 없고(--input: {input_path}), --video도 없어 댓글을 수집할 수 없습니다."
                    )
                video_id, comments = fetch_comments_from_youtube(
                    video=video,
                    max_comments=state.get("max_comments", 100),
                )
                source = "youtube_api"
                # Cache fetched comments to input path for later reuse.
                input_path.write_text(
                    json.dumps({"videoId": video_id, "comments": comments}, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
        else:
            video = state.get("video")
            if not video:
                raise ValueError("--comments-json, --comments-file, --input, --video 중 하나는 필요합니다.")
            video_id, comments = fetch_comments_from_youtube(
                video=video,
                max_comments=state.get("max_comments", 100),
            )
            source = "youtube_api"
        return {
            **state,
            "source": source,
            "video_id": video_id,
            "comments": comments,
            "error": None,
        }
    except Exception as exc:  # noqa: BLE001
        return {**state, "error": f"댓글 로드 실패: {exc}"}


def node_rule_filter(state: PipelineState) -> PipelineState:
    if state.get("error"):
        return state
    comments = state.get("comments", [])
    category_counter: Counter[str] = Counter()
    rule_decision_counter: Counter[str] = Counter()
    final_decision_counter: Counter[str] = Counter()
    results: list[CommentAnalysisRow] = []
    ambiguous_indices: list[int] = []

    for idx, comment in enumerate(comments):
        text = str(comment.get("text", "")).strip()
        if not text:
            continue
        normalized = ebc.normalize_ko(text)
        hits = _sanitize_hits(ebc.rule_match(normalized), text)
        hit_categories = [cat for cat, names in hits.items() if names]
        rule_decision = _decide_rule_path(hit_categories)
        if rule_decision == "auto_toxic":
            final_decision = "toxic"
        elif rule_decision == "auto_safe":
            final_decision = "safe"
        else:
            final_decision = "ambiguous"
            ambiguous_indices.append(len(results))

        for cat in hit_categories:
            category_counter[cat] += 1
        rule_decision_counter[rule_decision] += 1
        final_decision_counter[final_decision] += 1

        results.append(
            {
                "index": idx,
                "author": comment.get("author"),
                "text": text,
                "normalized": normalized,
                "rule_decision": rule_decision,
                "final_decision": final_decision,
                "hit_categories": hit_categories,
                "trigger_names": {cat: names for cat, names in hits.items() if names},
                "gemini": None,
            }
        )

    return {
        **state,
        "category_counter": dict(category_counter),
        "rule_decision_counter": dict(rule_decision_counter),
        "final_decision_counter": dict(final_decision_counter),
        "results": results,
        "ambiguous_indices": ambiguous_indices,
        "gemini_checked_count": 0,
        "gemini_skipped_count": 0,
    }


def route_after_rules(state: PipelineState) -> str:
    if state.get("error"):
        return "aggregate"
    if not state.get("use_gemini"):
        return "aggregate"
    if not state.get("ambiguous_indices"):
        return "aggregate"
    return "gemini"


def node_gemini_recheck(state: PipelineState) -> PipelineState:
    if state.get("error") or not state.get("use_gemini"):
        return state
    gemini_api_key = state.get("gemini_api_key") or os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return {**state, "error": "Gemini 사용 옵션이 켜졌지만 GEMINI_API_KEY가 없습니다."}

    results = list(state.get("results", []))
    final_counter = Counter(state.get("final_decision_counter", {}))
    checked = 0
    skipped = 0
    last_called_at: float | None = None

    for result_idx in state.get("ambiguous_indices", []):
        if result_idx >= len(results):
            continue
        row = results[result_idx]
        if checked >= state["gemini_max_check"]:
            skipped += 1
            continue
        if last_called_at is not None:
            elapsed = time.time() - last_called_at
            if elapsed < state["gemini_min_interval_sec"]:
                time.sleep(state["gemini_min_interval_sec"] - elapsed)
        try:
            gem = call_gemini_for_toxicity(
                text=str(row["text"]),
                api_key=gemini_api_key,
                model=state["gemini_model"],
                max_retries=state["gemini_max_retries"],
            )
        except Exception as exc:  # noqa: BLE001
            return {**state, "error": f"Gemini 재판정 실패: {exc}"}

        prev = str(row["final_decision"])
        final = "toxic" if gem["is_toxic"] else "safe"
        if prev != final:
            final_counter[prev] -= 1
            if final_counter[prev] <= 0:
                del final_counter[prev]
            final_counter[final] += 1
        row["final_decision"] = final
        row["gemini"] = gem

        checked += 1
        last_called_at = time.time()

    return {
        **state,
        "results": results,
        "final_decision_counter": dict(final_counter),
        "gemini_checked_count": checked,
        "gemini_skipped_count": skipped,
    }


def node_aggregate_and_save(state: PipelineState) -> PipelineState:
    if state.get("error"):
        return state

    results = state.get("results", [])
    bad_comments = [r for r in results if r.get("final_decision") == "toxic"]
    total = len(results)
    report = {
        "video_id": state.get("video_id"),
        "source": state.get("source"),
        "gemini_enabled": state.get("use_gemini", False),
        "gemini_model": state.get("gemini_model") if state.get("use_gemini") else None,
        "total_comments": total,
        "bad_comment_count": len(bad_comments),
        "bad_comment_ratio": round((len(bad_comments) / total * 100), 2) if total else 0.0,
        "category_breakdown": state.get("category_counter", {}),
        "rule_decision_breakdown": state.get("rule_decision_counter", {}),
        "final_decision_breakdown": state.get("final_decision_counter", {}),
        "ambiguous_count": len(state.get("ambiguous_indices", [])),
        "gemini_checked_count": state.get("gemini_checked_count", 0),
        "gemini_skipped_count": state.get("gemini_skipped_count", 0),
        "bad_comments": bad_comments,
    }
    Path(state["output_path"]).write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return {**state, "report": report}


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("load_comments", node_load_comments)
    graph.add_node("rule_filter", node_rule_filter)
    graph.add_node("gemini_recheck", node_gemini_recheck)
    graph.add_node("aggregate", node_aggregate_and_save)
    graph.set_entry_point("load_comments")
    graph.add_edge("load_comments", "rule_filter")
    graph.add_conditional_edges(
        "rule_filter",
        route_after_rules,
        {
            "gemini": "gemini_recheck",
            "aggregate": "aggregate",
        },
    )
    graph.add_edge("gemini_recheck", "aggregate")
    graph.add_edge("aggregate", END)
    return graph.compile()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="LangGraph 기반: result.json/댓글입력/유튜브링크 -> 룰 필터링 -> (선택) Gemini 재판정"
    )
    parser.add_argument("--input", default="result.json", help="youtube_data.py의 result.json 경로 (기본: result.json)")
    parser.add_argument("--video", help="result.json이 없을 때 사용할 유튜브 링크/ID")
    parser.add_argument("--max-comments", type=int, default=100, help="--video 사용 시 수집할 최대 댓글 수")
    parser.add_argument("--comments-file", help="댓글 JSON 파일 경로(배열). 예: [\"댓글1\", {\"text\":\"댓글2\"}]")
    parser.add_argument("--comments-json", help="댓글 JSON 문자열(배열)")
    parser.add_argument("--output", default="bad_comments_report.json", help="결과 JSON 경로")
    parser.add_argument("--show", type=int, default=10)
    parser.add_argument("--use-gemini", action="store_true")
    parser.add_argument("--gemini-model", default=DEFAULT_GEMINI_MODEL)
    parser.add_argument("--gemini-max-check", type=int, default=5)
    parser.add_argument("--gemini-min-interval-sec", type=float, default=12.0)
    parser.add_argument("--gemini-max-retries", type=int, default=3)
    return parser.parse_args()


def main() -> None:
    yd.load_dotenv()
    args = parse_args()

    initial_state: PipelineState = {
        "input_path": args.input,
        "video": args.video,
        "max_comments": max(1, args.max_comments),
        "comments_file": args.comments_file,
        "comments_json": args.comments_json,
        "output_path": args.output,
        "use_gemini": bool(args.use_gemini),
        "gemini_model": args.gemini_model,
        "gemini_max_check": max(0, args.gemini_max_check),
        "gemini_min_interval_sec": max(0.0, args.gemini_min_interval_sec),
        "gemini_max_retries": max(0, args.gemini_max_retries),
        "gemini_api_key": os.getenv("GEMINI_API_KEY"),
    }
    graph = build_graph()
    final_state = graph.invoke(initial_state)
    if final_state.get("error"):
        raise SystemExit(f"분석 실패: {final_state['error']}")

    report = final_state.get("report", {})
    if report.get("video_id"):
        print(f"video_id: {report.get('video_id')}")
    print(f"총 댓글: {report.get('total_comments', 0)}")
    print(f"악성 후보: {report.get('bad_comment_count', 0)} ({report.get('bad_comment_ratio', 0)}%)")
    print(f"카테고리 분포: {report.get('category_breakdown', {})}")
    print(f"룰 판정 분포: {report.get('rule_decision_breakdown', {})}")
    print(f"최종 판정 분포: {report.get('final_decision_breakdown', {})}")
    print(
        f"애매 댓글: {report.get('ambiguous_count', 0)}, "
        f"Gemini 재판정: {report.get('gemini_checked_count', 0)}, "
        f"Gemini 스킵: {report.get('gemini_skipped_count', 0)}"
    )
    print(f"리포트 저장: {args.output}")

    show_n = max(0, args.show)
    if show_n > 0:
        print("\n악성 후보 샘플:")
        for i, row in enumerate(report.get("bad_comments", [])[:show_n], start=1):
            snippet = str(row.get("text", "")).replace("\n", " ")
            if len(snippet) > 120:
                snippet = snippet[:117] + "..."
            print(f"{i}. {row.get('hit_categories', [])} | {snippet}")


if __name__ == "__main__":
    main()
