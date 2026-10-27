from fastapi import APIRouter, Request, status, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.models import agent_schema
import app.config.database as database
from app.controller.agent import get_agent_byid, create_user_agent, update_user_agent, get_user_all_agents, \
    update_agent_role_by_id, update_agent_by_id, delete_user_agent
from app.controller.documents import ingest_upload
from app.controller.threads import get_thread
from app.helper.agent_access import get_owned_agent
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


@router.post('/{agent_id}/upload', status_code=status.HTTP_200_OK)
async def create_agent_document(file: UploadFile = File(...), agent=Depends(get_owned_agent)):
    source = await ingest_upload(agent, file)
    return {"success": True, "no_of_chunks": source["chunk_count"], "source_id": str(source["_id"])}


@router.post('/{agent_id}/chat_stream')
async def user_chat_stream(request: Request, message_req: agent_schema.AgentStreamRequest,
                           agent=Depends(get_owned_agent)):
    user = request.state.user
    if message_req.thread_id:
        await get_thread(database.db, agent, message_req.thread_id)
    if message_req.source and not ObjectId.is_valid(message_req.source):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source id.")

    chat = ChatAgent(agent)
    return StreamingResponse(
        chat.stream_chat(message_req.message, message_req.source, user["_id"], message_req.thread_id),
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



@router.delete('/{id}', status_code=status.HTTP_200_OK)
async def delete_agent(request: Request, id: str):
    return await delete_user_agent(database.db, request.state.user, id)
