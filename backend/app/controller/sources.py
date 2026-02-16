from fastapi import HTTPException, status
from bson import ObjectId

from app.helper.source import get_sources


async def get_sources_by_agent_id(db, agent_id: str, user_id: str):
    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Agent id is required.')
    query = {"agent_id": ObjectId(agent_id)}

    sources = await get_sources(db, query)
    return sources
