from typing import Optional

from app.models.base import MongoBaseModel, PyObjectId


class SourceModel (MongoBaseModel):
    agent_id: PyObjectId
    thread_id: Optional[PyObjectId] = None
    type: str
    source_name: str
    status: str = "ready"
    chunk_count: Optional[int] = None
    # chunks per content type, e.g. {"text": 12, "table": 3, "image": 2, "scanned_page": 4}
    content_stats: Optional[dict] = None
    images_processed: Optional[int] = None
    images_skipped: Optional[int] = None
