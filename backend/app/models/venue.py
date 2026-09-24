from sqlalchemy import Column, Integer, String

from app.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)