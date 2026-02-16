from pydantic import EmailStr, BaseModel

from app.models.base import MongoBaseModel


class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(MongoBaseModel):
    name: str
    email: EmailStr
    token: str