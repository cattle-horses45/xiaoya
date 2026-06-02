import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
from app.routes import auth, products, admin, cart, orders, chat
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(products.router, prefix="/api", tags=["商品"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理员"])
app.include_router(cart.router, prefix="/api/cart", tags=["购物车"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI对话"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve frontend static files
_static = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.isdir(_static):
    _assets = os.path.join(_static, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")
