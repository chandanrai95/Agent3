from datetime import datetime

from bson import ObjectId


async def createSource(db, agent_id: str, source_path: str, type: str = "document"):
    source_name = source_path.split("/")[-1]

    payload = {
        "agent_id": ObjectId(agent_id),
        "type": type,
        "source_name": source_name,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    source = await db.sources.insert_one(payload)

    return source

async def get_sources (db, query):
    cursor = db.sources.find(query)
    sources = []
    async for doc in cursor:
        sources.append(doc)

    return sources
