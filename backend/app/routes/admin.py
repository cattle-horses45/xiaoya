from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.order import Order
from app.models.chat import UnansweredQuestion
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.jwt import get_current_admin_user

router = APIRouter()


# ─── Product CRUD ───

@router.get("/products")
async def list_admin_products(
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: list all products"""
    products = db.query(Product).order_by(Product.id.desc()).all()
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
        ]
    }


@router.post("/products")
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: create a new product"""
    product = Product(
        name=product_data.name,
        price=product_data.price,
        stock=product_data.stock,
        description=product_data.description,
        specs=product_data.specs,
        image_url=product_data.image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"code": 200, "message": "商品添加成功", "product_id": product.id}


@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: update a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")

    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    return {"code": 200, "message": "商品更新成功"}


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: delete a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    db.delete(product)
    db.commit()
    return {"code": 200, "message": "商品已删除"}


# ─── Order Management ───

@router.get("/orders")
async def list_admin_orders(
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: list all orders"""
    orders = db.query(Order).order_by(Order.id.desc()).all()
    return {"orders": [
        {
            "id": o.id,
            "order_no": o.order_no,
            "user_id": o.user_id,
            "total_amount": o.total_amount,
            "status": o.status,
            "shipping_address": o.shipping_address,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]}


@router.post("/orders/{order_id}/ship")
async def ship_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: mark order as shipped"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != "paid":
        raise HTTPException(status_code=400, detail="只能对已支付的订单执行发货")
    order.status = "shipped"
    db.commit()
    return {"code": 200, "message": "已标记为发货"}


# ─── Unanswered Questions ───

@router.get("/unanswered")
async def list_unanswered(
    db: Session = Depends(get_db),
    admin_user=Depends(get_current_admin_user),
):
    """Admin: view unanswered questions"""
    questions = (
        db.query(UnansweredQuestion)
        .filter(UnansweredQuestion.status == "pending")
        .order_by(UnansweredQuestion.id.desc())
        .all()
    )
    return {
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "session_id": q.session_id,
                "created_at": q.created_at.isoformat() if q.created_at else None,
            }
            for q in questions
        ]
    }
