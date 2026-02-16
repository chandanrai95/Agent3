from fastapi import APIRouter, status
from app.models import user_schema, auth_schema
from app.controller.auth import signup_user, login_user, verify_user_token
import app.config.database as database

router  = APIRouter()

@router.post('/signup', response_model=auth_schema.LoginResponse, status_code=status.HTTP_201_CREATED)
async def login(user: user_schema.UserCreate):
    result = await signup_user(database.db, user)
    return result

@router.post('/login', response_model=auth_schema.LoginResponse, status_code=status.HTTP_200_OK)
async def login(user: auth_schema.LoginPayload):
    result = await login_user(database.db, user)
    return result

@router.get('/verify_token', response_model=user_schema.UserResponse, status_code=status.HTTP_200_OK)
async def verify_token(token: str):
    result = await verify_user_token(database.db, token)
    return result
