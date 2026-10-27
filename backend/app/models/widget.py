import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator

_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/").lower()


class WidgetSettingsUpdate(BaseModel):
    enabled: bool = False
    # e.g. "https://www.example.com"; empty = any website may embed the widget
    allowed_origins: list[str] = Field(default_factory=list, max_length=20)
    title: str = Field("Ask us anything", min_length=1, max_length=60)
    greeting: str = Field("Hi! How can I help you today?", max_length=300)
    accent_color: str = "#8083ff"

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, origins: list[str]) -> list[str]:
        cleaned = []
        for origin in origins:
            origin = normalize_origin(origin)
            if not origin:
                continue
            if not re.fullmatch(r"https?://[a-z0-9.-]+(:\d+)?", origin):
                raise ValueError(f"'{origin}' is not an origin like https://www.example.com")
            cleaned.append(origin)
        return sorted(set(cleaned))

    @field_validator("accent_color")
    @classmethod
    def validate_color(cls, color: str) -> str:
        if not _COLOR.match(color):
            raise ValueError("accent_color must be a hex color like #8083ff")
        return color


class WidgetSettings(WidgetSettingsUpdate):
    public_key: Optional[str] = None


class WidgetMessageRequest(BaseModel):
    visitor_id: str = Field(..., pattern=r"^[A-Za-z0-9_-]{8,64}$")
    thread_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
