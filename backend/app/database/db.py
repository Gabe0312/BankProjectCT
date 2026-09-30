from contextlib import asynccontextmanager
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

client: AsyncIOMotorClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client
    client = AsyncIOMotorClient(MONGODB_URL)
    yield
    client.close()

def get_database():
    return client[DATABASE_NAME]
