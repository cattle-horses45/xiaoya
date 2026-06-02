from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="鸭梨手机官方商城AI客服后端API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "鸭梨手机AI客服后端服务运行中"}


# Register all routes
from app.routes import auth, products, admin, cart, orders, chat

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(products.router, prefix="/api", tags=["商品"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理员"])
app.include_router(cart.router, prefix="/api/cart", tags=["购物车"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI对话"])
