from dotenv import load_dotenv

# before any app import: app.config.setting reads the environment at import time
load_dotenv()

from fastapi import FastAPI

from app.router import setup_router
from app.config.cors import setup_cors
from app.middleware import setup_middleware
from app.config.database import connect_mongo, close_mongo

app = FastAPI()

@app.on_event("startup")
async def on_startup():
    await connect_mongo()

@app.on_event('shutdown')
async def on_shutdown():
    await close_mongo()


setup_cors(app)
setup_middleware(app)

setup_router(app)