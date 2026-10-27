import asyncio
from langchain_openai import OpenAIEmbeddings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import  MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_mongodb.index import create_vector_search_index, update_vector_search_index

from typing import Optional

from app.config.setting import DATABASE_URL, MONGO_DB, EMBEDDINGS_COLLECTION, VECTOR_INDEX_NAME, EMBEDDING_DIMENSIONS
import certifi

client: Optional[AsyncIOMotorClient] = None
db = None

# a single sync client shared by every vector store (creating one per request leaks connections)
_pymongo_client: Optional[MongoClient] = None
_vector_stores: dict = {}

# fields used in vector search pre_filter, Atlas rejects filters on fields not declared in the index
VECTOR_FILTER_FIELDS = ["agent_id", "thread_id", "source_id"]
SHARED_THREAD = "shared"

#I want to use and modify variables defined at the module (global) level, not create new local ones. other wise it will create a local variables to function scope

async def connect_mongo():
    global client, db

    if client is None:
        client = AsyncIOMotorClient(
            DATABASE_URL,
            maxPoolSize=20,
            minPoolSize=5,
            tls=True,
            tlsCAFile=certifi.where(),
        )
        db = client[MONGO_DB]
        await db.command("ping")
        print(f"Connected to MongoDB → {MONGO_DB}")
        await ensure_indexes()


async def close_mongo():
    global client, _pymongo_client
    if client:
        client.close()
        client = None
    if _pymongo_client:
        _pymongo_client.close()
        _pymongo_client = None
        _vector_stores.clear()


def get_pymongo_client() -> MongoClient:
    global _pymongo_client
    if _pymongo_client is None:
        _pymongo_client = MongoClient(
            DATABASE_URL,
            tls=True,
            tlsCAFile=certifi.where(),
        )
    return _pymongo_client


def getVectorStoreDb(collection_name: str = EMBEDDINGS_COLLECTION, index_name=VECTOR_INDEX_NAME):
    key = (collection_name, index_name)
    if key not in _vector_stores:
        vector_db = get_pymongo_client()[MONGO_DB]
        _vector_stores[key] = MongoDBAtlasVectorSearch(
            collection=vector_db[collection_name],
            embedding=OpenAIEmbeddings(),
            index_name=index_name,
        )

    return _vector_stores[key]


def _ensure_vector_index():
    collection = get_pymongo_client()[MONGO_DB][EMBEDDINGS_COLLECTION]
    existing = next(iter(collection.list_search_indexes(VECTOR_INDEX_NAME)), None)

    if existing is None:
        create_vector_search_index(
            collection=collection,
            index_name=VECTOR_INDEX_NAME,
            dimensions=EMBEDDING_DIMENSIONS,
            path="embedding",
            similarity="cosine",
            filters=VECTOR_FILTER_FIELDS,
        )
        print(f"Created vector index {VECTOR_INDEX_NAME}")
        return

    fields = existing.get("latestDefinition", {}).get("fields", [])
    filter_paths = {f["path"] for f in fields if f.get("type") == "filter"}
    if set(VECTOR_FILTER_FIELDS).issubset(filter_paths):
        return

    vector_field = next((f for f in fields if f.get("type") == "vector"), {})
    update_vector_search_index(
        collection=collection,
        index_name=VECTOR_INDEX_NAME,
        dimensions=vector_field.get("numDimensions", EMBEDDING_DIMENSIONS),
        path=vector_field.get("path", "embedding"),
        similarity=vector_field.get("similarity", "cosine"),
        filters=VECTOR_FILTER_FIELDS,
    )
    print(f"Updated vector index {VECTOR_INDEX_NAME} with filters {VECTOR_FILTER_FIELDS}")


async def ensure_indexes():
    # chunks uploaded before threads existed belong to the whole agent
    await db[EMBEDDINGS_COLLECTION].update_many(
        {"thread_id": {"$exists": False}},
        {"$set": {"thread_id": SHARED_THREAD}}
    )
    await db.threads.create_index([("agent_id", 1), ("external_user_id", 1), ("updated_at", -1)])
    await db.messages.create_index([("thread_id", 1), ("created_at", 1)])
    await db.sources.create_index([("agent_id", 1), ("thread_id", 1)])
    await db.api_keys.create_index("key_hash", unique=True)

    try:
        await asyncio.to_thread(_ensure_vector_index)
    except Exception as e:
        # Atlas search index management needs an M10+ cluster or Atlas CLI permissions on some tiers
        print(f"WARNING: could not verify vector index '{VECTOR_INDEX_NAME}': {e}. "
              f"Make sure it declares filter fields {VECTOR_FILTER_FIELDS}.")
