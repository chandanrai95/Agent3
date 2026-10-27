import json
from typing import Callable, Optional

from fastapi import APIRouter, Depends, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse

import app.config.database as database
from app.controller import threads as threads_controller
from app.controller import documents as documents_controller
from app.helper.RagPipeline import RagPipeline
from app.helper.credentials import ensure_quota
from app.models import thread_schema, sources_schema


def _sse(event: dict) -> str:
    return f"event: {event['type']}\ndata: {json.dumps(event, default=str)}\n\n"


def build_thread_router(get_agent: Callable) -> APIRouter:
    """Thread + document routes, shared by the dashboard (JWT) and public (API key) APIs.
    `get_agent` is the dependency that authorizes the caller and returns the agent document."""
    router = APIRouter()

    # -----------------------------
    # AGENT-LEVEL DOCUMENTS (shared by every thread)
    # -----------------------------
    @router.post('/documents', response_model=sources_schema.SourceModel, status_code=status.HTTP_201_CREATED)
    async def upload_shared_document(file: UploadFile = File(...), agent=Depends(get_agent)):
        return await documents_controller.ingest_upload(agent, file)

    @router.get('/documents', response_model=list[sources_schema.SourceModel])
    async def list_shared_documents(agent=Depends(get_agent)):
        return await documents_controller.list_documents(database.db, agent)

    @router.delete('/documents/{source_id}')
    async def delete_shared_document(source_id: str, agent=Depends(get_agent)):
        return await documents_controller.delete_document(database.db, agent, source_id)

    # -----------------------------
    # THREADS
    # -----------------------------
    @router.post('/threads', response_model=thread_schema.ThreadResponse, status_code=status.HTTP_201_CREATED)
    async def create_thread(payload: thread_schema.ThreadCreate, agent=Depends(get_agent)):
        return await threads_controller.create_thread(database.db, agent, payload)

    @router.get('/threads', response_model=list[thread_schema.ThreadResponse])
    async def list_threads(
        external_user_id: Optional[str] = None,
        limit: int = Query(50, ge=1, le=200),
        skip: int = Query(0, ge=0),
        agent=Depends(get_agent),
    ):
        return await threads_controller.list_threads(database.db, agent, external_user_id, limit, skip)

    @router.get('/threads/{thread_id}', response_model=thread_schema.ThreadResponse)
    async def get_thread(thread_id: str, agent=Depends(get_agent)):
        return await threads_controller.get_thread(database.db, agent, thread_id)

    @router.patch('/threads/{thread_id}', response_model=thread_schema.ThreadResponse)
    async def update_thread(thread_id: str, payload: thread_schema.ThreadUpdate, agent=Depends(get_agent)):
        return await threads_controller.update_thread(database.db, agent, thread_id, payload)

    @router.delete('/threads/{thread_id}')
    async def delete_thread(thread_id: str, agent=Depends(get_agent)):
        return await threads_controller.delete_thread(database.db, agent, thread_id)

    # -----------------------------
    # THREAD DOCUMENTS (only visible inside the thread)
    # -----------------------------
    @router.post('/threads/{thread_id}/documents', response_model=sources_schema.SourceModel,
                 status_code=status.HTTP_201_CREATED)
    async def upload_thread_document(thread_id: str, file: UploadFile = File(...), agent=Depends(get_agent)):
        await threads_controller.get_thread(database.db, agent, thread_id)
        return await documents_controller.ingest_upload(agent, file, thread_id)

    @router.get('/threads/{thread_id}/documents', response_model=list[sources_schema.SourceModel])
    async def list_thread_documents(thread_id: str, agent=Depends(get_agent)):
        await threads_controller.get_thread(database.db, agent, thread_id)
        return await documents_controller.list_documents(database.db, agent, thread_id)

    @router.delete('/threads/{thread_id}/documents/{source_id}')
    async def delete_thread_document(thread_id: str, source_id: str, agent=Depends(get_agent)):
        await threads_controller.get_thread(database.db, agent, thread_id)
        return await documents_controller.delete_document(database.db, agent, source_id, thread_id)

    # -----------------------------
    # MESSAGES
    # -----------------------------
    @router.get('/threads/{thread_id}/messages', response_model=list[thread_schema.MessageResponse])
    async def list_messages(thread_id: str, limit: int = Query(100, ge=1, le=500), agent=Depends(get_agent)):
        return await threads_controller.list_messages(database.db, agent, thread_id, limit)

    @router.post(
        '/threads/{thread_id}/messages',
        response_model=thread_schema.ChatResponse,
        responses={200: {"content": {"text/event-stream": {}},
                         "description": "JSON answer, or an SSE stream of token/sources/done events when stream=true"}},
    )
    async def send_message(thread_id: str, payload: thread_schema.ChatRequest, agent=Depends(get_agent)):
        thread = await threads_controller.get_thread(database.db, agent, thread_id)
        rag = await RagPipeline.for_agent(agent)
        await ensure_quota(database.db, rag.credentials)
        events = rag.chat_thread(str(thread["_id"]), payload.message, payload.source_ids)

        if payload.stream:
            async def event_stream():
                try:
                    async for event in events:
                        yield _sse(event)
                except Exception as e:
                    yield _sse({"type": "error", "detail": str(e)})

            return StreamingResponse(event_stream(), media_type="text/event-stream",
                                     headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

        async for event in events:
            if event["type"] == "done":
                return {k: v for k, v in event.items() if k != "type"}

    return router
