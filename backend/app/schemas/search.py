from pydantic import BaseModel


class PropertySearchRequest(BaseModel):
    location: str
    max_price: float
    bedrooms: int | None = None
