from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.models.booking_seat import BookingSeat
from app.models.show_seat import ShowSeat
from app.models.pricing import PricingTier
from app.models.show import Show
from app.models.user import User
from app.schemas.booking import BookingCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


def require_admin(current_user):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access all bookings"
        )


@router.post("/")
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    show = db.query(Show).filter(Show.id == data.show_id).first()

    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    if not data.show_seat_ids:
        raise HTTPException(status_code=400, detail="Select at least one seat")

    requested_ids = list(dict.fromkeys(data.show_seat_ids))

    show_seats = (
        db.query(ShowSeat)
        .filter(
            ShowSeat.id.in_(requested_ids),
            ShowSeat.show_id == data.show_id
        )
        .with_for_update()
        .all()
    )

    if len(show_seats) != len(requested_ids):
        raise HTTPException(status_code=400, detail="One or more seats are invalid")

    now = datetime.now(timezone.utc)

    for show_seat in show_seats:
        if show_seat.status == "CONFIRMED":
            raise HTTPException(status_code=409, detail=f"Seat {show_seat.id} is already booked")

        if show_seat.status == "BLOCKED":
            raise HTTPException(status_code=409, detail=f"Seat {show_seat.id} is blocked")

        if show_seat.status != "LOCKED":
            raise HTTPException(status_code=400, detail=f"Seat {show_seat.id} is not locked")

        if show_seat.locked_by != current_user.id:
            raise HTTPException(status_code=409, detail=f"Seat {show_seat.id} is locked by another user")

        if not show_seat.locked_until or show_seat.locked_until <= now:
            raise HTTPException(status_code=409, detail=f"Lock expired for seat {show_seat.id}")

    total_amount = 0

    for show_seat in show_seats:
        pricing = db.query(PricingTier).filter(
            PricingTier.id == show_seat.pricing_tier_id
        ).first()

        if not pricing:
            raise HTTPException(status_code=400, detail=f"Pricing not found for seat {show_seat.id}")

        total_amount += pricing.price

    booking = Booking(
        user_id=current_user.id,
        show_id=data.show_id,
        total_amount=total_amount,
        status="CONFIRMED"
    )

    db.add(booking)
    db.flush()

    for show_seat in show_seats:
        db.add(BookingSeat(
            booking_id=booking.id,
            show_seat_id=show_seat.id
        ))

        show_seat.status = "CONFIRMED"
        show_seat.locked_by = None
        show_seat.locked_until = None

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking created successfully",
        "booking_id": booking.id,
        "show_id": booking.show_id,
        "user_id": booking.user_id,
        "seats": requested_ids,
        "total_amount": float(booking.total_amount),
        "status": booking.status
    }


@router.get("/my-bookings")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return {
        "user_id": current_user.id,
        "total_bookings": len(bookings),
        "bookings": [
            {
                "booking_id": booking.id,
                "show_id": booking.show_id,
                "total_amount": float(booking.total_amount),
                "status": booking.status,
                "created_at": booking.created_at
            }
            for booking in bookings
        ]
    }


@router.get("/all")
def get_all_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_admin(current_user)

    rows = (
        db.query(Booking, User, Show)
        .join(User, User.id == Booking.user_id)
        .join(Show, Show.id == Booking.show_id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return {
        "total_bookings": len(rows),
        "bookings": [
            {
                "booking_id": booking.id,
                "user_id": booking.user_id,
                "user_name": user.name,
                "user_email": user.email,
                "show_id": booking.show_id,
                "event_id": show.event_id,
                "venue_id": show.venue_id,
                "total_amount": float(booking.total_amount),
                "status": booking.status,
                "created_at": booking.created_at
            }
            for booking, user, show in rows
        ]
    }


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own booking")

    if booking.status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail=f"Booking cannot be cancelled from status {booking.status}"
        )

    booking_seats = db.query(BookingSeat).filter(
        BookingSeat.booking_id == booking.id
    ).all()

    show_seat_ids = [bs.show_seat_id for bs in booking_seats]

    show_seats = []
    if show_seat_ids:
        show_seats = (
            db.query(ShowSeat)
            .filter(ShowSeat.id.in_(show_seat_ids))
            .with_for_update()
            .all()
        )

    for show_seat in show_seats:
        show_seat.status = "AVAILABLE"
        show_seat.locked_by = None
        show_seat.locked_until = None

    booking.status = "CANCELLED"

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking.id,
        "status": booking.status,
        "seats_released": len(show_seats)
    }
