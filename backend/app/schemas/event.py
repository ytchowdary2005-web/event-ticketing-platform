from pydantic import BaseModel


class EventCreate(BaseModel):
    name: str
    category: str
    description: str | None = None