from bson import ObjectId
from fastapi import HTTPException, status
from datetime import datetime
from app.config.auth import create_hashed_password, verify_password, create_access_token, verify_access_token
from app.models import user_schema, auth_schema


async def signup_user(db, user: user_schema.UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User alerady exist")
    user.password = create_hashed_password(user.password)

    user = user.dict()

    user['created_at'] = datetime.utcnow()
    user['updated_at'] = datetime.utcnow()

    result = await db.users.insert_one(user)

    created_user = await db.users.find_one({"_id": result.inserted_id})

    token = create_access_token({
        "_id": str(created_user.get('_id')),
        "email": created_user.get('email'),
        "name": created_user.get('name')
    })

    created_user['token'] = token

    return created_user


async def login_user(db, user: auth_schema.LoginPayload):
    if user.email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    _user = await db.users.find_one({"email": user.email})

    if not _user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User does not exist")

    if not verify_password(user.password, _user.get("password")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({
        "_id": str(_user.get('_id')),
        "email": _user.get('email'),
        "name": _user.get('name')
    })

    _user['token'] = token

    return _user


async def verify_user_token(db, token: str):
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    decode = verify_access_token(token)
    user_id = decode.get('_id')

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await db.users.find_one({ "_id": ObjectId(user_id) })

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user