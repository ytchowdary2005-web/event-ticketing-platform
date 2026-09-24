import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth.email import (
    send_password_reset_otp_email,
    send_registration_otp_email,
)
from app.auth.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.email_verification import EmailVerification
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    RegistrationOTPRequest,
    RegistrationOTPVerify,
    ResetPasswordRequest,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5


def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp: str):
    return hashlib.sha256(
        otp.encode("utf-8")
    ).hexdigest()


def invalidate_previous_otps(
    email: str,
    purpose: str,
    db: Session
):
    previous_otps = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email,
            EmailVerification.purpose == purpose,
            EmailVerification.verified_at.is_(None)
        )
        .all()
    )

    for record in previous_otps:
        record.verified_at = datetime.utcnow()


# ============================================================
# REGISTRATION - REQUEST OTP
# ============================================================

@router.post("/register/request-otp")
def request_registration_otp(
    user_data: RegistrationOTPRequest,
    db: Session = Depends(get_db)
):
    email = user_data.email.strip().lower()
    name = user_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Invalidate previous registration OTPs
    invalidate_previous_otps(
        email,
        "registration",
        db
    )

    otp = generate_otp()

    verification = EmailVerification(
        email=email,
        otp_hash=hash_otp(otp),
        purpose="registration",
        name=name,
        password_hash=hash_password(
            user_data.password
        ),
        expires_at=datetime.utcnow()
        + timedelta(minutes=OTP_EXPIRY_MINUTES),
        attempts=0
    )

    db.add(verification)
    db.commit()

    try:
        send_registration_otp_email(
            email,
            otp
        )
    except Exception:
        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Unable to send verification email"
        )

    return {
        "message": "OTP sent successfully",
        "email": email,
        "expires_in_minutes": OTP_EXPIRY_MINUTES
    }


# ============================================================
# REGISTRATION - VERIFY OTP
# ============================================================

@router.post("/register/verify-otp")
def verify_registration_otp(
    data: RegistrationOTPVerify,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    verification = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email,
            EmailVerification.purpose == "registration",
            EmailVerification.verified_at.is_(None)
        )
        .order_by(
            EmailVerification.id.desc()
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=400,
            detail="No active registration OTP found"
        )

    if verification.expires_at <= datetime.utcnow():
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP."
        )

    if verification.attempts >= MAX_OTP_ATTEMPTS:
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    if hash_otp(data.otp) != verification.otp_hash:
        verification.attempts += 1
        db.commit()

        remaining = MAX_OTP_ATTEMPTS - verification.attempts

        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempts remaining."
        )

    # Check again in case the account was created elsewhere
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if not verification.name or not verification.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Registration information is incomplete"
        )

    new_user = User(
        name=verification.name,
        email=email,
        password_hash=verification.password_hash,
        role="customer"
    )

    db.add(new_user)

    verification.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(new_user)

    return {
        "message": "Email verified and account created successfully",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    }


# ============================================================
# OLD REGISTER ENDPOINT
# ============================================================

@router.post("/register")
def old_register_endpoint():
    raise HTTPException(
        status_code=410,
        detail="Direct registration is disabled. Please use /auth/register/request-otp."
    )


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    user_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email = user_data.username.strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user or not verify_password(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# FORGOT PASSWORD - REQUEST OTP
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether the email exists.
    if not user:
        return {
            "message": "If the email is registered, a password reset OTP has been sent."
        }

    invalidate_previous_otps(
        email,
        "password_reset",
        db
    )

    otp = generate_otp()

    verification = EmailVerification(
        email=email,
        otp_hash=hash_otp(otp),
        purpose="password_reset",
        expires_at=datetime.utcnow()
        + timedelta(minutes=OTP_EXPIRY_MINUTES),
        attempts=0
    )

    db.add(verification)
    db.commit()

    try:
        send_password_reset_otp_email(
            email,
            otp
        )
    except Exception:
        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email"
        )

    return {
        "message": "If the email is registered, a password reset OTP has been sent.",
        "expires_in_minutes": OTP_EXPIRY_MINUTES
    }


# ============================================================
# RESET PASSWORD USING OTP
# ============================================================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    verification = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email,
            EmailVerification.purpose == "password_reset",
            EmailVerification.verified_at.is_(None)
        )
        .order_by(
            EmailVerification.id.desc()
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=400,
            detail="No active password reset OTP found"
        )

    if verification.expires_at <= datetime.utcnow():
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP."
        )

    if verification.attempts >= MAX_OTP_ATTEMPTS:
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    if hash_otp(data.otp) != verification.otp_hash:
        verification.attempts += 1
        db.commit()

        remaining = MAX_OTP_ATTEMPTS - verification.attempts

        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempts remaining."
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        verification.verified_at = datetime.utcnow()
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Unable to reset password"
        )

    user.password_hash = hash_password(
        data.new_password
    )

    verification.verified_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Password reset successfully"
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }