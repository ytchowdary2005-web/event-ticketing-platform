from pydantic import BaseModel
from typing import List


class BookingCreate(BaseModel):
    show_id: int
    show_seat_ids: List[int]