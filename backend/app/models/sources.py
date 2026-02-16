from app.models.base import MongoBaseModel, PyObjectId


class SourceModel (MongoBaseModel):
    agent_id: PyObjectId
    type: str
    source_name: str