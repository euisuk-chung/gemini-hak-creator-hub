from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# .env 로드 (프로젝트 루트)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Settings(BaseSettings):
    youtube_api_key: str = Field(default="")
    google_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.0-flash")

    # Rule pre-screen 임계값 (이 점수 미만이고 카테고리 없으면 AI 스킵)
    prescreen_threshold: int = Field(default=20)

    # scripts/ 경로 (korean_profanity import용)
    project_root: Path = Field(default_factory=lambda: Path(__file__).resolve().parent.parent)

    model_config = {"env_file": str(_env_path), "extra": "ignore"}


settings = Settings()
