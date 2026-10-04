from app.database.db import get_database
from pymongo.errors import DuplicateKeyError


# save: inserts a new user_auth document into the user_auth collection
# called during registration — stores username, bcrypt hash, role, customer_id
async def save(user: dict):
    db = get_database()
    result = await db.user_auth.insert_one(user)
    user["_id"] = str(result.inserted_id)
    return user


# find_by_username: fetches a single user document by username
# used during login to retrieve the stored bcrypt hash for verification
async def find_by_username(username: str):
    db = get_database()
    user = await db.user_auth.find_one({"username": username})
    if user:
        user["_id"] = str(user["_id"])
    return user


async def find_admin():
    db = get_database()
    return await db.user_auth.find_one({"role": "admin"}, {"_id": 1})


async def create_admin_if_missing(user: dict) -> bool:
    db = get_database()
    await db.user_auth.create_index(
        "role",
        unique=True,
        partialFilterExpression={"role": "admin"},
        name="unique_admin_role",
    )
    try:
        result = await db.user_auth.update_one(
            {"role": "admin"},
            {"$setOnInsert": user},
            upsert=True,
        )
    except DuplicateKeyError:
        return False
    return result.upserted_id is not None


# find_all: returns every user document in the user_auth collection
# admin-only — password_hash stripping is handled in the service layer
async def find_all():
    db = get_database()
    users = []
    async for user in db.user_auth.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users
