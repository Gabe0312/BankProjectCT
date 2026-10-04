from bson import ObjectId
from app.database.db import get_database


# save: inserts a new account or replaces an existing one by account_id
async def save(account: dict):
    db = get_database()
    # If account already has an _id, replace the existing document
    if "_id" in account:
        # Strip _id from the replacement doc — MongoDB _id is immutable
        doc = {k: v for k, v in account.items() if k != "_id"}
        await db.accounts.replace_one({"_id": ObjectId(account["_id"])}, doc)
    else:
        # New account — let MongoDB generate the _id
        result = await db.accounts.insert_one(account)
        account["_id"] = str(result.inserted_id)
    return account


# find_by_id: fetches a single account document by its MongoDB ObjectId
async def find_by_id(account_id: str):
    db = get_database()
    # Convert string id to ObjectId for MongoDB query
    account = await db.accounts.find_one({"_id": ObjectId(account_id)})
    if account:
        # Convert _id back to string for response
        account["_id"] = str(account["_id"])
    return account


# find_all: returns every account document in the accounts collection
async def find_all():
    db = get_database()
    accounts = []
    async for account in db.accounts.find():
        account["_id"] = str(account["_id"])
        accounts.append(account)
    return accounts


# find_by_customer_id: returns all accounts belonging to a specific customer
async def find_by_customer_id(customer_id: str):
    db = get_database()
    accounts = []
    async for account in db.accounts.find({"customer_id": customer_id}):
        account["_id"] = str(account["_id"])
        accounts.append(account)
    return accounts


# find_premium: returns accounts whose balance is >= threshold cents
async def find_premium(threshold_cents: int):
    db = get_database()
    accounts = []
    legacy_threshold = threshold_cents / 100
    query = {
        "$or": [
            {"balance_cents": {"$gte": threshold_cents}},
            {
                "balance_cents": {"$exists": False},
                "balance": {"$gte": legacy_threshold},
            },
        ]
    }
    async for account in db.accounts.find(query):
        account["_id"] = str(account["_id"])
        accounts.append(account)
    return accounts


# delete_by_id: removes a single account document by its MongoDB ObjectId
async def delete_by_id(account_id: str):
    db = get_database()
    result = await db.accounts.delete_one({"_id": ObjectId(account_id)})
    # Returns True if a document was deleted, False if not found
    return result.deleted_count == 1


# update: applies partial field updates to an existing account document
# mirrors the same pattern used in customer_repository.update
async def update(account_id: str, fields: dict):
    db = get_database()
    # MongoDB $set operator updates only the specified fields — others stay unchanged
    await db.accounts.update_one(
        {"_id": ObjectId(account_id)},
        {"$set": fields}
    )
    # Return the updated document so the caller always gets fresh data
    return await find_by_id(account_id)
