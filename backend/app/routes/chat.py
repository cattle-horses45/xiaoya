from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import process_chat_stream, process_chat_message, create_new_session
from app.utils.jwt import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/session")
async def new_session(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Create a new chat session. Returns session_token."""
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            from jose import jwt
            from app.config import settings
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id = payload.get("sub")
        except Exception:
            pass

    session_token = create_new_session(db, user_id)
    return {"session_token": session_token, "message": "会话创建成功"}


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Streaming chat endpoint using Server-Sent Events."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            from jose import jwt
            from app.config import settings
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id = payload.get("sub")
        except Exception:
            pass

    async def generate():
        async for chunk in process_chat_stream(
            message=request.message,
            session_token=request.session_token,
            user_id=user_id,
            db=db,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Non-streaming chat endpoint (fallback)."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            from jose import jwt
            from app.config import settings
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id = payload.get("sub")
        except Exception:
            pass

    result = await process_chat_message(
        message=request.message,
        session_token=request.session_token,
        user_id=user_id,
        db=db,
    )

    return ChatResponse(
        reply=result["reply"],
        session_token=result["session_token"],
        is_transfer=result["is_transfer"],
    )
