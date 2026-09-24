from pydantic import BaseModel


class SeatLayoutCreate(BaseModel):
    venue_id: int
    rows: list[str]
    seats_per_row: int