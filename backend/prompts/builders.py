"""프롬프트 동적 조립 로직.

템플릿 로딩 + transcript 샘플링 + 사용자 프롬프트 빌드.
"""

from __future__ import annotations

from backend.prompts.loader import load_template

# ─── 시스템 프롬프트 (캐싱된 템플릿 로드) ────────────────────

SYSTEM_PROMPT: str = load_template("comment_tagging_system")

# ─── Transcript 샘플링 ──────────────────────────────────────

MAX_TRANSCRIPT_CHARS = 2000
"""LLM에 전달할 transcript 최대 글자수."""


def _sample_transcript(transcript: str, max_chars: int = MAX_TRANSCRIPT_CHARS) -> str:
    """Transcript를 3등분하여 각 구간에서 균등 샘플링.

    전체가 max_chars 이하면 그대로 반환.
    초과 시 앞·중간·끝 각 1/3씩 잘라 합친다.
    이를 통해 영상 도입부, 핵심 내용, 마무리를 모두 커버한다.
    """
    if len(transcript) <= max_chars:
        return transcript

    chunk = max_chars // 3
    total = len(transcript)
    mid_start = (total - chunk) // 2

    head = transcript[:chunk]
    middle = transcript[mid_start : mid_start + chunk]
    tail = transcript[total - chunk :]

    return (
        f"{head}\n"
        f"... (중략) ...\n"
        f"{middle}\n"
        f"... (중략) ...\n"
        f"{tail}"
    )


# ─── 사용자 프롬프트 빌드 ────────────────────────────────────

def build_user_prompt(comment_text: str, transcript: str = "") -> str:
    """사용자 프롬프트 생성: 댓글 + transcript 맥락.

    transcript가 있으면 3등분 샘플링 후 맥락 포함 템플릿,
    없으면 댓글만 포함하는 템플릿을 사용.
    """
    if transcript:
        sampled = _sample_transcript(transcript)
        template = load_template("comment_analysis_user")
        return template.format(
            transcript_context=sampled,
            comment_text=comment_text,
        )

    template = load_template("comment_analysis_user_no_context")
    return template.format(comment_text=comment_text)
