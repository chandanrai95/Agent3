from bson import ObjectId
from langchain_core.messages import HumanMessage, AIMessage

async def load_chat_history(db, agent_id: str):
    history = []
    cursor =  db.agent_history.find({
        agent_id
    })
    for doc in cursor:
        history.append(doc)

    return history



async def chat_agent_history(db, agent_id: str, limit: int = 4):
    print(f"chat_agent_history {db}")
    history = []
    cursor =  db.agent_history.find({
        "agent_id": ObjectId(agent_id)
    }).sort("created_at", -1).limit(limit)
    async for doc in cursor:
        history.append(HumanMessage(content=doc['question']))
        history.append(AIMessage(content=doc['answer']))


    return list(reversed(history))