from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.venue import Venue
from app.schemas.venue import VenueCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/venues",
    tags=["Venues"]
)


@router.post("/")
def create_venue(
    venue_data: VenueCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create venues"
        )

    venue = Venue(
        name=venue_data.name,
        address=venue_data.address,
        city=venue_data.city
    )

    db.add(venue)
    db.commit()
    db.refresh(venue)

    return {
        "message": "Venue created successfully",
        "venue_id": venue.id,
        "name": venue.name,
        "address": venue.address,
        "city": venue.city
    }


@router.get("/")
def get_venues(
    db: Session = Depends(get_db)
):
    venues = db.query(Venue).order_by(Venue.id).all()

    return {
        "total_venues": len(venues),
        "venues": [
            {
                "venue_id": venue.id,
                "name": venue.name,
                "address": venue.address,
                "city": venue.city
            }
            for venue in venues
        ]
    }
