import logging
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None
        self.redis: Redis = None

    async def connect(self):
        # Initialize MongoDB Client
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Quick ping to verify MongoDB connectivity
            await self.client.admin.command('ping')
            logger.info("MongoDB connection established successfully.")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            self.client = None
            self.db = None

        # Initialize Redis Client
        try:
            self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True, protocol=2)
            # Quick ping to verify Redis connectivity
            await self.redis.ping()
            logger.info("Redis connection established successfully.")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.redis = None

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed.")


db_manager = DatabaseManager()
