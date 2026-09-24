from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.show import Show
from app.models.event import Event
from app.models.venue import Venue
from app.models.seat import Seat
from app.models.show_seat import ShowSeat
from app.models.pricing import PricingTier
from app.schemas.show import ShowCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/shows",
    tags=["Shows"]
)


# ============================================================
# GET ALL SHOWS
# ============================================================

@router.get("/")
def get_all_shows(
    db: Session = Depends(get_db)
):
    shows = (
        db.query(Show)
        .order_by(
            Show.show_date.asc(),
            Show.show_time.asc()
        )
        .all()
    )

    result = []

    for show in shows:
        event = db.query(Event).filter(
            Event.id == show.event_id
        ).first()

        venue = db.query(Venue).filter(
            Venue.id == show.venue_id
        ).first()

        pricing_tier = db.query(PricingTier).filter(
            PricingTier.id == show.pricing_tier_id
        ).first()

        result.append({
            "show_id": show.id,
            "event_id": show.event_id,
            "event_name": event.name if event else "Unknown Event",
            "venue_id": show.venue_id,
            "venue_name": venue.name if venue else "Unknown Venue",
            "pricing_tier_id": show.pricing_tier_id,
            "pricing_tier_name": (
                pricing_tier.name
                if pricing_tier
                else "Unknown Pricing"
            ),
            "price": (
                float(pricing_tier.price)
                if pricing_tier
                else 0
            ),
            "show_date": show.show_date,
            "show_time": show.show_time
        })

    return {
        "shows": result,
        "total_shows": len(result)
    }


# ============================================================
# DELETE SHOW
# ============================================================

@router.delete("/{show_id}")
def delete_show(
    show_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete shows"
        )

    show = db.query(Show).filter(
        Show.id == show_id
    ).first()

    if not show:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    # Do not delete a show if it has booking history.
    # This protects existing customer bookings and tickets.
    booking_exists = db.execute(
        text(
            "SELECT 1 FROM bookings "
            "WHERE show_id = :show_id "
            "LIMIT 1"
        ),
        {
            "show_id": show_id
        }
    ).first()

    if booking_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "This show has booking history and cannot be deleted. "
                "Keep it as a past show instead."
            )
        )

    # Delete the show-seat records first.
    db.query(ShowSeat).filter(
        ShowSeat.show_id == show_id
    ).delete(
        synchronize_session=False
    )

    db.delete(show)
    db.commit()

    return {
        "message": "Show deleted successfully",
        "show_id": show_id
    }


# ============================================================
# CREATE SHOW
# ============================================================

@router.post("/")
def create_show(
    show_data: ShowCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # This project has Admin + Customer roles only.
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create shows"
        )

    # Do not allow creation of an already completed show.
    show_datetime = datetime.combine(
        show_data.show_date,
        show_data.show_time
    )

    if show_datetime <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="Show date and time must be in the future"
        )

    # --------------------------------------------------------
    # Check event
    # --------------------------------------------------------

    event = db.query(Event).filter(
        Event.id == show_data.event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # --------------------------------------------------------
    # Check venue
    # --------------------------------------------------------

    venue = db.query(Venue).filter(
        Venue.id == show_data.venue_id
    ).first()

    if not venue:
        raise HTTPException(
            status_code=404,
            detail="Venue not found"
        )

    # --------------------------------------------------------
    # Check pricing tier
    # --------------------------------------------------------

    pricing_tier = db.query(PricingTier).filter(
        PricingTier.id == show_data.pricing_tier_id
    ).first()

    if not pricing_tier:
        raise HTTPException(
            status_code=404,
            detail="Pricing tier not found"
        )

    # --------------------------------------------------------
    # Create show
    # --------------------------------------------------------

    show = Show(
        event_id=show_data.event_id,
        venue_id=show_data.venue_id,
        pricing_tier_id=show_data.pricing_tier_id,
        show_date=show_data.show_date,
        show_time=show_data.show_time
    )

    db.add(show)
    db.flush()

    # --------------------------------------------------------
    # Automatically create ShowSeat records
    # --------------------------------------------------------

    seats = db.query(Seat).filter(
        Seat.venue_id == show.venue_id
    ).all()

    created_show_seats = 0

    for seat in seats:

        existing = db.query(ShowSeat).filter(
            ShowSeat.show_id == show.id,
            ShowSeat.seat_id == seat.id
        ).first()

        if existing:
            continue

        show_seat = ShowSeat(
            show_id=show.id,
            seat_id=seat.id,
            pricing_tier_id=show.pricing_tier_id,
            status="AVAILABLE"
        )

        db.add(show_seat)

        created_show_seats += 1

    db.commit()
    db.refresh(show)

    return {
        "message": "Show created successfully",
        "show_id": show.id,
        "event_id": show.event_id,
        "venue_id": show.venue_id,
        "pricing_tier_id": show.pricing_tier_id,
        "price": float(pricing_tier.price),
        "show_date": show.show_date,
        "show_time": show.show_time,
        "show_seats_created": created_show_seats
    }