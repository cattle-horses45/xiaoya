from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "mysql+pymysql://root:password@localhost:3306/yali_phone"

    # JWT
    secret_key: str = "yali-phone-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # DeepSeek API
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"

    # App
    app_name: str = "鸭梨手机AI客服"
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
