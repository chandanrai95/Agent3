import shutil

from fastapi import APIRouter, Request, status, UploadFile, File
from fastapi.responses import StreamingResponse
from app.models import agent_schema
import app.config.database as database
from app.controller.agent import get_agent_byid, create_user_agent, update_user_agent, get_user_all_agents, \
    update_agent_role_by_id, update_agent_by_id
from app.helper.upload import upload_document
from app.helper.DocumentHelper import DocumentHelper
from app.helper.ChatAgent import ChatAgent

router = APIRouter()


@router.get('/by_user', response_model=list[agent_schema.AgentResponse], status_code=status.HTTP_200_OK)
async def get_user_agents(request: Request):
    user = request.state.user
    agent = await get_user_all_agents(database.db, user)
    return agent


@router.get('/{id}', response_model=agent_schema.AgentResponse, status_code=status.HTTP_200_OK)
async def get_agent_by_id(request: Request, id: str):
    user = request.state.user
    agent = await get_agent_byid(database.db, user, id)
    return agent


@router.post('/create', response_model=agent_schema.AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(request: Request, task: agent_schema.AgentCreate):
    db = database.db
    user = request.state.user
    agent = await create_user_agent(db, user, task)
    return agent


@router.put('/{id}', response_model=agent_schema.AgentResponse, status_code=status.HTTP_200_OK)
async def update_agent(request: Request, id: str, agent: agent_schema.AgentCreate):
    db = database.db
    user = request.state.user
    agent = await update_user_agent(db, user, id, agent)
    return agent


@router.post('/{id}/upload', status_code=status.HTTP_200_OK)
async def create_agent_document(id: str, file: UploadFile = File(...)):
    file_path = await upload_document(file)
    print(f"file_path --- {str(file_path)}")
    doc_helper = DocumentHelper()
    chunk_len = await doc_helper.add_document(str(file_path), id)
    shutil.rmtree(str(file_path), ignore_errors=True)
    return {"success": True, "no_of_chunks": chunk_len}


@router.post('/{id}/chat_stream')
async def user_chat_stream(request: Request, id: str, message_req: agent_schema.AgentStreamRequest):
    print(f"id: {id} message: {message_req.message}")
    user = request.state.user
    print("start")
    chat = ChatAgent(id)
    return StreamingResponse(
        chat.stream_chat_v3(message_req.message, message_req.source, user["_id"]),
        media_type="text/plain",
    )


@router.patch('/{id}/model', response_model=agent_schema.AgentResponse, status_code=status.HTTP_200_OK)
async def update_agent_role(request: Request, id: str, payload: agent_schema.AgentModelUpdate):
    user = request.state.user
    db = database.db
    user_id = user["_id"]
    agent = await update_agent_role_by_id(db, id, user_id, payload.model)
    return agent

@router.patch('/{id}', response_model=agent_schema.AgentResponse, status_code=status.HTTP_200_OK)
async def update_agent_role(request: Request, id: str, payload: agent_schema.AgentUpdate):
    db = database.db
    user = request.state.user
    user_id = user["_id"]
    agent = await update_agent_by_id(db ,id, user_id, payload)
    return agent

