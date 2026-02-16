from datetime import datetime
from fastapi import HTTPException, status
from app.models import agent_schema, user_schema
from bson import ObjectId


async def get_user_all_agents(db, user: user_schema.UserResponse):
    user_id = ObjectId(user["_id"])

    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not logged in")

    agents = []
    cussor = db.agents.find({
        "user_id": user_id
    })

    async for doc in cussor:
        agents.append(doc)

    return agents


async def get_agent_byid(db, user: user_schema.UserResponse, agent_id: str):
    user_id = ObjectId(user["_id"])
    print(f"get_agent_byid {user_id}")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not logged in")

    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task id is required.")

    agent = await db.agents.find_one({
        "_id": ObjectId(agent_id),
        "user_id": user_id
    })

    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return agent


async def create_user_agent(db, user: user_schema.UserResponse, agent: agent_schema.AgentCreate):
    user_id = user["_id"]
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")

    agent = agent.dict()
    agent['user_id'] = ObjectId(user_id)
    agent['created_at'] = datetime.utcnow()
    agent['updated_at'] = datetime.utcnow()

    result = await db.agents.insert_one(agent)
    created_agent = await  db.agents.find_one({"_id": result.inserted_id})

    return created_agent


async def update_user_agent(db, user: user_schema.UserResponse, agent_id: str, agent: agent_schema.AgentCreate):
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")

    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent id is required.")

    _agent = await  db.agents.find_one({"_id": ObjectId(agent_id)})

    if not _agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    agent = agent.dict()

    result = await db.agents.update_one(
        {"_id": ObjectId(agent_id), "user_id": ObjectId(user_id)},
        {
            "$set": {
                **agent,
                "updated_at": datetime.utcnow()
            }
        }
    )

    print(f"result {result}")

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent not found.")

    updated_agent = await db.agents.find_one({"_id": ObjectId(agent_id)})

    return updated_agent


async def delete_user_agent(db, user: user_schema.UserResponse, agent_id: str):
    user_id = user._id

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")

    if not agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent id is required.")

    result = await db.agents.delete_one({"_id": ObjectId(agent_id)})

    if result.deleted_count == 0:
        return {"success": False}

    return {"success": True}


async def update_agent_role_by_id(db, agent_id: str, user_id: str, model: str):
    agent = await db.agents.find_one({
        "_id": ObjectId(agent_id),
        "user_id": user_id
    })

    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Agent not found.')

    result = await db.agents.update_one(
        {"_id": ObjectId(agent_id)},
        {
            '$set': {
                **agent,
                'model': model,
                'updated_at': datetime.now()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent not found.")

    updated_agent = await db.agents.find_one({"_id": ObjectId(agent_id)})

    return updated_agent

async def update_agent_by_id(db, agent_id: str, user_id: str, _agent: agent_schema.AgentUpdate):
    agent = await db.agents.find_one({
        "_id": ObjectId(agent_id),
        "user_id": user_id
    })

    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Agent not found.')

    result = await db.agents.update_one(
        {"_id": ObjectId(agent_id)},
        {
            '$set': {
                **agent,
                **_agent.model_dump(exclude_unset=True)
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent not found.")

    updated_agent = await db.agents.find_one({"_id": ObjectId(agent_id)})

    return updated_agent
