from fastapi import APIRouter, Request, status
from app.models import user_schema

router = APIRouter()

@router.get("/")
def get_users(request: Request):
    return { "users": [] }

@router.get("/me", response_model=user_schema.UserResponse, status_code=status.HTTP_200_OK)
def get_me(request: Request):
    user = request.state.user
    return user