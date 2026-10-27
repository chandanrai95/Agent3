async def get_sources (db, query):
    cursor = db.sources.find(query)
    sources = []
    async for doc in cursor:
        sources.append(doc)

    return sources
