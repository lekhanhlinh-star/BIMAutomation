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
    google_redirect_uri: str = "https://app.bimautomation.solutions/auth/google/callback"
    frontend_origin: str = "https://app.bimautomation.solutions"
    frontend_reset_url: str = "https://app.bimautomation.solutions/reset-password"
    smtp_host: str = "smtp.hostinger.com"
    smtp_port: int = 465
    smtp_username: str = "support@bimautomation.solutions"
    smtp_password: str = ""
    smtp_from_name: str = "BIM Automation"
    smtp_sender: str = ""
    smtp_use_tls: bool = False
    smtp_use_ssl: bool = True
    bank_code: str = "MBBank"
    bank_account: str = "0911972242"
    bank_holder: str = "LE KHANH LINH"
    webhook_secret: str = "supersecretwebhookkey"
    sepay_api_key: str = "sepay_secret_api_key_12345"
    license_hmac_secret: str = "bimauto_telemetry_secure_sign_2026"
    license_rsa_private_key: str = ""
    license_rsa_private_key_path: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
