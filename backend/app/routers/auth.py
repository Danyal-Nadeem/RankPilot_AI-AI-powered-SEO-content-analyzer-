from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Response, HTTPException, status
import jwt
from app.core.config import settings
from app.core.database import db_manager
from app.core.deps import get_current_user
from app.core.limiter import auth_rate_limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password
)
from app.models.user import UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])


def set_auth_cookies(response: Response, email: str):
    """
    Generate JWT tokens and set access_token and refresh_token in HTTP-only cookies.
    """
    access_token = create_access_token(subject=email)
    refresh_token = create_refresh_token(subject=email)

    is_prod = settings.APP_ENV == "production"

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=None,
        secure=is_prod,
        samesite="lax",
    )

    # Set refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=None,
        secure=is_prod,
        samesite="lax",
    )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth_rate_limiter)])
async def signup(user_in: UserCreate, response: Response):
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    # Check if user already exists
    existing_user = await db_manager.db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already registered."
        )

    # Hash password and create record
    hashed = hash_password(user_in.password)
    user_dict = {
        "email": user_in.email,
        "name": user_in.name,
        "hashed_password": hashed,
        "plan": user_in.plan,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db_manager.db["users"].insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)

    # Issue cookies
    set_auth_cookies(response, user_in.email)

    return user_dict


@router.post("/login", response_model=UserResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(auth_rate_limiter)])
async def login(credentials: UserLogin, response: Response):
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    # Validate email
    user = await db_manager.db["users"].find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )

    # Validate password
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )

    user["_id"] = str(user["_id"])

    # Issue cookies
    set_auth_cookies(response, credentials.email)

    return user


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token_endpoint(response: Response, refresh_token: Optional[str] = Cookie(None)):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing. Please log in."
        )

    try:
        payload = decode_token(refresh_token, is_refresh=True)
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token context."
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh session."
        )

    # Issue new access token cookie
    access_token = create_access_token(subject=email)
    is_prod = settings.APP_ENV == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        secure=is_prod,
        samesite="lax",
    )

    return {"message": "Token refreshed successfully."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    # Set cookies with max_age=0 to instruct client to delete them
    is_prod = settings.APP_ENV == "production"

    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        max_age=0,
        expires=0,
        path="/",
        secure=is_prod,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        max_age=0,
        expires=0,
        path="/",
        secure=is_prod,
        samesite="lax",
    )

    return {"message": "Logged out successfully."}
