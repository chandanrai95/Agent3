from app.models.base import MongoBaseModel, PyObjectId
from pydantic import Field, BaseModel

class AgentHistoryModel(MongoBaseModel):
    user_id: PyObjectId
    agent_id: PyObjectId
    question: str = Field(..., min_length=6, max_length=255)
    answer: str = Field(..., min_length=6, max_length=255)

class AgentHistoryResponse(MongoBaseModel):
    user_id: PyObjectId
    agent_id: PyObjectId
    question: str
    answer: str

class AgentHistoryCreate(BaseModel):
    agent_id: PyObjectId
    question: str = Field(..., min_length=6, max_length=255)
    answer: str = Field(..., min_length=6, max_length=255)