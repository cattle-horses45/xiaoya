from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, func

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, comment="商品名称，如'鸭梨14 Pro'")
    price = Column(Float, nullable=False, comment="价格")
    stock = Column(Integer, nullable=False, default=0, comment="库存")
    description = Column(Text, nullable=True, comment="商品描述")
    specs = Column(JSON, nullable=True, comment="规格参数")
    image_url = Column(String(500), nullable=True, comment="图片URL")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
