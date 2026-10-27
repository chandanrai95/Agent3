from fastapi import APIRouter, Request

import app.config.database as database
from app.controller import settings as settings_controller
from app.models import settings_schema

router = APIRouter()


@router.get('', response_model=settings_schema.SettingsResponse)
async def get_settings(request: Request):
    return await settings_controller.get_settings(database.db, request.state.user["_id"])


@router.put('/openai_key', response_model=settings_schema.SettingsResponse)
async def set_openai_key(request: Request, payload: settings_schema.OpenAIKeyUpdate):
    return await settings_controller.set_openai_key(database.db, request.state.user["_id"], payload.api_key)


@router.delete('/openai_key', response_model=settings_schema.SettingsResponse)
async def remove_openai_key(request: Request):
    return await settings_controller.remove_openai_key(database.db, request.state.user["_id"])
