from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status
from openai import AsyncOpenAI, AuthenticationError, OpenAIError

from app.config.setting import FREE_TOKEN_LIMIT
from app.helper.credentials import encrypt_secret, get_usage, resolve_credentials


async def get_settings(db, user_id) -> dict:
    settings = await db.user_settings.find_one({"user_id": ObjectId(user_id)}) or {}
    credentials = await resolve_credentials(db, user_id)
    usage = await get_usage(db, user_id)
    return {
        "has_openai_key": credentials.own_key,
        "openai_key_hint": settings.get("openai_key_hint") if credentials.own_key else None,
        "openai_key_updated_at": settings.get("openai_key_updated_at"),
        "usage": {**usage, "limit": None if credentials.own_key else FREE_TOKEN_LIMIT},
    }


async def set_openai_key(db, user_id, api_key: str) -> dict:
    api_key = api_key.strip()
    # a cheap authenticated call, so a typo is caught now and not in the middle of a chat
    try:
        await AsyncOpenAI(api_key=api_key, max_retries=0, timeout=15).models.list()
    except AuthenticationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OpenAI rejected this API key.")
    except OpenAIError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Could not verify the key with OpenAI: {e}")

    await db.user_settings.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {
            "openai_api_key": encrypt_secret(api_key),
            "openai_key_hint": f"{api_key[:3]}…{api_key[-4:]}",
            "openai_key_updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    return await get_settings(db, user_id)


async def remove_openai_key(db, user_id) -> dict:
    await db.user_settings.update_one(
        {"user_id": ObjectId(user_id)},
        {"$unset": {"openai_api_key": "", "openai_key_hint": ""}, "$set": {"openai_key_updated_at": datetime.utcnow()}},
    )
    return await get_settings(db, user_id)
