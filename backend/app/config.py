from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    virustotal_api_key: str = ""
    abuseipdb_api_key: str = ""
    elasticsearch_url: str = "http://localhost:9200"
    otx_api_key: str = ""
    abusech_api_key: str = ""
    auth_required: bool = False
    jwt_secret: str = "change-this-local-secret"
    bootstrap_admin_username: str = "admin"
    bootstrap_admin_password: str = "ChangeMe!2026"
    maintenance_enabled: bool = True
    maintenance_interval_minutes: int = 30
    feed_scheduler_enabled: bool = False
    feed_scheduler_interval_minutes: int = 5
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
