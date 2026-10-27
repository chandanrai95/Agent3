"""Re-embeds stored chunks after EMBEDDING_MODEL changes (vectors from different models can't be compared).

    cd backend && python -m scripts.reembed_chunks
"""
from dotenv import load_dotenv

load_dotenv()

from langchain_openai import OpenAIEmbeddings
from pymongo import UpdateOne

from app.config.database import get_pymongo_client
from app.config.setting import MONGO_DB, EMBEDDINGS_COLLECTION, EMBEDDING_MODEL

BATCH_SIZE = 100


def main():
    collection = get_pymongo_client()[MONGO_DB][EMBEDDINGS_COLLECTION]
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    query = {"embedding_model": {"$ne": EMBEDDING_MODEL}}
    total = collection.count_documents(query)
    print(f"{total} chunks to re-embed with {EMBEDDING_MODEL}")

    done = 0
    while True:
        batch = list(collection.find(query, {"_id": 1, "text": 1}).limit(BATCH_SIZE))
        if not batch:
            break
        vectors = embeddings.embed_documents([d["text"] for d in batch])
        collection.bulk_write([
            UpdateOne({"_id": d["_id"]}, {"$set": {"embedding": v, "embedding_model": EMBEDDING_MODEL}})
            for d, v in zip(batch, vectors)
        ])
        done += len(batch)
        print(f"{done}/{total}")


if __name__ == "__main__":
    main()
