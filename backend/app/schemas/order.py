from pydantic import BaseModel
from typing import Optional


class OrderCreate(BaseModel):
    shipping_address: Optional[str] = None
