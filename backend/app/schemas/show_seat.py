from pydantic import BaseModel


class ShowSeatGenerate(BaseModel):
    show_id: int
class SeatBlockRequest(BaseModel):
    reason: str | None = None