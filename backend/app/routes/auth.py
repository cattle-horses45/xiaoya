from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.utils.jwt import create_access_token, get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=dict)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check username uniqueness
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )

    # Create user
    user = User(
        username=user_data.username,
        password_hash=pwd_context.hash(user_data.password),
        email=user_data.email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"code": 200, "message": "注册成功", "user_id": user.id}


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not pwd_context.verify(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_admin=user.is_admin,
        ),
    )


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "user": UserResponse(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            is_admin=current_user.is_admin,
        ).model_dump(),
    }
