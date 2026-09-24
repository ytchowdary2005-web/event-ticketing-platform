from pydantic import BaseModel


class SeatLockRequest(BaseModel):
    show_seat_id: int