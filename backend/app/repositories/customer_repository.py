from bson import ObjectId
from app.database.db import get_database


# save: inserts a new customer document into the customers collection
async def save(customer: dict):
    db = get_database()
    result = await db.customers.insert_one(customer)
    # Return the MongoDB generated _id as a string
    customer["_id"] = str(result.inserted_id)
    return customer


# find_by_id: fetches a single customer document by its MongoDB ObjectId
async def find_by_id(customer_id: str):
    db = get_database()
    customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
    if customer:
        customer["_id"] = str(customer["_id"])
    return customer


# find_all: returns every customer document in the customers collection
async def find_all():
    db = get_database()
    customers = []
    async for customer in db.customers.find():
        customer["_id"] = str(customer["_id"])
        customers.append(customer)
    return customers


# update: applies partial field updates to an existing customer document
async def update(customer_id: str, fields: dict):
    db = get_database()
    # MongoDB $set operator updates only the specified fields
    await db.customers.update_one(
        {"_id": ObjectId(customer_id)},
        {"$set": fields}
    )
    # Return the updated document
    return await find_by_id(customer_id)


# delete_by_id: removes a single customer document by its MongoDB ObjectId
async def delete_by_id(customer_id: str):
    db = get_database()
    result = await db.customers.delete_one({"_id": ObjectId(customer_id)})
    # Returns True if a document was deleted, False if not found
    return result.deleted_count == 1
