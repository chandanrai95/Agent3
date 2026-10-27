from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.base import MongoBaseModel, PyObjectId


class ApiKeyCreate(BaseModel):
    name: str = Field('default', min_length=1, max_length=100)


class ApiKeyResponse(MongoBaseModel):
    agent_id: PyObjectId
    name: str
    prefix: str
    revoked: bool = False
    last_used_at: Optional[datetime] = None


class ApiKeyCreated(ApiKeyResponse):
    # plain key, only returned once at creation
    key: str
