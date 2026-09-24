from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    show_id = Column(
        Integer,
        ForeignKey("shows.id"),
        nullable=False
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="CONFIRMED"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )