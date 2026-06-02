from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_token = Column(String(100), unique=True, nullable=False, index=True)
    needs_followup = Column(Boolean, default=False, comment="是否需人工跟进")
    dissatisfied_count = Column(Integer, default=0, comment="连续不满次数")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="chat_sessions")

    def __repr__(self):
        return f"<ChatSession(token={self.session_token}, dissatisfied={self.dissatisfied_count})>"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(
        SAEnum("user", "assistant", "system", name="message_role"),
        nullable=False,
    )
    content = Column(Text, nullable=False)
    emotion = Column(String(50), nullable=True, comment="用户情绪标签")
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("ChatSession", backref="messages")

    def __repr__(self):
        return f"<ChatMessage(role={self.role}, emotion={self.emotion})>"


class UnansweredQuestion(Base):
    __tablename__ = "unanswered_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True)
    status = Column(
        SAEnum("pending", "answered", name="question_status"),
        default="pending",
        nullable=False,
    )
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("ChatSession", backref="unanswered_questions")

    def __repr__(self):
        return f"<UnansweredQuestion(status={self.status})>"
