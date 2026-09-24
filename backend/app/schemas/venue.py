from pydantic import BaseModel


class VenueCreate(BaseModel):
    name: str
    address: str
    city: str