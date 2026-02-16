from langchain_openai import OpenAIEmbeddings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import  MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch

from typing import Optional

from app.config.setting import DATABASE_URL, MONGO_DB
import certifi

client: Optional[AsyncIOMotorClient] = None
db = None

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


async def close_mongo():
    global client
    if client:
        client.close()
        client = None

def getVectorStoreDb(collection_name: str = 'embeddings', index_name='vector_index'):
    pymongo_client = MongoClient(
        DATABASE_URL,
        tls=True,
        tlsCAFile=certifi.where(),
    )
    vector_db = pymongo_client[MONGO_DB]
    embeddings = OpenAIEmbeddings()
    db = MongoDBAtlasVectorSearch(
        collection=vector_db[collection_name],
        embedding=embeddings,
        index_name=index_name,
    )

    return db