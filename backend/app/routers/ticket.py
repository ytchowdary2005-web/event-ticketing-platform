import io
import qrcode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.auth.security import get_current_user

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("/{booking_id}/qr")
def generate_ticket_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own ticket"
        )

    if booking.status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Booking is not confirmed"
        )

    ticket_data = f"BOOKING_ID:{booking.id}|SHOW_ID:{booking.show_id}|USER_ID:{booking.user_id}"

    qr = qrcode.make(ticket_data)

    image_bytes = io.BytesIO()
    qr.save(image_bytes, format="PNG")
    image_bytes.seek(0)

    return StreamingResponse(
        image_bytes,
        media_type="image/png"
    )