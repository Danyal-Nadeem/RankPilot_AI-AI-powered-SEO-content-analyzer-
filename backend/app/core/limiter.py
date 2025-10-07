import logging
from fastapi import HTTPException, Request, status
from app.core.database import db_manager

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds

    async def __call__(self, request: Request):
        # If Redis is not connected, skip rate limiting (fail-open)
        if not db_manager.redis:
            logger.warning("Redis is not available; skipping rate limiting.")
            return

        client_ip = request.client.host if request.client else "unknown"
        # Combine endpoint path and IP as the redis key
        path = request.url.path
        key = f"rate_limit:{path}:{client_ip}"

        try:
            async with db_manager.redis.pipeline(transaction=True) as pipe:
                pipe.incr(key)
                pipe.expire(key, self.window_seconds)
                results = await pipe.execute()

            # First result is the value of incr
            current_requests = results[0]

            if current_requests > self.requests_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts. Please try again in a minute."
                )
        except HTTPException:
            raise
        except Exception as e:
            # log Redis error and allow execution to continue (fail-open)
            logger.error(f"Rate limiting error: {e}")
            return


# Standard rate limiters
auth_rate_limiter = RateLimiter(requests_limit=5, window_seconds=60)
