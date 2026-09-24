from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.seat import Seat
from app.models.venue import Venue
from app.models.show import Show
from app.models.show_seat import ShowSeat
from app.models.pricing import PricingTier
from app.schemas.seat import SeatCreate
from app.schemas.seat_layout import SeatLayoutCreate
from app.auth.security import get_current_user


router = APIRouter(
    prefix="/seats",
    tags=["Seats"]
)


def create_show_seats_for_venue_seat(
    seat: Seat,
    db: Session
):
    """
    Whenever a venue seat is created, automatically add that seat
    to every existing show using the same venue — priced at
    *that show's own* pricing tier, not an arbitrary default one.
    """
    shows = db.query(Show).filter(
        Show.venue_id == seat.venue_id
    ).all()

    created_count = 0

    for show in shows:
        existing_show_seat = db.query(ShowSeat).filter(
            ShowSeat.show_id == show.id,
            ShowSeat.seat_id == seat.id
        ).first()

        if existing_show_seat:
            continue

        show_seat = ShowSeat(
            show_id=show.id,
            seat_id=seat.id,
            pricing_tier_id=show.pricing_tier_id,
            status="AVAILABLE"
        )

        db.add(show_seat)
        created_count += 1

    return created_count


@router.post("/")
def create_seat(
    seat_data: SeatCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can create seats"
        )

    venue = db.query(Venue).filter(
        Venue.id == seat_data.venue_id
    ).first()

    if not venue:
        raise HTTPException(
            status_code=404,
            detail="Venue not found"
        )

    existing_seat = db.query(Seat).filter(
        Seat.venue_id == seat_data.venue_id,
        Seat.row == seat_data.row,
        Seat.number == seat_data.number
    ).first()

    if existing_seat:
        raise HTTPException(
            status_code=400,
            detail="Seat already exists"
        )

    seat = Seat(
        venue_id=seat_data.venue_id,
        row=seat_data.row,
        number=seat_data.number
    )

    db.add(seat)
    db.flush()

    show_seats_created = create_show_seats_for_venue_seat(
        seat,
        db
    )

    db.commit()
    db.refresh(seat)

    return {
        "message": "Seat created successfully",
        "seat_id": seat.id,
        "venue_id": seat.venue_id,
        "row": seat.row,
        "number": seat.number,
        "show_seats_created": show_seats_created
    }


@router.post("/generate")
def generate_seat_layout(
    layout_data: SeatLayoutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can generate seats"
        )

    venue = db.query(Venue).filter(
        Venue.id == layout_data.venue_id
    ).first()

    if not venue:
        raise HTTPException(
            status_code=404,
            detail="Venue not found"
        )

    created_seats = []
    created_show_seats = 0

    for row in layout_data.rows:
        for number in range(
            1,
            layout_data.seats_per_row + 1
        ):
            existing_seat = db.query(Seat).filter(
                Seat.venue_id == layout_data.venue_id,
                Seat.row == row,
                Seat.number == number
            ).first()

            if existing_seat:
                # Make sure this existing venue seat is also linked
                # to every show using this venue.
                created_show_seats += create_show_seats_for_venue_seat(
                    existing_seat,
                    db
                )
                continue

            seat = Seat(
                venue_id=layout_data.venue_id,
                row=row,
                number=number
            )

            db.add(seat)
            db.flush()

            created_seats.append(f"{row}{number}")

            created_show_seats += create_show_seats_for_venue_seat(
                seat,
                db
            )

    db.commit()

    return {
        "message": "Seat layout generated successfully",
        "venue_id": layout_data.venue_id,
        "created_seats": created_seats,
        "total_created": len(created_seats),
        "show_seats_created": created_show_seats
    }
