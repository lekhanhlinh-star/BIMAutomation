from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FastAPI Backend"
    environment: str = "development"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"
    secret_key: str = "CHANGE_THIS_SECRET_KEY_FOR_PRODUCTION_MIN_32_CHARS"
    database_url: str = "sqlite+aiosqlite:///./app.db"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost/auth/google/callback"
    frontend_origin: str = "http://localhost"
    frontend_reset_url: str = "http://localhost/reset-password"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_sender: str = ""
    smtp_use_tls: bool = True
    bank_code: str = "MB"
    bank_account: str = "00000000000"
    bank_holder: str = "BIMPilot"
    webhook_secret: str = "supersecretwebhookkey"
    sepay_api_key: str = "sepay_secret_api_key_12345"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
