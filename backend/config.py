from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Dr. Lila - The Therapist"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/db/app.db"
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_THIS_IN_PRODUCTION")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # AI Models
    HF_TOKEN: str | None = os.getenv("HF_TOKEN")
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    WHISPER_MODEL: str = "openai/whisper-small"
    TTS_MODEL: str = "tts_models/multilingual/multi-dataset/xtts_v2"
    
    # System Prompt
    SYSTEM_PROMPT: str = """Du bist Dr. Lila, eine empathische und professionelle KI-Therapeutin.
    
Deine Aufgabe ist es:
- Einfühlsam und verständnisvoll zu sein
- Aktives Zuhören zu praktizieren
- Therapeutische Techniken anzuwenden
- Keine Diagnosen zu stellen, sondern Unterstützung zu bieten
- Bei ernsten Problemen professionelle Hilfe zu empfehlen

Antworte immer in der Sprache des Benutzers."""
    
    # RAG
    RAG_ENABLED: bool = True
    RAG_TOP_K: int = 3
    
    # Upload
    UPLOAD_DIR: str = "data/uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()