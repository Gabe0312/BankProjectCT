import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import random

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "bank_db")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def customer_number():
    return "CUST-" + str(random.randint(100000, 999999))

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Clear existing data
    await db.user_auth.delete_many({})
    await db.customers.delete_many({})

    # Seed customers
    customers = [
        {"name": "John Smith",   "email": "jsmith@email.com",   "phone": "555-0101"},
        {"name": "Ana Garcia",   "email": "agarcia@email.com",  "phone": "555-0102"},
        {"name": "Mike Lee",     "email": "mlee@email.com",     "phone": "555-0103"},
        {"name": "Sara Wilson",  "email": "swilson@email.com",  "phone": "555-0104"},
        {"name": "Tom Martin",   "email": "tmartin@email.com",  "phone": "555-0105"},
    ]

    usernames = ["jsmith", "agarcia", "mlee", "swilson", "tmartin"]

    for i, c in enumerate(customers):
        c["customer_number"] = customer_number()
        c["created_at"] = datetime.utcnow().isoformat() + "Z"
        result = await db.customers.insert_one(c)
        customer_id = str(result.inserted_id)

        await db.user_auth.insert_one({
            "username": usernames[i],
            "password_hash": pwd_context.hash("pass1234"),
            "role": "customer",
            "customer_id": customer_id,
            "customer_number": c["customer_number"],
            "created_at": datetime.utcnow().isoformat() + "Z"
        })
        print(f"Created customer + user: {usernames[i]}")

    # Seed admin
    await db.user_auth.insert_one({
        "username": "admin",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "customer_id": None,
        "created_at": datetime.utcnow().isoformat() + "Z"
    })
    print("Created admin user")

    client.close()
    print("Seeding complete!")

asyncio.run(seed())
