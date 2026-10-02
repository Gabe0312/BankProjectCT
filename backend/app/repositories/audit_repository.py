from bson import ObjectId
from app.database.db import get_database


# save: inserts a new audit record into the audit collection
# called automatically on every deposit, withdrawal, and transfer
async def save(audit_record: dict):
    db = get_database()
    result = await db.audit.insert_one(audit_record)
    # Return the MongoDB generated _id as a string
    audit_record["_id"] = str(result.inserted_id)
    return audit_record


# find_by_account_number: returns all audit records where the account_number was involved
async def find_by_account_number(account_number: str):
    db = get_database()
    records = []
    async for record in db.audit.find({"account_numbers": account_number}):
        record["_id"] = str(record["_id"])
        records.append(record)
    return records


# find_by_customer_number: returns all audit records for a specific customer_number
async def find_by_customer_number(customer_number: str):
    db = get_database()
    records = []
    async for record in db.audit.find({"customer_number": customer_number}):
        record["_id"] = str(record["_id"])
        records.append(record)
    return records


# find_by_account_id: returns all audit records where the account was involved
async def find_by_account_id(account_id: str):
    db = get_database()
    records = []
    # accounts_involved is a list — $elemMatch finds records containing this account_id
    async for record in db.audit.find({"accounts_involved": account_id}):
        record["_id"] = str(record["_id"])
        records.append(record)
    return records


# find_by_customer_id: returns all audit records for a specific customer
async def find_by_customer_id(customer_id: str):
    db = get_database()
    records = []
    async for record in db.audit.find({"customer_id": customer_id}):
        record["_id"] = str(record["_id"])
        records.append(record)
    return records


# find_all: returns every audit record — used for compliance and fraud review
async def find_all():
    db = get_database()
    records = []
    async for record in db.audit.find():
        record["_id"] = str(record["_id"])
        records.append(record)
    return records
