from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Core user document model — maps to the users collection in MongoDB
# Links an auth identity (username + password_hash) to a customer document
class UserAuth(BaseModel):
    # username is unique — "admin" is reserved and cannot be registered by customers
    username: str
    # password_hash stores the BCrypt hash — plain text password is NEVER stored
    password_hash: str
    # role is either "admin" or "customer" — drives JWT token type and route access
    role: str
    # customer_id links to the customers collection — null for the admin account
    customer_id: Optional[str] = None
    created_at: datetime = None


# Request model for customer self-registration
# auth_service uses this to separately create a customer document via customer_service
# then creates the user_auth document — two separate concerns, two separate collections
class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    phone: str


class BootstrapAdminRequest(BaseModel):
    password: str = Field(min_length=8)


# Request model for login — returns a JWT on success
class LoginRequest(BaseModel):
    username: str
    password: str


# Response model returned after a successful login
# Frontend stores token, role, and customer_id in localStorage
class LoginResponse(BaseModel):
    access_token: str
    role: str
    # customer_id is None for admin — customers use it to scope their own data
    customer_id: Optional[str] = None
