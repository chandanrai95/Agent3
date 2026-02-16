from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field

from app.models.base import MongoBaseModel


class UserModel(MongoBaseModel):
    name: str = Field(..., min_length=6, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)

class UserResponse(MongoBaseModel):
    name: str
    email: EmailStr



class UserCreate(BaseModel):
    name: str = Field(..., min_length=6, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)