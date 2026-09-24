from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint
)

from app.database import Base


class ShowSeat(Base):
    __tablename__ = "show_seats"

    id = Column(Integer, primary_key=True, index=True)

    show_id = Column(
        Integer,
        ForeignKey("shows.id"),
        nullable=False
    )

    seat_id = Column(
        Integer,
        ForeignKey("seats.id"),
        nullable=False
    )

    pricing_tier_id = Column(
        Integer,
        ForeignKey("pricing_tiers.id"),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="AVAILABLE"
    )

    locked_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    locked_until = Column(
        DateTime(timezone=True),
        nullable=True
    )

    blocked_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    blocked_reason = Column(
        String(255),
        nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "show_id",
            "seat_id",
            name="uq_show_seat"
        ),
    )