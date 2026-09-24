from pydantic import BaseModel


class PricingTierCreate(BaseModel):
    name: str
    price: float