from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = 'Real Estate AI Backend'
    openai_model: str = 'gpt-4o-mini'
