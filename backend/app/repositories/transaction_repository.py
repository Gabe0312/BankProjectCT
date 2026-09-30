from bson import ObjectId
from app.database.db import get_database


# append: pushes a new transaction into the embedded transactions array
# inside the account document — transactions live inside the account, not separately
async def append(account_id: str, txn: dict):
    db = get_database()
    # MongoDB $push operator adds the transaction to the embedded array
    await db.accounts.update_one(
        {"_id": ObjectId(account_id)},
        {"$push": {"transactions": txn}}
    )


# find_by_account_id: returns the embedded transactions array from an account document
async def find_by_account_id(account_id: str):
    db = get_database()
    # Fetch only the transactions field from the account document
    account = await db.accounts.find_one(
        {"_id": ObjectId(account_id)},
        {"transactions": 1}
    )
    if not account:
        return []
    # Return the embedded transactions list, defaulting to empty if none exist
    return account.get("transactions", [])
