from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse

import app.config.database as database
from app.api.threads import _sse
from app.controller import widget as widget_controller
from app.helper.RagPipeline import RagPipeline
from app.helper.agent_access import get_owned_agent
from app.helper.credentials import ensure_quota
from app.helper.rate_limit import SlidingWindowLimiter
from app.models import widget_schema

WIDGET_JS = Path(__file__).resolve().parent.parent / "static" / "widget.js"

visitor_limiter = SlidingWindowLimiter(limit=20, window_seconds=600)
ip_limiter = SlidingWindowLimiter(limit=60, window_seconds=600)

# -----------------------------
# Dashboard (JWT): configure the widget of an agent
# -----------------------------
settings_router = APIRouter()


@settings_router.get('/{agent_id}/widget', response_model=widget_schema.WidgetSettings)
async def get_widget_settings(agent=Depends(get_owned_agent)):
    return widget_controller.widget_settings(agent)


@settings_router.put('/{agent_id}/widget', response_model=widget_schema.WidgetSettings)
async def update_widget_settings(payload: widget_schema.WidgetSettingsUpdate, agent=Depends(get_owned_agent)):
    return await widget_controller.update_widget(database.db, agent, payload)


@settings_router.post('/{agent_id}/widget/rotate', response_model=widget_schema.WidgetSettings)
async def rotate_widget_key(agent=Depends(get_owned_agent)):
    return await widget_controller.rotate_widget_key(database.db, agent)


# -----------------------------
# Public: used by widget.js on third-party websites, identified by the publishable key
# -----------------------------
public_router = APIRouter()


@public_router.get('/widget.js', include_in_schema=False)
async def widget_script():
    return FileResponse(WIDGET_JS, media_type="application/javascript", headers={"Cache-Control": "public, max-age=300"})


@public_router.get('/widget/{public_key}/config')
async def widget_config(public_key: str, request: Request):
    agent = await widget_controller.get_widget_agent(database.db, public_key, request)
    widget = agent["widget"]
    return {
        "agent_name": agent["name"],
        "title": widget.get("title"),
        "greeting": widget.get("greeting"),
        "accent_color": widget.get("accent_color"),
    }


@public_router.get('/widget/{public_key}/threads/{thread_id}/messages')
async def widget_history(public_key: str, thread_id: str, visitor_id: str, request: Request):
    db = database.db
    agent = await widget_controller.get_widget_agent(db, public_key, request)
    thread = await widget_controller.get_visitor_thread(db, agent, visitor_id, thread_id)
    if not thread:
        return []
    cursor = db.messages.find({"thread_id": thread["_id"]}).sort("created_at", 1).limit(100)
    return [{"role": m["role"], "content": m["content"]} async for m in cursor]


@public_router.post('/widget/{public_key}/messages')
async def widget_message(public_key: str, payload: widget_schema.WidgetMessageRequest, request: Request):
    db = database.db
    agent = await widget_controller.get_widget_agent(db, public_key, request)
    visitor_limiter.check(f"{public_key}:{payload.visitor_id}")
    ip_limiter.check(f"{public_key}:{request.client.host if request.client else 'unknown'}")

    rag = await RagPipeline.for_agent(agent)
    await ensure_quota(db, rag.credentials)

    thread = await widget_controller.get_visitor_thread(db, agent, payload.visitor_id, payload.thread_id)
    if not thread:
        now = datetime.utcnow()
        result = await db.threads.insert_one({
            "agent_id": agent["_id"],
            "user_id": agent["user_id"],
            "title": payload.message[:80],
            "external_user_id": widget_controller.visitor_ref(payload.visitor_id),
            "metadata": {"channel": "widget", "origin": request.headers.get("origin")},
            "created_at": now,
            "updated_at": now,
        })
        thread = {"_id": result.inserted_id}

    thread_id = str(thread["_id"])

    async def event_stream():
        yield _sse({"type": "thread", "thread_id": thread_id})
        try:
            async for event in rag.chat_thread(thread_id, payload.message):
                if event["type"] == "done":
                    # visitors only need what is shown, not internal ids or scores
                    event = {"type": "done", "thread_id": thread_id, "answer": event["answer"]}
                elif event["type"] == "sources":
                    # website visitors only see the answer, sources stay in the dashboard
                    continue
                yield _sse(event)
        except Exception as e:
            print(f"widget chat failed: {e}")
            yield _sse({"type": "error", "detail": "Sorry, something went wrong. Please try again."})

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
