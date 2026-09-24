from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pricing import PricingTier
from app.schemas.pricing import PricingTierCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/pricing",
    tags=["Pricing"]
)


@router.get("/")
def get_pricing_tiers(
    db: Session = Depends(get_db)
):
    pricing_tiers = (
        db.query(PricingTier)
        .order_by(PricingTier.id.desc())
        .all()
    )

    return {
        "pricing_tiers": [
            {
                "pricing_tier_id": tier.id,
                "name": tier.name,
                "price": float(tier.price)
            }
            for tier in pricing_tiers
        ]
    }


@router.post("/")
def create_pricing_tier(
    pricing_data: PricingTierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create pricing tiers"
        )

    pricing_tier = PricingTier(
        name=pricing_data.name,
        price=pricing_data.price
    )

    db.add(pricing_tier)
    db.commit()
    db.refresh(pricing_tier)

    return {
        "message": "Pricing tier created successfully",
        "pricing_tier_id": pricing_tier.id,
        "name": pricing_tier.name,
        "price": float(pricing_tier.price)
    }
