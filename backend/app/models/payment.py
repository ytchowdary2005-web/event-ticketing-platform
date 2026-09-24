from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    transaction_id = Column(
        String(100),
        unique=True,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )