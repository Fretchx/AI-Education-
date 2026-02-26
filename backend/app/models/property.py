from pydantic import BaseModel


class Property(BaseModel):
    id: str
    price: float
    location: str
    bedrooms: int
    agent_id: str
