from fastapi import APIRouter, status, Request
from app.models import user_schema, agent_history_schema
import app.config.database as database
from app.controller.agent_history import create_user_agent_history, get_user_history_by_agent_id

router = APIRouter()


@router.post('/create', response_model=agent_history_schema.AgentHistoryModel, status_code=status.HTTP_201_CREATED)
async def create_agent_history(request: Request, agent_history: agent_history_schema.AgentHistoryCreate):
    db = database.db
    user = request.state.user

    result = await create_user_agent_history(db, user, agent_history)
    return result


@router.get('/{agent_id}/by_user', response_model=list[agent_history_schema.AgentHistoryResponse],
            status_code=status.HTTP_200_OK)
async def agent_history_by_user(request: Request, agent_id: str):
    db = database.db
    user = request.state.user

    history =  await get_user_history_by_agent_id(db, user, agent_id)

    return history