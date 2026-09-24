from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.show_seat import ShowSeat
from app.models.show import Show
from app.models.seat import Seat
from app.models.pricing import PricingTier
from app.schemas.show_seat import ShowSeatGenerate, SeatBlockRequest
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/show-seats",
    tags=["Show Seats"]
)


@router.post("/generate")
def generate_show_seats(
    data: ShowSeatGenerate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only organizers and admins can generate show seats"
        )

    show = db.query(Show).filter(
        Show.id == data.show_id
    ).first()

    if not show:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    seats = db.query(Seat).filter(
        Seat.venue_id == show.venue_id
    ).all()

    if not seats:
        raise HTTPException(
            status_code=404,
            detail="No seats found for this venue"
        )

    pricing_tier = db.query(PricingTier).filter(
        PricingTier.id == show.pricing_tier_id
    ).first()

    if not pricing_tier:
        raise HTTPException(
            status_code=400,
            detail="The pricing tier assigned to this show was not found"
        )

    created = []
    updated_pricing = []

    for seat in seats:
        existing = db.query(ShowSeat).filter(
            ShowSeat.show_id == show.id,
            ShowSeat.seat_id == seat.id
        ).first()

        if existing:
            if (
                existing.status == "AVAILABLE"
                and existing.pricing_tier_id != pricing_tier.id
            ):
                existing.pricing_tier_id = pricing_tier.id
                updated_pricing.append(f"{seat.row}{seat.number}")
            continue

        show_seat = ShowSeat(
            show_id=show.id,
            seat_id=seat.id,
            pricing_tier_id=pricing_tier.id,
            status="AVAILABLE"
        )

        db.add(show_seat)
        created.append(f"{seat.row}{seat.number}")

    db.commit()

    return {
        "message": "Show seats generated successfully",
        "show_id": show.id,
        "pricing_tier_id": pricing_tier.id,
        "price": float(pricing_tier.price),
        "total_created": len(created),
        "total_price_updated": len(updated_pricing),
        "seats": created,
        "price_updated_seats": updated_pricing
    }


@router.get("/{show_id}/seats")
def get_show_seats(
    show_id: int,
    db: Session = Depends(get_db)
):
    show = db.query(Show).filter(
        Show.id == show_id
    ).first()

    if not show:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    # Customers must not access seats after the show date/time has passed.
    show_datetime = datetime.combine(
        show.show_date,
        show.show_time
    )

    if show_datetime <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="This show has already completed and is no longer available."
        )

    show_seats = (
        db.query(ShowSeat)
        .filter(ShowSeat.show_id == show_id)
        .all()
    )

    now = datetime.now(timezone.utc)

    seats = []
    expired_locks = False

    for show_seat in show_seats:
        if show_seat.status == "LOCKED" and show_seat.locked_until:
            locked_until = show_seat.locked_until

            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)

            if locked_until <= now:
                show_seat.status = "AVAILABLE"
                show_seat.locked_by = None
                show_seat.locked_until = None
                expired_locks = True

        seat = db.query(Seat).filter(
            Seat.id == show_seat.seat_id
        ).first()

        pricing_tier = db.query(PricingTier).filter(
            PricingTier.id == show_seat.pricing_tier_id
        ).first()

        seats.append({
            "show_seat_id": show_seat.id,
            "seat_id": show_seat.seat_id,
            "row": seat.row,
            "number": seat.number,
            "pricing_tier_id": show_seat.pricing_tier_id,
            "price": float(pricing_tier.price) if pricing_tier else 0,
            "status": show_seat.status
        })

    if expired_locks:
        db.commit()

    return {
        "show_id": show_id,
        "total_seats": len(seats),
        "seats": seats
    }


@router.post("/{show_seat_id}/block")
def block_seat(
    show_seat_id: int,
    data: SeatBlockRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only organizers and admins can block seats"
        )

    show_seat = db.query(ShowSeat).filter(
        ShowSeat.id == show_seat_id
    ).first()

    if not show_seat:
        raise HTTPException(
            status_code=404,
            detail="Show seat not found"
        )

    if show_seat.status == "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Cannot block a confirmed seat"
        )

    show_seat.status = "BLOCKED"
    show_seat.blocked_by = current_user.id
    show_seat.blocked_reason = data.reason

    show_seat.locked_by = None
    show_seat.locked_until = None

    db.commit()
    db.refresh(show_seat)

    return {
        "message": "Seat blocked successfully",
        "show_seat_id": show_seat.id,
        "status": show_seat.status,
        "blocked_by": show_seat.blocked_by,
        "reason": show_seat.blocked_reason
    }


@router.post("/{show_seat_id}/unblock")
def unblock_seat(
    show_seat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only organizers and admins can unblock seats"
        )

    show_seat = db.query(ShowSeat).filter(
        ShowSeat.id == show_seat_id
    ).first()

    if not show_seat:
        raise HTTPException(
            status_code=404,
            detail="Show seat not found"
        )

    if show_seat.status != "BLOCKED":
        raise HTTPException(
            status_code=400,
            detail="Seat is not blocked"
        )

    show_seat.status = "AVAILABLE"
    show_seat.blocked_by = None
    show_seat.blocked_reason = None

    db.commit()
    db.refresh(show_seat)

    return {
        "message": "Seat unblocked successfully",
        "show_seat_id": show_seat.id,
        "status": show_seat.status
    }
