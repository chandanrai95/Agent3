from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.agent import router as agent_router
from app.api.agent_history import router as agent_history_router
from app.api.sources import router as sources_router

def setup_router(app: FastAPI):
    app.include_router(health_router, tags=["health"])
    app.include_router(prefix='/api/auth', router=auth_router, tags=["auth"])
    app.include_router(prefix='/api/users', router=users_router, tags=["users"])
    app.include_router(prefix='/api/agents', router=agent_router, tags=['agents'])
    app.include_router(prefix='/api/agents_history', router=agent_history_router, tags=['agents_history'])
    app.include_router(prefix='/api/sources', router=sources_router, tags=["sources"])