from fastapi import FastAPI
from app.middleware.AuthMiddleware import AuthMiddleware

# from app.middleware.DBSessionMiddleware import DBSessionMiddleware
# app.add_middleware(DBSessionMiddleware) for pg db instance attachement to request

def setup_middleware(app: FastAPI):
    # add all middlewares here
    app.add_middleware(AuthMiddleware)
    return None;