from sqlalchemy import Column, Integer, Date, Time, ForeignKey

from app.database import Base


class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(
        Integer,
        ForeignKey("events.id"),
        nullable=False
    )

    venue_id = Column(
        Integer,
        ForeignKey("venues.id"),
        nullable=False
    )

    pricing_tier_id = Column(
        Integer,
        ForeignKey("pricing_tiers.id"),
        nullable=False
    )

    show_date = Column(Date, nullable=False)
    show_time = Column(Time, nullable=False)