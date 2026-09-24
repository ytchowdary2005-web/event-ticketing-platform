import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payment import Payment
from app.models.booking import Booking
from app.schemas.payment import PaymentCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.post("/")
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == data.booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only pay for your own booking"
        )

    if booking.status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Booking is not confirmed"
        )

    existing_payment = db.query(Payment).filter(
        Payment.booking_id == booking.id
    ).first()

    if existing_payment:
        raise HTTPException(
            status_code=400,
            detail="Payment already exists for this booking"
        )

    transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"

    payment = Payment(
        booking_id=booking.id,
        amount=booking.total_amount,
        status="SUCCESS",
        transaction_id=transaction_id
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "Mock payment successful",
        "payment_id": payment.id,
        "booking_id": payment.booking_id,
        "amount": float(payment.amount),
        "status": payment.status,
        "transaction_id": payment.transaction_id
    }