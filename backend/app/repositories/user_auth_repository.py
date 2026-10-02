from app.database.db import get_database


# save: inserts a new user_auth document into the users collection
# called during registration — stores username, bcrypt hash, role, customer_id
async def save(user: dict):
    db = get_database()
    result = await db.users.insert_one(user)
    # Return the MongoDB generated _id as a string
    user["_id"] = str(result.inserted_id)
    return user


# find_by_username: fetches a single user document by username
# used during login to retrieve the stored bcrypt hash for verification
async def find_by_username(username: str):
    db = get_database()
    user = await db.users.find_one({"username": username})
    if user:
        # Convert ObjectId to string for consistent response shape
        user["_id"] = str(user["_id"])
    return user


# find_all: returns every user document in the users collection
# admin-only — password_hash stripping is handled in the service layer
async def find_all():
    db = get_database()
    users = []
    async for user in db.users.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users
