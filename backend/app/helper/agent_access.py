from bson import ObjectId
from fastapi import HTTPException, Request, status, Header
from typing import Optional

import app.config.database as database
from app.controller.api_keys import get_agent_by_api_key


async def get_owned_agent(request: Request, agent_id: str):
    """Dashboard (JWT) access: the agent must belong to the logged in user."""
    if not ObjectId.is_valid(agent_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    agent = await database.db.agents.find_one({
        "_id": ObjectId(agent_id),
        "user_id": ObjectId(request.state.user["_id"]),
    })
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return agent


async def get_api_agent(
    x_api_key: Optional[str] = Header(None, description="Agent API key"),
    authorization: Optional[str] = Header(None, description="Bearer <agent API key>"),
):
    """Public API access: the agent is resolved from its API key."""
    key = x_api_key or (authorization or "").removeprefix("Bearer ").strip()
    agent = await get_agent_by_api_key(database.db, key) if key else None
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key. Send it as 'X-API-Key: <key>' or 'Authorization: Bearer <key>'.",
        )
    return agent
