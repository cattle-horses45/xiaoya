from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_token: str


class ChatResponse(BaseModel):
    reply: str
    session_token: str
    is_transfer: bool = False
