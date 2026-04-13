from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load .env from the backend/ directory, regardless of CWD
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Azure OpenAI
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_api_version: str = "2024-12-01-preview"

    # Azure OpenAI deployment names (must match your Azure portal deployment names)
    gpt4o_deployment: str = "gpt-4o"
    gpt4o_mini_deployment: str = "gpt-4o"       # user has single gpt-4o deployment
    whisper_deployment: str = "whisper"
    embedding_deployment: str = "text-embedding-3-small"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""


settings = Settings()
