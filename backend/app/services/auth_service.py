from datetime import datetime
import os
import secrets
from fastapi import HTTPException
from passlib.context import CryptContext
import app.repositories.user_auth_repository as user_repo
import app.services.customer_service as customer_service
import app.services.jwt_service as jwt_service

# BCrypt context — all password hashing and verification goes through this
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# "admin" is reserved — no customer can register with this username
RESERVED_USERNAME = "admin"


async def bootstrap_admin(password: str, supplied_token: str | None) -> dict:
    expected_token = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Admin bootstrap is not configured")
    if len(expected_token) < 32:
        raise HTTPException(status_code=503, detail="Admin bootstrap token must be at least 32 characters")
    if not supplied_token or not secrets.compare_digest(supplied_token, expected_token):
        raise HTTPException(status_code=403, detail="Invalid bootstrap token")
    if await user_repo.find_admin():
        raise HTTPException(status_code=409, detail="An admin account already exists")

    admin = {
        "username": RESERVED_USERNAME,
        "password_hash": pwd_context.hash(password),
        "role": "admin",
        "customer_id": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    if not await user_repo.create_admin_if_missing(admin):
        raise HTTPException(status_code=409, detail="An admin account already exists")

    return {"message": "Admin account created. Sign in at /auth/login."}


# register: creates a new customer user account
# -> rejects reserved username and duplicate usernames
# -> hashes password with BCrypt (plain text is NEVER stored)
# -> creates a customer document first, then links it via customer_id
async def register(username: str, password: str, name: str, email: str, phone: str) -> dict:
    # Block the reserved admin username
    if username.lower() == RESERVED_USERNAME:
        raise HTTPException(status_code=400, detail="Username 'admin' is reserved")

    # Block duplicate usernames
    existing = await user_repo.find_by_username(username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create the customer document first — returns dict with _id
    customer = await customer_service.create_customer(name, email, phone)
    customer_id = customer["_id"]

    # Hash the password — BCrypt automatically salts the hash
    password_hash = pwd_context.hash(password)

    # Build and persist the user_auth document
    user = {
        "username": username,
        "password_hash": password_hash,
        "role": "customer",
        "customer_id": customer_id,
        "customer_number": customer.get("customer_number", ""),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    await user_repo.save(user)

    return {"message": "Registration successful", "customer_id": customer_id}


# login: verifies credentials and returns a signed JWT
# -> finds user by username, verifies BCrypt hash
# -> generates JWT containing { username, role, customer_id }
# -> AdminToken for role "admin", CustomerToken for role "customer"
async def login(username: str, password: str) -> dict:
    user = await user_repo.find_by_username(username)

    # Use a generic message to avoid leaking whether the username exists
    if not user or not pwd_context.verify(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Build JWT payload — role drives which routes the token can access
    token_data = {
        "username": user["username"],
        "role": user["role"],
        "customer_id": user.get("customer_id")  # None for admin
    }
    token = jwt_service.create_access_token(token_data)

    return {
        "access_token": token,
        "role": user["role"],
        "customer_id": user.get("customer_id")  # None for admin
    }


# get_all_users: returns all registered users — delegates to user_repo
# password hashes are stripped here in the service layer before returning
async def get_all_users() -> list:
    users = await user_repo.find_all()
    # Strip password_hash — never expose hashed passwords outside the auth layer
    for user in users:
        user.pop("password_hash", None)
    return users
