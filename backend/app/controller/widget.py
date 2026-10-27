import secrets
from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, Request, status

from app.models import widget_schema
from app.models.widget import normalize_origin

DEFAULTS = widget_schema.WidgetSettingsUpdate().model_dump()


def _new_public_key() -> str:
    return "pk_" + secrets.token_urlsafe(24)


def widget_settings(agent: dict) -> dict:
    return {**DEFAULTS, **(agent.get("widget") or {})}


async def update_widget(db, agent: dict, payload: widget_schema.WidgetSettingsUpdate) -> dict:
    current = widget_settings(agent)
    widget = {
        **payload.model_dump(),
        "public_key": current.get("public_key") or _new_public_key(),
        "updated_at": datetime.utcnow(),
    }
    await db.agents.update_one({"_id": agent["_id"]}, {"$set": {"widget": widget}})
    return widget


async def rotate_widget_key(db, agent: dict) -> dict:
    widget = {**widget_settings(agent), "public_key": _new_public_key(), "updated_at": datetime.utcnow()}
    await db.agents.update_one({"_id": agent["_id"]}, {"$set": {"widget": widget}})
    return widget


async def get_widget_agent(db, public_key: str, request: Request) -> dict:
    """Agent behind a publishable widget key, only when the widget is on and the page's origin is allowed."""
    agent = await db.agents.find_one({"widget.public_key": public_key, "widget.enabled": True})
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This chat widget is not available.")

    allowed = agent["widget"].get("allowed_origins") or []
    origin = request.headers.get("origin")
    if allowed and (not origin or normalize_origin(origin) not in allowed):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This website is not allowed to use this chat widget.")
    return agent


def visitor_ref(visitor_id: str) -> str:
    return f"widget:{visitor_id}"


async def get_visitor_thread(db, agent: dict, visitor_id: str, thread_id: Optional[str]) -> Optional[dict]:
    """A widget visitor can only reach their own conversations."""
    if not thread_id or not ObjectId.is_valid(thread_id):
        return None
    return await db.threads.find_one({
        "_id": ObjectId(thread_id),
        "agent_id": agent["_id"],
        "external_user_id": visitor_ref(visitor_id),
    })
