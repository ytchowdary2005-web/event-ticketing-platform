from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # --------------------------------------------------------
    # ADMIN ONLY
    # --------------------------------------------------------
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view dashboard statistics"
        )

    # --------------------------------------------------------
    # TOTAL EVENTS
    # --------------------------------------------------------
    total_events = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM events
            """
        )
    ).scalar() or 0

    # --------------------------------------------------------
    # TOTAL SHOWS
    # --------------------------------------------------------
    total_shows = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM shows
            """
        )
    ).scalar() or 0

    # --------------------------------------------------------
    # TOTAL BOOKINGS
    # --------------------------------------------------------
    total_bookings = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM bookings
            """
        )
    ).scalar() or 0

    # --------------------------------------------------------
    # TOTAL REVENUE
    #
    # Revenue is calculated only from CONFIRMED bookings.
    # --------------------------------------------------------
    total_revenue = db.execute(
        text(
            """
            SELECT COALESCE(
                SUM(total_amount),
                0
            )
            FROM bookings
            WHERE UPPER(status) = 'CONFIRMED'
            """
        )
    ).scalar() or 0

    # --------------------------------------------------------
    # TOTAL CUSTOMERS
    # --------------------------------------------------------
    total_customers = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM users
            WHERE role = 'customer'
            """
        )
    ).scalar() or 0

    # --------------------------------------------------------
    # RECENT BOOKINGS
    # --------------------------------------------------------
    recent_bookings_result = db.execute(
        text(
            """
            SELECT
                b.id AS booking_id,
                b.user_id,
                b.show_id,
                b.total_amount,
                b.status,
                b.created_at,
                u.name AS customer_name,
                u.email AS customer_email
            FROM bookings b
            LEFT JOIN users u
                ON u.id = b.user_id
            ORDER BY b.created_at DESC
            LIMIT 5
            """
        )
    )

    recent_bookings = []

    for row in recent_bookings_result:
        recent_bookings.append(
            {
                "booking_id": row.booking_id,
                "user_id": row.user_id,
                "show_id": row.show_id,
                "total_amount": (
                    float(row.total_amount)
                    if row.total_amount is not None
                    else 0
                ),
                "status": row.status,
                "created_at": (
                    row.created_at.isoformat()
                    if row.created_at
                    else None
                ),
                "customer_name": row.customer_name,
                "customer_email": row.customer_email,
            }
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return {
        "total_events": int(total_events),
        "total_shows": int(total_shows),
        "total_bookings": int(total_bookings),
        "total_revenue": float(total_revenue),
        "total_customers": int(total_customers),
        "recent_bookings": recent_bookings,
    }