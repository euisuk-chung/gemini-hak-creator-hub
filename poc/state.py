from typing import Any, Literal, TypedDict


RuleDecision = Literal["auto_safe", "auto_toxic", "ambiguous"]
FinalDecision = Literal["safe", "toxic", "ambiguous"]
InputSource = Literal["comments_file", "comments_arg", "result_json", "youtube_api"]


class CommentItem(TypedDict, total=False):
    author: str | None
    text: str


class CommentAnalysisRow(TypedDict, total=False):
    index: int
    author: str | None
    text: str
    normalized: str
    rule_decision: RuleDecision
    final_decision: FinalDecision
    hit_categories: list[str]
    trigger_names: dict[str, list[str]]
    gemini: dict[str, Any] | None


class PipelineState(TypedDict, total=False):
    input_path: str | None
    video: str | None
    max_comments: int
    comments_file: str | None
    comments_json: str | None
    output_path: str
    use_gemini: bool
    gemini_model: str
    gemini_max_check: int
    gemini_min_interval_sec: float
    gemini_max_retries: int
    gemini_api_key: str | None

    source: InputSource
    video_id: str | None
    comments: list[CommentItem]

    category_counter: dict[str, int]
    rule_decision_counter: dict[str, int]
    final_decision_counter: dict[str, int]
    results: list[CommentAnalysisRow]
    ambiguous_indices: list[int]
    gemini_checked_count: int
    gemini_skipped_count: int

    report: dict[str, Any]
    error: str | None
