from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.pricing import PricingTier
from app.models.show import Show
from app.models.venue import Venue
from app.schemas.event import EventCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.post("/")
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create events"
        )

    event = Event(
        name=event_data.name.strip(),
        category=event_data.category.strip(),
        description=(
            event_data.description.strip()
            if event_data.description
            else None
        )
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Event created successfully",
        "event_id": event.id,
        "name": event.name,
        "category": event.category,
        "description": event.description
    }


@router.get("/")
def get_events(db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .order_by(Event.id.desc())
        .all()
    )

    result = []

    for event in events:
        event_locations = (
            db.query(Venue.city)
            .join(
                Show,
                Show.venue_id == Venue.id
            )
            .filter(
                Show.event_id == event.id
            )
            .all()
        )

        locations = sorted(
            {
                city.strip()
                for (city,) in event_locations
                if city and city.strip()
            },
            key=str.lower
        )

        result.append({
            "event_id": event.id,
            "name": event.name,
            "category": event.category,
            "description": event.description,
            "locations": locations
        })

    return {
        "total_events": len(events),
        "events": result
    }


@router.get("/{event_id}")
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    shows = (
        db.query(Show, Venue, PricingTier)
        .join(
            Venue,
            Venue.id == Show.venue_id
        )
        .join(
            PricingTier,
            PricingTier.id == Show.pricing_tier_id
        )
        .filter(
            Show.event_id == event.id
        )
        .order_by(
            Show.show_date,
            Show.show_time
        )
        .all()
    )

    return {
        "event_id": event.id,
        "name": event.name,
        "category": event.category,
        "description": event.description,
        "shows": [
            {
                "show_id": show.id,
                "show_date": show.show_date,
                "show_time": show.show_time,
                "venue_id": venue.id,
                "venue_name": venue.name,
                "city": venue.city,
                "pricing_tier_id": pricing.id,
                "pricing_tier_name": pricing.name,
                "price": float(pricing.price)
            }
            for show, venue, pricing in shows
        ]
    }