from fastapi import HTTPException, status
from bson import ObjectId

from app.helper.source import get_sources


async def get_sources_by_agent_id(db, agent_id: str, user_id: str):
    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Agent id is required.')
    if not ObjectId.is_valid(agent_id) or not await db.agents.find_one({"_id": ObjectId(agent_id), "user_id": ObjectId(user_id)}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Agent not found.')
    # agent-level documents only, thread documents are listed per thread
    query = {"agent_id": ObjectId(agent_id), "thread_id": {"$in": [None]}}

    sources = await get_sources(db, query)
    return sources
