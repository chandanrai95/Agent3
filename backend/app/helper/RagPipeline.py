import asyncio
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator, Optional

from bson import ObjectId
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

import app.config.database as database
from app.config.database import SHARED_THREAD
from app.config.llm import get_llm
from app.config.setting import EMBEDDINGS_COLLECTION
from app.helper.DocumentParser import parse_file, describe_images, chunk_segments

HISTORY_TURNS = 3
NOT_FOUND_ANSWER = "I cannot find this in the provided documents."

QA_PROMPT = """Answer the question using only the document context below.
If the answer is not in the context, reply exactly: "{not_found}"
Do not use outside knowledge and do not make up information.

Document context:
{context}

Question:
{question}"""


def _thread_key(thread_id: Optional[str]) -> str:
    return str(thread_id) if thread_id else SHARED_THREAD


class RagPipeline:
    def __init__(self, agent: dict):
        self.agent = agent
        self.agent_id = ObjectId(agent["_id"])
        self.db = database.db
        self.vector_store = database.getVectorStoreDb()

    # -----------------------------
    # INGESTION
    # -----------------------------
    async def ingest(self, file_path: Path, source_name: str, thread_id: Optional[str] = None) -> dict:
        # text and tables are parsed locally (blocking, so off the event loop),
        # images and scanned pages are turned into text by the vision model
        parsed = await asyncio.to_thread(parse_file, file_path)
        image_segments, failed_images = await describe_images(parsed.images)
        chunks = await asyncio.to_thread(chunk_segments, parsed.segments + image_segments, source_name)
        if not chunks:
            if failed_images:
                raise ValueError(f"Could not read the images/scanned pages in '{source_name}', "
                                 f"the vision model failed for {failed_images} of them (check server logs).")
            raise ValueError(f"No readable content found in '{source_name}'.")

        content_stats = {}
        for chunk in chunks:
            kind = chunk.metadata["content_type"]
            content_stats[kind] = content_stats.get(kind, 0) + 1

        now = datetime.utcnow()
        source = {
            "agent_id": self.agent_id,
            "user_id": self.agent["user_id"],
            "thread_id": ObjectId(thread_id) if thread_id else None,
            "type": "document",
            "source_name": source_name,
            "status": "processing",
            "chunk_count": len(chunks),
            "content_stats": content_stats,
            "images_processed": len(parsed.images) - failed_images,
            "images_skipped": parsed.skipped_images + failed_images,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.db.sources.insert_one(source)
        source_id = result.inserted_id

        for i, chunk in enumerate(chunks):
            chunk.metadata = {
                "page": chunk.metadata.get("page"),
                "sheet": chunk.metadata.get("sheet"),
                "content_type": chunk.metadata["content_type"],
                "chunk_index": i,
                "source": source_name,
                "source_id": source_id,
                "agent_id": self.agent_id,
                "thread_id": _thread_key(thread_id),
            }

        try:
            await self.vector_store.aadd_documents(chunks)
        except Exception:
            await self.delete_source_chunks(source_id)
            await self.db.sources.delete_one({"_id": source_id})
            raise

        await self.db.sources.update_one(
            {"_id": source_id},
            {"$set": {"status": "ready", "updated_at": datetime.utcnow()}}
        )
        return await self.db.sources.find_one({"_id": source_id})

    async def delete_source_chunks(self, source_id: ObjectId):
        await self.db[EMBEDDINGS_COLLECTION].delete_many({"source_id": source_id})

    # -----------------------------
    # RETRIEVAL
    # -----------------------------
    @staticmethod
    def dynamic_k(question: str) -> int:
        word_count = len(question.split())
        if word_count <= 2:
            return 8  # short vague query
        elif word_count <= 6:
            return 6
        return 4  # specific question

    def build_filter(self, thread_id: Optional[str] = None, source_ids: Optional[list[str]] = None) -> dict:
        _filter: dict = {"agent_id": self.agent_id}
        if thread_id:
            # thread docs + docs shared by the whole agent
            _filter["thread_id"] = {"$in": [str(thread_id), SHARED_THREAD]}
        if source_ids:
            _filter["source_id"] = {"$in": [ObjectId(s) for s in source_ids]}
        return _filter

    async def retrieve(self, question: str, thread_id: Optional[str] = None,
                       source_ids: Optional[list[str]] = None) -> list[tuple[Document, float]]:
        return await self.vector_store.asimilarity_search_with_score(
            question,
            k=self.dynamic_k(question),
            pre_filter=self.build_filter(thread_id, source_ids),
        )

    @staticmethod
    def format_context(docs: list[tuple[Document, float]]) -> str:
        def where(m: dict) -> str:
            return "".join([
                f"source: {m.get('source', 'unknown')}",
                f", page {m['page']}" if m.get("page") else "",
                f", sheet {m['sheet']}" if m.get("sheet") else "",
                f", {m['content_type']}" if m.get("content_type") not in (None, "text") else "",
            ])

        return "\n\n---\n\n".join(
            f"[{i + 1}] ({where(d.metadata)})\n{d.page_content}"
            for i, (d, _) in enumerate(docs)
        )

    @staticmethod
    def extract_sources(docs: list[tuple[Document, float]]) -> list[dict]:
        # one entry per document, keeping the best scoring chunk
        sources: dict = {}
        for d, score in docs:
            key = str(d.metadata.get("source_id") or d.metadata.get("source"))
            if key in sources and sources[key]["score"] >= score:
                continue
            sources[key] = {
                "source_id": str(d.metadata["source_id"]) if d.metadata.get("source_id") else None,
                "source_name": str(d.metadata.get("source", "unknown")).replace("uploads/", ""),
                "snippet": d.page_content[:200],
                "score": round(float(score), 4),
                "page": d.metadata.get("page"),
                "content_type": d.metadata.get("content_type", "text"),
            }
        return sorted(sources.values(), key=lambda s: s["score"], reverse=True)

    # -----------------------------
    # HISTORY
    # -----------------------------
    async def load_thread_history(self, thread_id: str) -> list:
        cursor = self.db.messages.find({"thread_id": ObjectId(thread_id)}) \
            .sort("created_at", -1).limit(HISTORY_TURNS * 2)
        history = []
        async for doc in cursor:
            history.append(HumanMessage(content=doc["content"]) if doc["role"] == "user"
                           else AIMessage(content=doc["content"]))
        return list(reversed(history))

    async def load_agent_history(self, user_id) -> list:
        # legacy dashboard chat without a thread
        cursor = self.db.agent_history.find({"agent_id": self.agent_id, "user_id": ObjectId(user_id)}) \
            .sort("created_at", -1).limit(HISTORY_TURNS)
        history = []
        async for doc in cursor:
            history.append(AIMessage(content=doc["answer"].split("\n\nSources:\n")[0]))
            history.append(HumanMessage(content=doc["question"]))
        return list(reversed(history))

    # -----------------------------
    # GENERATION
    # -----------------------------
    def build_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.agent.get("role") or "You are a helpful assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("human", QA_PROMPT),
        ])
        return prompt | get_llm(self.agent.get("model") or "gpt-4.1-mini")

    async def stream_answer(self, question: str, history: list,
                            docs: list[tuple[Document, float]]) -> AsyncIterator[str]:
        if not docs:
            # nothing retrieved, don't let the model improvise
            yield NOT_FOUND_ANSWER
            return

        async for chunk in self.build_chain().astream({
            "history": history,
            "context": self.format_context(docs),
            "question": question,
            "not_found": NOT_FOUND_ANSWER,
        }):
            if chunk.content:
                yield chunk.content

    async def save_thread_message(self, thread_id: str, role: str, content: str, sources: list = None) -> dict:
        now = datetime.utcnow()
        message = {
            "thread_id": ObjectId(thread_id),
            "agent_id": self.agent_id,
            "role": role,
            "content": content,
            "sources": sources or [],
            "created_at": now,
            "updated_at": now,
        }
        result = await self.db.messages.insert_one(message)
        await self.db.threads.update_one({"_id": ObjectId(thread_id)}, {"$set": {"updated_at": now}})
        message["_id"] = result.inserted_id
        return message

    async def chat_thread(self, thread_id: str, question: str,
                          source_ids: Optional[list[str]] = None) -> AsyncIterator[dict]:
        """Yields {"type": "token"|"sources"|"done", ...} events for one thread turn."""
        history = await self.load_thread_history(thread_id)
        docs = await self.retrieve(question, thread_id, source_ids)
        sources = self.extract_sources(docs)
        await self.save_thread_message(thread_id, "user", question)

        answer = ""
        async for token in self.stream_answer(question, history, docs):
            answer += token
            yield {"type": "token", "content": token}

        message = await self.save_thread_message(thread_id, "assistant", answer, sources)
        yield {"type": "sources", "sources": sources}
        yield {
            "type": "done",
            "thread_id": str(thread_id),
            "message_id": str(message["_id"]),
            "answer": answer,
            "sources": sources,
            "created_at": message["created_at"],
        }
