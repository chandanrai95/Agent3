import json
import time
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

import app.config.database as database
from app.api.threads import build_thread_router
from app.helper.RagPipeline import RagPipeline
from app.helper.agent_access import get_api_agent
from app.helper.credentials import ensure_quota, count_tokens
from app.models import agent_schema, openai_compat_schema

# Public API for integrating an agent into other projects, authenticated by an agent API key
router = build_thread_router(get_api_agent)


@router.get('/agent', response_model=agent_schema.AgentResponse)
async def get_agent(agent=Depends(get_api_agent)):
    return agent


# -----------------------------
# OpenAI-compatible API: platforms that accept "any OpenAI-compatible endpoint"
# (base URL + API key) can use the agent as a chat model.
# -----------------------------
def _model_id(agent: dict) -> str:
    return f"agent-{agent['_id']}"


def _text(content) -> str:
    if isinstance(content, str) or content is None:
        return content or ""
    return "\n".join(part.text or "" for part in content if part.type == "text")


@router.get('/models')
async def list_models(agent=Depends(get_api_agent)):
    return {"object": "list", "data": [{
        "id": _model_id(agent), "object": "model", "created": int(agent["created_at"].timestamp()),
        "owned_by": "agent3", "name": agent["name"],
    }]}


@router.post('/chat/completions')
async def chat_completions(payload: openai_compat_schema.ChatCompletionRequest, agent=Depends(get_api_agent)):
    # the agent's own role is the system prompt, callers' system messages are ignored on purpose
    turns = [m for m in payload.messages if m.role in ("user", "assistant")]
    if not turns or turns[-1].role != "user" or not _text(turns[-1].content).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The last message must be a non-empty user message.")
    question = _text(turns[-1].content).strip()
    history = [HumanMessage(content=_text(m.content)) if m.role == "user" else AIMessage(content=_text(m.content))
               for m in turns[:-1]]

    rag = await RagPipeline.for_agent(agent)
    await ensure_quota(database.db, rag.credentials)
    events = rag.chat_stateless(question, history, payload.source_ids)
    completion_id, created, model = f"chatcmpl-{uuid.uuid4().hex}", int(time.time()), _model_id(agent)

    if payload.stream:
        async def event_stream():
            def chunk(delta: dict, finish=None, **extra):
                body = {"id": completion_id, "object": "chat.completion.chunk", "created": created, "model": model,
                        "choices": [{"index": 0, "delta": delta, "finish_reason": finish}], **extra}
                return f"data: {json.dumps(body, default=str)}\n\n"

            yield chunk({"role": "assistant", "content": ""})
            try:
                async for event in events:
                    if event["type"] == "token":
                        yield chunk({"content": event["content"]})
                    elif event["type"] == "done":
                        yield chunk({}, "stop", sources=event["sources"])
            except Exception as e:
                yield f"data: {json.dumps({'error': {'message': str(e), 'type': 'server_error'}})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    async for event in events:
        if event["type"] == "done":
            total = rag.last_request_tokens
            completion = min(count_tokens([event["answer"]]), total)
            return {
                "id": completion_id, "object": "chat.completion", "created": created, "model": model,
                "choices": [{"index": 0, "message": {"role": "assistant", "content": event["answer"]}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": total - completion, "completion_tokens": completion, "total_tokens": total},
                # extension: the documents the answer is based on
                "sources": event["sources"],
            }
