from fastapi import Request, status, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

import app.config.database as database
from app.config.auth import verify_access_token
from app.helper.user import get_user_byid

# /v1 is the public API, it authenticates with an agent API key (see app/helper/agent_access.py)
PUBLIC_PREFIXES = ('/api/auth', '/v1', '/health', '/docs', '/redoc', '/openapi.json')


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        headers = request.headers
        pathname = request.url.path

        token = headers.get('Authorization')
        if request.method == 'OPTIONS' or pathname.startswith(PUBLIC_PREFIXES):
            response = await call_next(request)
            return response

        if not token:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
                "detail": "Missing authorization header"
            })
        token = token.replace('Bearer ', '')
        decoded = verify_access_token(token)

        if not decoded:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
                "detail": "Invalid authorization token"
            })
        user_id = decoded.get('_id')

        if not user_id:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
                "detail": "Invalid authorization token"
            })
        user = await get_user_byid(database.db, user_id)

        if not user:
            return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
                "detail": "Unauthorized user"
            })

        request.state.user = user

        response = await call_next(request)

        return response