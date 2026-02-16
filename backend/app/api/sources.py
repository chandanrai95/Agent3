from fastapi import APIRouter, status, Request
from app.models import sources_schema
import app.config.database as database
from app.controller.sources import get_sources_by_agent_id

router = APIRouter()


@router.get('/by_agent/{agent_id}', response_model=list[sources_schema.SourceModel], status_code=status.HTTP_200_OK)
async def get_source_by_agent(request: Request, agent_id: str):
    db = database.db
    user = request.state.user
    user_id = user["_id"]
    print(f"called {user_id, agent_id}")
    resp = await get_sources_by_agent_id(db, agent_id, user_id)
    return resp