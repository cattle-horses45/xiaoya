from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    user = relationship("User", backref="cart_items")
    product = relationship("Product", backref="cart_items")

    def __repr__(self):
        return f"<CartItem(user_id={self.user_id}, product_id={self.product_id}, qty={self.quantity})>"
