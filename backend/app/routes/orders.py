from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate
from app.utils.jwt import get_current_user

router = APIRouter()


def generate_order_no(db: Session) -> str:
    """Generate a unique order number: YALI-YYYYMMDD-NNNN"""
    today = date.today().strftime("%Y%m%d")
    count = db.query(Order).filter(
        Order.order_no.like(f"YALI-{today}-%")
    ).count()
    return f"YALI-{today}-{count + 1:04d}"


@router.post("")
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new order from cart items (simulated)"""
    # Get cart items
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(status_code=400, detail="购物车为空，无法下单")

    # Calculate total and create order items
    total = 0.0
    order_items = []

    for cart_item in cart_items:
        product = cart_item.product
        if not product:
            continue
        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"商品「{product.name}」库存不足（剩余{product.stock}件）",
            )

        subtotal = product.price * cart_item.quantity
        total += subtotal

        order_item = OrderItem(
            product_id=product.id,
            quantity=cart_item.quantity,
            unit_price=product.price,
        )
        order_items.append(order_item)

        # Reduce stock
        product.stock -= cart_item.quantity

    # Create order
    order = Order(
        order_no=generate_order_no(db),
        user_id=current_user.id,
        total_amount=round(total, 2),
        shipping_address=order_data.shipping_address,
        status="pending",
    )
    order.items = order_items
    db.add(order)

    # Clear cart
    for cart_item in cart_items:
        db.delete(cart_item)

    db.commit()
    db.refresh(order)

    return {
        "code": 200,
        "message": "下单成功（模拟）",
        "order": {
            "id": order.id,
            "order_no": order.order_no,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        },
    }


@router.get("")
async def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's orders"""
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )

    return {
        "orders": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "total_amount": o.total_amount,
                "status": o.status,
                "shipping_address": o.shipping_address,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "product": {
                            "id": item.product.id,
                            "name": item.product.name,
                            "price": item.product.price,
                        } if item.product else None,
                    }
                    for item in o.items
                ],
            }
            for o in orders
        ]
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get order detail"""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    return {
        "order": {
            "id": order.id,
            "order_no": order.order_no,
            "total_amount": order.total_amount,
            "status": order.status,
            "shipping_address": order.shipping_address,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "product": {
                        "id": item.product.id,
                        "name": item.product.name,
                        "price": item.product.price,
                    } if item.product else None,
                }
                for item in order.items
            ],
        }
    }


@router.post("/{order_id}/pay")
async def pay_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Simulate payment"""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单状态不允许支付")

    order.status = "paid"
    db.commit()
    return {"code": 200, "message": "支付成功（模拟）"}


@router.post("/{order_id}/complete")
async def complete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm receipt"""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != "shipped":
        raise HTTPException(status_code=400, detail="订单状态不允许确认收货")

    order.status = "completed"
    db.commit()
    return {"code": 200, "message": "已确认收货"}
