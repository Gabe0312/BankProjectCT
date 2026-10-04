from typing import Optional
from fastapi import APIRouter, Depends, Header
from app.models.user_auth import RegisterRequest, LoginRequest, LoginResponse, BootstrapAdminRequest
import app.services.auth_service as auth_service
from app.dependencies.jwt_dependencies import require_admin

router = APIRouter()


@router.post("/auth/bootstrap-admin", status_code=201)
async def bootstrap_admin(
    body: BootstrapAdminRequest,
    bootstrap_token: Optional[str] = Header(default=None, alias="X-Admin-Bootstrap-Token"),
):
    return await auth_service.bootstrap_admin(body.password, bootstrap_token)


# POST /auth/register — public endpoint
# Delegates to auth_service which separately creates a customer document
# via customer_service, then creates the user_auth document with the linked customer_id
# Rejects reserved username "admin" and duplicate usernames
@router.post("/auth/register")
async def register(body: RegisterRequest):
    return await auth_service.register(
        body.username, body.password, body.name, body.email, body.phone
    )


# POST /auth/login — public endpoint
# Verifies credentials and returns a signed JWT
# AdminToken for role "admin", CustomerToken for role "customer"
@router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    return await auth_service.login(body.username, body.password)


# GET /auth/users — admin only (requires AdminToken)
# Returns all registered users — password hashes are stripped in the repository layer
@router.get("/auth/users")
async def get_all_users(current_user: dict = Depends(require_admin)):
    return await auth_service.get_all_users()
