import logging
import os
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "BIMAutomation AI Visualizer Service"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8010

    # Google Gemini & GenAI
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    DEFAULT_VISION_MODEL: str = "gemini-3.6-flash"
    DEFAULT_IMAGE_MODEL: str = "gemini-3.1-flash-image"
    GOOGLE_GENAI_USE_VERTEXAI: bool = False

    MOCK_RENDER_ENABLED: bool = False
    RENDER_TIMEOUT_SECONDS: float = 240

    # Storage Paths
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    INPUTS_DIR: str = str(BASE_DIR / "storage" / "inputs")
    OUTPUTS_DIR: str = str(BASE_DIR / "storage" / "outputs")
    SAMPLE_DATA_DIR: str = str(BASE_DIR / "sample_data")

    # Service Base URL for generating image links
    BASE_URL: str = "http://localhost:8010"

    # Langfuse Observability & Tracing
    LANGFUSE_PUBLIC_KEY: str = os.getenv("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_SECRET_KEY: str = os.getenv("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_BASE_URL: str = os.getenv("LANGFUSE_BASE_URL", os.getenv("LANGFUSE_HOST", "https://us.cloud.langfuse.com"))
    LANGFUSE_ENABLED: bool = True

    LOG_LEVEL: str = "INFO"

    @property
    def is_langfuse_enabled(self) -> bool:
        return bool(self.LANGFUSE_ENABLED and self.LANGFUSE_PUBLIC_KEY and self.LANGFUSE_SECRET_KEY)

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.INPUTS_DIR, exist_ok=True)
os.makedirs(settings.OUTPUTS_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_DATA_DIR, exist_ok=True)

# Structured Logging Setup
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai_visualizer")
