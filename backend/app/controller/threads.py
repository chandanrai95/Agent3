from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.config.setting import EMBEDDINGS_COLLECTION
from app.models import thread_schema


async def create_thread(db, agent: dict, payload: thread_schema.ThreadCreate):
    now = datetime.utcnow()
    thread = {
        **payload.model_dump(),
        "agent_id": ObjectId(agent["_id"]),
        "user_id": agent["user_id"],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.threads.insert_one(thread)
    return await db.threads.find_one({"_id": result.inserted_id})


async def list_threads(db, agent: dict, external_user_id: Optional[str] = None, limit: int = 50, skip: int = 0):
    query = {"agent_id": ObjectId(agent["_id"])}
    if external_user_id:
        query["external_user_id"] = external_user_id

    threads = []
    cursor = db.threads.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    async for doc in cursor:
        threads.append(doc)
    return threads


async def get_thread(db, agent: dict, thread_id: str):
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found.")

    thread = await db.threads.find_one({"_id": ObjectId(thread_id), "agent_id": ObjectId(agent["_id"])})
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found.")
    return thread


async def update_thread(db, agent: dict, thread_id: str, payload: thread_schema.ThreadUpdate):
    thread = await get_thread(db, agent, thread_id)
    await db.threads.update_one(
        {"_id": thread["_id"]},
        {"$set": {**payload.model_dump(exclude_unset=True), "updated_at": datetime.utcnow()}}
    )
    return await db.threads.find_one({"_id": thread["_id"]})


async def delete_thread(db, agent: dict, thread_id: str):
    thread = await get_thread(db, agent, thread_id)
    await db[EMBEDDINGS_COLLECTION].delete_many({"thread_id": str(thread["_id"])})
    await db.sources.delete_many({"thread_id": thread["_id"]})
    await db.messages.delete_many({"thread_id": thread["_id"]})
    await db.threads.delete_one({"_id": thread["_id"]})
    return {"success": True}


async def list_messages(db, agent: dict, thread_id: str, limit: int = 100):
    thread = await get_thread(db, agent, thread_id)
    messages = []
    cursor = db.messages.find({"thread_id": thread["_id"]}).sort("created_at", 1).limit(limit)
    async for doc in cursor:
        messages.append(doc)
    return messages
