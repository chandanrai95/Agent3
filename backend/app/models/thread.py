from datetime import datetime
from typing import Optional, Literal

from bson import ObjectId
from pydantic import BaseModel, Field, field_validator

from app.models.base import MongoBaseModel, PyObjectId


class ThreadCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    # id of the end user in the integrating project, lets them keep threads per user
    external_user_id: Optional[str] = Field(None, max_length=255)
    metadata: dict = {}


class ThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    metadata: Optional[dict] = None


class ThreadResponse(MongoBaseModel):
    agent_id: PyObjectId
    title: Optional[str] = None
    external_user_id: Optional[str] = None
    metadata: dict = {}


class SourceRef(BaseModel):
    source_id: Optional[str] = None
    source_name: str
    snippet: str
    score: Optional[float] = None
    page: Optional[int] = None
    content_type: Optional[str] = None


class MessageResponse(MongoBaseModel):
    thread_id: PyObjectId
    role: Literal["user", "assistant"]
    content: str
    sources: list[SourceRef] = []


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    stream: bool = False
    # restrict retrieval to these documents, default is every document of the thread + agent-level docs
    source_ids: Optional[list[str]] = None

    @field_validator("source_ids")
    @classmethod
    def validate_source_ids(cls, v):
        if v and not all(ObjectId.is_valid(s) for s in v):
            raise ValueError("source_ids must be valid document ids")
        return v


class ChatResponse(BaseModel):
    thread_id: str
    message_id: str
    answer: str
    sources: list[SourceRef]
    created_at: datetime
