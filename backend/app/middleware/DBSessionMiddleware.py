from starlette.middleware.base import BaseHTTPMiddleware
from app.config.pg_database import SessionLocal

class DBSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        db = SessionLocal()
        try:
            request.state.db = db
            response = await call_next(request)
            db.commit()
            return response
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

