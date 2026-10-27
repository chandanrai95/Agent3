from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status, UploadFile

from app.helper.RagPipeline import RagPipeline
from app.helper.source import get_sources
from app.helper.upload import upload_document


async def ingest_upload(agent: dict, file: UploadFile, thread_id: Optional[str] = None):
    file_path = await upload_document(file)
    try:
        return await RagPipeline(agent).ingest(file_path, file.filename, thread_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    finally:
        file_path.unlink(missing_ok=True)


async def list_documents(db, agent: dict, thread_id: Optional[str] = None):
    # thread_id None -> agent-level (shared) documents only
    return await get_sources(db, {
        "agent_id": ObjectId(agent["_id"]),
        "thread_id": ObjectId(thread_id) if thread_id else None,
    })


async def delete_document(db, agent: dict, source_id: str, thread_id: Optional[str] = None):
    if not ObjectId.is_valid(source_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    source = await db.sources.find_one({
        "_id": ObjectId(source_id),
        "agent_id": ObjectId(agent["_id"]),
        "thread_id": ObjectId(thread_id) if thread_id else None,
    })
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    await RagPipeline(agent).delete_source_chunks(source["_id"])
    await db.sources.delete_one({"_id": source["_id"]})
    return {"success": True}
