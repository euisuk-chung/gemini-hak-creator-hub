"""프롬프트 템플릿 로더.

templates/ 디렉토리에서 .txt 파일을 읽어 반환한다.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


@lru_cache(maxsize=32)
def load_template(name: str) -> str:
    """템플릿 파일을 읽어 반환. 결과는 캐싱된다.

    Args:
        name: 템플릿 파일명 (확장자 제외). e.g. "comment_tagging_system"

    Returns:
        템플릿 텍스트.

    Raises:
        FileNotFoundError: 해당 템플릿이 없을 때.
    """
    path = _TEMPLATES_DIR / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(f"프롬프트 템플릿 없음: {path}")
    return path.read_text(encoding="utf-8").strip()
