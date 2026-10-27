from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OpenAIKeyUpdate(BaseModel):
    api_key: str = Field(..., min_length=20, max_length=300)


class UsageResponse(BaseModel):
    # all-time totals
    tokens: int
    # tokens spent on the platform key, counted against the free allowance
    free_tokens_used: int
    by_kind: dict
    # free allowance, None = unlimited (the user pays with their own key)
    limit: Optional[int]


class SettingsResponse(BaseModel):
    has_openai_key: bool
    openai_key_hint: Optional[str] = None
    openai_key_updated_at: Optional[datetime] = None
    usage: UsageResponse
