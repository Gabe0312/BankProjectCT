from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

client: AsyncIOMotorClient = None

async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URL)

async def close_db():
    global client
    client.close()

def get_database():
    return client[DATABASE_NAME]
