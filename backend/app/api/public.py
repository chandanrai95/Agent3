from fastapi import Depends

from app.api.threads import build_thread_router
from app.helper.agent_access import get_api_agent
from app.models import agent_schema

# Public API for integrating an agent into other projects, authenticated by an agent API key
router = build_thread_router(get_api_agent)


@router.get('/agent', response_model=agent_schema.AgentResponse)
async def get_agent(agent=Depends(get_api_agent)):
    return agent
