from pydantic import BaseModel


class SeatCreate(BaseModel):
    venue_id: int
    row: str
    number: int