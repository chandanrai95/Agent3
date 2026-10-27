from datetime import datetime
from typing import Optional

from bson import ObjectId

import app.config.database as database
from app.helper.RagPipeline import RagPipeline, cited_sources


class ChatAgent:
    """Dashboard chat, streams plain text with a trailing 'Sources:' block (format used by the frontend)."""

    def __init__(self, rag: RagPipeline):
        self.agent = rag.agent
        self.db = database.db
        self.rag = rag

    @staticmethod
    def format_sources(sources: list[dict]) -> str:
        if not sources:
            return ""
        return "\n\nSources:\n" + "".join(f"[{s.get('ref', i + 1)}] {s['source_name']}\n" for i, s in enumerate(sources))

    async def stream_chat(self, question: str, source_id: Optional[str] = None,
                          user_id: Optional[str] = None, thread_id: Optional[str] = None):
        source_ids = [source_id] if source_id else None

        if thread_id:
            async for event in self.rag.chat_thread(thread_id, question, source_ids):
                if event["type"] == "token":
                    yield event["content"]
                elif event["type"] == "sources":
                    yield self.format_sources(event["sources"])
            return

        history = await self.rag.load_agent_history(user_id)
        _, context, sources = await self.rag.prepare(question, history, source_ids=source_ids)

        answer = ""
        try:
            async for token in self.rag.stream_answer(question, history, context):
                answer += token
                yield token
        finally:
            self.rag.finish_usage([context, question, answer])

        sources_text = self.format_sources(cited_sources(answer, sources))
        yield sources_text

        await self.db.agent_history.insert_one({
            'user_id': ObjectId(user_id),
            'agent_id': ObjectId(self.agent["_id"]),
            'question': question,
            'answer': answer + sources_text,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        })
