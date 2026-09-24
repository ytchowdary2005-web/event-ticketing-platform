from datetime import date, time

from pydantic import BaseModel


class ShowCreate(BaseModel):

    event_id: int

    venue_id: int

    pricing_tier_id: int

    show_date: date

    show_time: time
