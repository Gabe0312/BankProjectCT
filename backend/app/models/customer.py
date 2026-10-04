from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# Core customer document model — maps to the customers collection in MongoDB
class Customer(BaseModel):
    # customer_id is a string — MongoDB ObjectId stored as str
    customer_id: str
    name: str
    email: EmailStr
    phone: str
    created_at: datetime = None


# Request model for creating a new customer
class CreateCustomerRequest(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)
    name: str
    email: EmailStr
    phone: str


# Request model for updating an existing customer — all fields optional
class UpdateCustomerRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
