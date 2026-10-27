import hashlib
import secrets
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status

from app.models import api_key_schema

KEY_PREFIX = "ak_"


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def create_api_key(db, agent: dict, payload: api_key_schema.ApiKeyCreate):
    key = KEY_PREFIX + secrets.token_urlsafe(32)
    now = datetime.utcnow()
    doc = {
        "agent_id": ObjectId(agent["_id"]),
        "user_id": agent["user_id"],
        "name": payload.name,
        "prefix": key[:10],
        "key_hash": hash_api_key(key),
        "revoked": False,
        "last_used_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.api_keys.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {**doc, "key": key}


async def list_api_keys(db, agent: dict):
    keys = []
    async for doc in db.api_keys.find({"agent_id": ObjectId(agent["_id"])}).sort("created_at", -1):
        keys.append(doc)
    return keys


async def revoke_api_key(db, agent: dict, key_id: str):
    if not ObjectId.is_valid(key_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    result = await db.api_keys.update_one(
        {"_id": ObjectId(key_id), "agent_id": ObjectId(agent["_id"])},
        {"$set": {"revoked": True, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    return {"success": True}


async def get_agent_by_api_key(db, key: str):
    api_key = await db.api_keys.find_one({"key_hash": hash_api_key(key), "revoked": False})
    if not api_key:
        return None
    await db.api_keys.update_one({"_id": api_key["_id"]}, {"$set": {"last_used_at": datetime.utcnow()}})
    return await db.agents.find_one({"_id": api_key["agent_id"], "user_id": api_key["user_id"]})
