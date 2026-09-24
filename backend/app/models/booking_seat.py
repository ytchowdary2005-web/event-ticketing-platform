from sqlalchemy import Column, Integer, ForeignKey

from app.database import Base


class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False
    )

    show_seat_id = Column(
        Integer,
        ForeignKey("show_seats.id"),
        nullable=False
    )