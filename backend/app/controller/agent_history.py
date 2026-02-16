from fastapi import HTTPException, status
from app.models import user_schema, agent_history_schema
from datetime import datetime
from bson import ObjectId


async def create_user_agent_history(db, user: user_schema.UserResponse, agent_history: agent_history_schema.AgentHistoryCreate):
    user_id = user["_id"]

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")

    if not agent_history.agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent id is required.")

    agent_history = agent_history.dict()

    agent_history["user_id"] = ObjectId(user_id)
    agent_history["created_at"] = datetime.utcnow()
    agent_history["updated_at"] = datetime.utcnow()

    result = await db.agent_history.insert_one(agent_history)

    return db.agent_history.find_one({"_id": result.inserted_id})


async def get_user_history_by_agent_id(db, user: user_schema.UserResponse, agent_id: str):
    user_id = user["_id"]
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")

    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent id is required.")
    history = []
    cursor = db.agent_history.find({
        # user_id: ObjectId(user_id),
        'agent_id': ObjectId(agent_id)
    })

    async for doc in cursor:
        history.append(doc)

    return history
