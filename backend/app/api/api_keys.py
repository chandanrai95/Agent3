from fastapi import APIRouter, Depends, status

import app.config.database as database
from app.controller import api_keys as api_keys_controller
from app.helper.agent_access import get_owned_agent
from app.models import api_key_schema

router = APIRouter()


@router.post('/{agent_id}/api_keys', response_model=api_key_schema.ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(payload: api_key_schema.ApiKeyCreate, agent=Depends(get_owned_agent)):
    return await api_keys_controller.create_api_key(database.db, agent, payload)


@router.get('/{agent_id}/api_keys', response_model=list[api_key_schema.ApiKeyResponse])
async def list_api_keys(agent=Depends(get_owned_agent)):
    return await api_keys_controller.list_api_keys(database.db, agent)


@router.delete('/{agent_id}/api_keys/{key_id}')
async def revoke_api_key(key_id: str, agent=Depends(get_owned_agent)):
    return await api_keys_controller.revoke_api_key(database.db, agent, key_id)
