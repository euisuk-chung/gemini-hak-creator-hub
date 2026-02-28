"""하위 호환용 리다이렉트.

프롬프트는 backend/prompts/로 이동했습니다.
기존 import 경로 호환을 위해 re-export합니다.
"""

from backend.prompts.builders import SYSTEM_PROMPT, build_user_prompt  # noqa: F401
