from sqlalchemy import Column, Integer, String, Numeric

from app.database import Base


class PricingTier(Base):
    __tablename__ = "pricing_tiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)