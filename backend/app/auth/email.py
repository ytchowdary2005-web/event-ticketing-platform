import os
import smtplib
from email.message import EmailMessage


def send_email(
    recipient_email: str,
    subject: str,
    body: str
):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL")

    if not all(
        [
            smtp_host,
            smtp_username,
            smtp_password,
            smtp_from_email,
        ]
    ):
        raise RuntimeError(
            "SMTP email settings are not configured"
        )

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = smtp_from_email
    message["To"] = recipient_email

    message.set_content(body)

    with smtplib.SMTP(
        smtp_host,
        smtp_port,
        timeout=30
    ) as server:

        server.starttls()

        server.login(
            smtp_username,
            smtp_password
        )

        server.send_message(message)


def send_registration_otp_email(
    recipient_email: str,
    otp: str
):
    subject = "Event Ticketing Platform - Email Verification OTP"

    body = f"""
Hello,

Your Event Ticketing Platform verification OTP is:

{otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

If you did not request this verification, you can safely ignore this email.

Regards,
Event Ticketing Platform
"""

    send_email(
        recipient_email,
        subject,
        body
    )


def send_password_reset_otp_email(
    recipient_email: str,
    otp: str
):
    subject = "Event Ticketing Platform - Password Reset OTP"

    body = f"""
Hello,

Your Event Ticketing Platform password reset OTP is:

{otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

If you did not request a password reset, you can safely ignore this email.

Regards,
Event Ticketing Platform
"""

    send_email(
        recipient_email,
        subject,
        body
    )