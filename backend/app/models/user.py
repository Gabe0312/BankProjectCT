from pydantic import BaseModel, EmailStr
from datetime import datetime


class User(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    created_at: datetime = None
