from pydantic_settings import BaseSettings
from typing import Optional, Literal
import os
from pathlib import Path
from functools import lru_cache
import logging

class Settings(BaseSettings):
    # Environment configuration
    ENVIRONMENT: Literal["development", "staging", "production"] = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Application settings
    APP_NAME: str = "All in One Company"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # CORS settings
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://allinonecomp-1.onrender.com"
    ]
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/epm_tool")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres123")
    POSTGRES_FALLBACK_PASSWORD: str = os.getenv("POSTGRES_FALLBACK_PASSWORD", "postgres123")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "epm_tool")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DOCKER_ENV: bool = os.getenv("DOCKER_ENV", "false").lower() in ("true", "1", "t")
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Security settings
    SECURE_COOKIES: bool = os.getenv("SECURE_COOKIES", "true").lower() == "true"
    SESSION_COOKIE_NAME: str = "session"
    SESSION_SECRET_KEY: str = os.getenv("SESSION_SECRET_KEY", "your-session-secret-key")
    
    # Frontend URL for CORS and redirects
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@allinonecomp.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "All in One Company")
    
    # File upload settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields instead of raising validation error
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_staging(self) -> bool:
        return self.ENVIRONMENT == "staging"
    
    @property
    def database_url_async(self) -> str:
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    @property
    def allowed_origins(self) -> list[str]:
        # Always include the frontend URL in allowed origins
        origins = list(set(self.BACKEND_CORS_ORIGINS + [self.FRONTEND_URL]))
        # Add HTTPS version if HTTP is provided and vice versa
        for origin in origins.copy():
            if origin.startswith("http://"):
                https_origin = origin.replace("http://", "https://")
                if https_origin not in origins:
                    origins.append(https_origin)
            elif origin.startswith("https://"):
                http_origin = origin.replace("https://", "http://")
                if http_origin not in origins:
                    origins.append(http_origin)
        return origins

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Create settings instance
settings = get_settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format=settings.LOG_FORMAT,
)

# Log configuration at startup
logger = logging.getLogger(__name__)
logger.info(f"Loaded settings for {settings.ENVIRONMENT} environment")
logger.debug(f"Database URL: {settings.DATABASE_URL}")
logger.debug(f"Allowed origins: {settings.allowed_origins}")