"""프롬프트 관리 모듈.

templates/ 디렉토리의 .txt 파일로 프롬프트 텍스트를 관리하고,
builders 모듈에서 동적 조립 로직을 제공한다.
"""

from backend.prompts.loader import load_template
from backend.prompts.builders import build_user_prompt, SYSTEM_PROMPT

__all__ = ["load_template", "build_user_prompt", "SYSTEM_PROMPT"]
