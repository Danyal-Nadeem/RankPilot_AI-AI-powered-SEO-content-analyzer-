from typing import Optional
from fastapi import Cookie, HTTPException, status
import jwt
from app.core.database import db_manager
from app.core.security import decode_token


async def get_current_user(access_token: Optional[str] = Cookie(None)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not access_token:
        raise credentials_exception

    try:
        payload = decode_token(access_token, is_refresh=False)
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "access":
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception

    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is offline."
        )

    user = await db_manager.db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception

    # Convert MongoDB ObjectId to string
    user["_id"] = str(user["_id"])
    return user
