from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)

    venue_id = Column(
        Integer,
        ForeignKey("venues.id"),
        nullable=False
    )

    row = Column(String(10), nullable=False)
    number = Column(Integer, nullable=False)
    