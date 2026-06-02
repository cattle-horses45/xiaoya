from pydantic import BaseModel
from typing import Optional, Dict, Any


class ProductCreate(BaseModel):
    name: str
    price: float
    stock: int
    description: str
    specs: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    description: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    description: Optional[str]
    specs: Optional[Dict[str, Any]]
    image_url: Optional[str]
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
