import json
import os
import smtplib
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def send_email(
    recipient_email: str,
    subject: str,
    body: str
):
    # Production: use Resend API when RESEND_API_KEY is available
    resend_api_key = os.getenv("RESEND_API_KEY")
    resend_from_email = os.getenv("RESEND_FROM_EMAIL")

    if resend_api_key:
        if not resend_from_email:
            raise RuntimeError(
                "RESEND_FROM_EMAIL is not configured"
            )

        payload = {
            "from": resend_from_email,
            "to": [recipient_email],
            "subject": subject,
            "text": body,
        }

        request = Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=30) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(
                        f"Resend API returned status {response.status}"
                    )

            return

        except HTTPError as exc:
            error_body = exc.read().decode(
                "utf-8",
                errors="replace"
            )

            raise RuntimeError(
                f"Resend API error: {error_body}"
            ) from exc

        except URLError as exc:
            raise RuntimeError(
                f"Unable to connect to Resend: {exc.reason}"
            ) from exc

    # Local development: use existing SMTP configuration
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