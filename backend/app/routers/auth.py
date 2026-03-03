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
from app.models.user import UserCreate, UserLogin, UserResponse, NotificationSettingsRequest
import uuid
import logging

logger = logging.getLogger(__name__)

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
    verification_token = str(uuid.uuid4())
    user_dict = {
        "email": user_in.email,
        "name": user_in.name,
        "hashed_password": hashed,
        "plan": user_in.plan,
        "is_verified": False,
        "verification_token": verification_token,
        "bulk_completed_email": True,
        "weekly_digest_email": True,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db_manager.db["users"].insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)

    # Issue cookies
    set_auth_cookies(response, user_in.email)

    # Dispatch verification email
    try:
        from app.services.email import send_verification_email
        send_verification_email(user_in.email, user_in.name, verification_token)
    except Exception as email_err:
        logger.error(f"Failed sending signup verification email to {user_in.email}: {email_err}")

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


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_email(token: str):
    """
    Validate signup email token. Marks user profile as verified.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    user = await db_manager.db["users"].find_one({"verification_token": token})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )

    await db_manager.db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )

    return {"message": "Email address successfully verified!"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(current_user: dict = Depends(get_current_user)):
    """
    Regenerate verification token and resend the email link.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    if current_user.get("is_verified", False):
        return {"message": "Email is already verified."}

    new_token = str(uuid.uuid4())
    await db_manager.db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"verification_token": new_token}}
    )

    try:
        from app.services.email import send_verification_email
        send_verification_email(current_user["email"], current_user.get("name", "User"), new_token)
    except Exception as email_err:
        logger.error(f"Failed sending resend verification email: {email_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email."
        )

    return {"message": "Verification link has been resent."}


@router.put("/settings/notifications", status_code=status.HTTP_200_OK)
async def update_notification_settings(
    payload: NotificationSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update profile preferences logs in MongoDB.
    """
    if db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    await db_manager.db["users"].update_one(
        {"email": current_user["email"]},
        {
            "$set": {
                "bulk_completed_email": payload.bulk_completed_email,
                "weekly_digest_email": payload.weekly_digest_email
            }
        }
    )

    return {"message": "Notification preferences updated successfully."}

