from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True, comment="订单号")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(
        SAEnum("pending", "paid", "shipped", "completed", name="order_status"),
        default="pending",
        nullable=False,
    )
    shipping_address = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(order_no={self.order_no}, status={self.status})>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", backref="order_items")

    def __repr__(self):
        return f"<OrderItem(order_id={self.order_id}, product_id={self.product_id}, qty={self.quantity})>"
