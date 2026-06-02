from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate
from app.utils.jwt import get_current_user

router = APIRouter()


@router.get("")
async def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's cart items"""
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    cart_items = []
    for item in items:
        product = item.product
        cart_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "stock": product.stock,
                "image_url": product.image_url,
            } if product else None,
        })

    return {"items": cart_items}


@router.post("/items")
async def add_cart_item(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add item to cart"""
    # Verify product exists and has stock
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if product.stock < item_data.quantity:
        raise HTTPException(status_code=400, detail="库存不足")

    # Check if already in cart
    existing = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_data.product_id,
        )
        .first()
    )

    if existing:
        existing.quantity += item_data.quantity
        db.commit()
        return {"code": 200, "message": "购物车已更新", "item_id": existing.id}
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        return {"code": 200, "message": "已加入购物车", "item_id": cart_item.id}


@router.put("/items/{item_id}")
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update cart item quantity"""
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="购物车项目不存在")

    if item_data.quantity <= 0:
        db.delete(item)
        db.commit()
        return {"code": 200, "message": "已从购物车移除"}
    else:
        item.quantity = item_data.quantity
        db.commit()
        return {"code": 200, "message": "数量已更新"}


@router.delete("/items/{item_id}")
async def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove item from cart"""
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="购物车项目不存在")

    db.delete(item)
    db.commit()
    return {"code": 200, "message": "已从购物车移除"}
