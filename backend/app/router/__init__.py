from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.agent import router as agent_router
from app.api.agent_history import router as agent_history_router
from app.api.sources import router as sources_router
from app.api.api_keys import router as api_keys_router
from app.api.public import router as public_router
from app.api.settings import router as settings_router
from app.api.threads import build_thread_router
from app.helper.agent_access import get_owned_agent

def setup_router(app: FastAPI):
    app.include_router(health_router, tags=["health"])
    app.include_router(prefix='/api/auth', router=auth_router, tags=["auth"])
    app.include_router(prefix='/api/users', router=users_router, tags=["users"])
    app.include_router(prefix='/api/agents', router=agent_router, tags=['agents'])
    app.include_router(prefix='/api/agents', router=api_keys_router, tags=['api_keys'])
    app.include_router(prefix='/api/agents/{agent_id}', router=build_thread_router(get_owned_agent), tags=['threads'])
    app.include_router(prefix='/api/agents_history', router=agent_history_router, tags=['agents_history'])
    app.include_router(prefix='/api/sources', router=sources_router, tags=["sources"])
    app.include_router(prefix='/api/settings', router=settings_router, tags=["settings"])
    # public API, authenticated with an agent API key instead of a user JWT
    app.include_router(prefix='/v1', router=public_router, tags=["public"])
