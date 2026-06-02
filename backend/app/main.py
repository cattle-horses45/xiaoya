import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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
app.include_router(auth.router, prefix="/api/auth", tags=["AUTH"])
app.include_router(products.router, prefix="/api", tags=["PRODUCTS"])
app.include_router(admin.router, prefix="/api/admin", tags=["ADMIN"])
app.include_router(cart.router, prefix="/api/cart", tags=["CART"])
app.include_router(orders.router, prefix="/api/orders", tags=["ORDERS"])
app.include_router(chat.router, prefix="/api/chat", tags=["CHAT"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Static files & SPA
HERE = Path(__file__).resolve().parent.parent
STATIC = HERE / "static"
ASSETS = STATIC / "assets"

if ASSETS.is_dir():
    app.mount("/assets", StaticFiles(directory=str(ASSETS)), name="assets")


@app.get("/{spa_path:path}")
async def serve_frontend(spa_path: str):
    """Serve frontend SPA - returns index.html for any non-API, non-file path."""
    if spa_path.startswith("api"):
        return {"detail": "Not Found"}

    full = STATIC / spa_path
    if full.is_file():
        return FileResponse(str(full))
    return FileResponse(str(STATIC / "index.html"))
