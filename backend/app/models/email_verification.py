from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime

from app.database import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), nullable=False, index=True)

    otp_hash = Column(String(255), nullable=False)

    purpose = Column(String(30), nullable=False)

    # Used only for pending registration
    name = Column(String(255), nullable=True)

    password_hash = Column(String(255), nullable=True)

    expires_at = Column(DateTime, nullable=False)

    attempts = Column(Integer, nullable=False, default=0)

    verified_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )