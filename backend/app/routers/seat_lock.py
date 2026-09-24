from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.show_seat import ShowSeat
from app.schemas.seat_lock import SeatLockRequest
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/seat-locks",
    tags=["Seat Locks"]
)


@router.post("/")
def lock_seat(
    data: SeatLockRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Lock this database row so two users cannot modify it simultaneously
    show_seat = (
        db.query(ShowSeat)
        .filter(ShowSeat.id == data.show_seat_id)
        .with_for_update()
        .first()
    )

    if not show_seat:
        raise HTTPException(
            status_code=404,
            detail="Show seat not found"
        )

    now = datetime.now(timezone.utc)

    # Already confirmed or blocked
    if show_seat.status in ["CONFIRMED", "BLOCKED"]:
        raise HTTPException(
            status_code=400,
            detail="Seat is not available"
        )

    # Currently locked by another user
    if (
        show_seat.status == "LOCKED"
        and show_seat.locked_until
        and show_seat.locked_until > now
        and show_seat.locked_by != current_user.id
    ):
        raise HTTPException(
            status_code=409,
            detail="Seat is currently locked by another user"
        )

    # Lock expires after 5 minutes
    show_seat.status = "LOCKED"
    show_seat.locked_by = current_user.id
    show_seat.locked_until = now + timedelta(minutes=5)

    db.commit()
    db.refresh(show_seat)

    return {
        "message": "Seat locked successfully",
        "show_seat_id": show_seat.id,
        "locked_by": current_user.id,
        "locked_until": show_seat.locked_until
    }


@router.delete("/{show_seat_id}")
def unlock_seat(
    show_seat_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    show_seat = (
        db.query(ShowSeat)
        .filter(ShowSeat.id == show_seat_id)
        .with_for_update()
        .first()
    )

    if not show_seat:
        raise HTTPException(
            status_code=404,
            detail="Show seat not found"
        )

    if show_seat.status != "LOCKED":
        raise HTTPException(
            status_code=400,
            detail="Seat is not currently locked"
        )

    if show_seat.locked_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only release your own seat lock"
        )

    show_seat.status = "AVAILABLE"
    show_seat.locked_by = None
    show_seat.locked_until = None

    db.commit()

    return {
        "message": "Seat lock released",
        "show_seat_id": show_seat.id,
        "status": show_seat.status
    }