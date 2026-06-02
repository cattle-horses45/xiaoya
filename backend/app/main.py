from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="鸭梨手机官方商城AI客服后端API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
from app.routes import auth, products, admin, cart, orders, chat

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(products.router, prefix="/api", tags=["商品"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理员"])
app.include_router(cart.router, prefix="/api/cart", tags=["购物车"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI对话"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "鸭梨手机AI客服后端服务运行中"}


# Serve frontend static files (for production)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dir = os.path.join(backend_dir, "static")

if os.path.exists(static_dir):
    # Mount assets directory
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve favicon
    @app.get("/favicon.svg")
    async def favicon():
        favicon_path = os.path.join(static_dir, "favicon.svg")
        if os.path.exists(favicon_path):
            return FileResponse(favicon_path)
        return FileResponse(os.path.join(static_dir, "index.html"))

    # SPA fallback — must be registered last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
