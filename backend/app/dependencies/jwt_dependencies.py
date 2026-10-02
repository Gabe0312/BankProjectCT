from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import app.services.jwt_service as jwt_service

# HTTPBearer extracts the Bearer token from the Authorization header automatically
bearer_scheme = HTTPBearer()


# get_current_user: decodes the JWT and returns the payload dict
# used as a base dependency by require_admin and require_customer
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    # jwt_service.decode_token raises 401 if token is invalid or expired
    return jwt_service.decode_token(credentials.credentials)


# require_admin: ensures the token carries role "admin" (AdminToken)
# raises 403 Forbidden if the role is anything other than "admin"
def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# require_customer: ensures the token carries role "customer" (CustomerToken)
# self-scoping check (does this account belong to this customer) is handled
# in the service layer where it has access to the actual account data
def require_customer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    return current_user
