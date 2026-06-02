from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.product import Product

router = APIRouter()


@router.get("/products")
async def list_products(
    q: str = Query(default="", description="搜索关键词"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List products with optional search"""
    query = db.query(Product)
    if q:
        query = query.filter(
            or_(
                Product.name.like(f"%{q}%"),
                Product.description.like(f"%{q}%"),
            )
        )
    total = query.count()
    products = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "description": p.description,
                "specs": p.specs,
                "image_url": p.image_url,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
            for p in products
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product detail"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="商品不存在")

    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "stock": product.stock,
            "description": product.description,
            "specs": product.specs,
            "image_url": product.image_url,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        }
    }
