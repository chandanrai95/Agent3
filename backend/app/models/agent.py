from typing import Optional

from app.models.base import MongoBaseModel, PyObjectId
from pydantic import BaseModel, Field

class AgentModel(MongoBaseModel):
    user_id: PyObjectId
    name: str
    role: str
    model: str
    api_key: str

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=6, max_length=255)
    role: str  = 'You are an assistant'
    model: str = 'gpt-4.1-mini'

class AgentResponse(MongoBaseModel):
    user_id: PyObjectId
    name: str
    role: str
    model: str

class AgentStreamRequest(BaseModel):
    message: str
    source: Optional[str] = None

class AgentModelUpdate(BaseModel):
    model: str

class AgentRoleUpdate(BaseModel):
    role: str

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None