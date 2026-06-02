from sqlalchemy import Column, Integer, String, Boolean, DateTime, func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, is_admin={self.is_admin})>"
