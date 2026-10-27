from typing import Optional

from app.models.base import MongoBaseModel, PyObjectId


class SourceModel (MongoBaseModel):
    agent_id: PyObjectId
    thread_id: Optional[PyObjectId] = None
    type: str
    source_name: str
    status: str = "ready"
    chunk_count: Optional[int] = None
