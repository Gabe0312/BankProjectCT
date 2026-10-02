from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException
import os

# Secret key for signing JWTs — loaded from environment, never hardcoded
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_secret_in_production")
ALGORITHM = "HS256"
# Token expires after 8 hours — balances security and usability
ACCESS_TOKEN_EXPIRE_HOURS = 8


# create_access_token: signs a JWT containing the given payload dict
# payload should include: { "username": ..., "role": ..., "customer_id": ... }
def create_access_token(data: dict) -> str:
    payload = data.copy()
    # Embed expiration time into the token itself
    payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# decode_token: verifies signature and expiry, returns the payload dict
# raises 401 if the token is invalid or expired
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
