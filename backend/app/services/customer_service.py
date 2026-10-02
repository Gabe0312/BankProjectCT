import random
from datetime import datetime
from fastapi import HTTPException
import app.repositories.customer_repository as customer_repo


def _generate_customer_number() -> str:
    return "CUST-" + str(random.randint(100000, 999999))


# create_customer: inserts a new customer document into the customers collection
async def create_customer(name: str, email: str, phone: str) -> dict:
    customer = {
        "name": name,
        "email": email,
        "phone": phone,
        "customer_number": _generate_customer_number(),
        # Timestamp of when the customer was created
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    # MongoDB generates the _id on insert — returned as str
    return await customer_repo.save(customer)


# get_customer: fetches a single customer by id, raises 404 if not found
async def get_customer(customer_id: str) -> dict:
    customer = await customer_repo.find_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# get_all_customers: returns every customer in the customers collection
async def get_all_customers() -> list:
    return await customer_repo.find_all()


# update_customer: applies partial field updates to an existing customer
# only fields provided in the request body are updated — others stay unchanged
async def update_customer(customer_id: str, fields: dict) -> dict:
    # Verify customer exists before attempting update
    await get_customer(customer_id)
    # Strip out any None values so we only update fields that were provided
    update_fields = {k: v for k, v in fields.items() if v is not None}
    return await customer_repo.update(customer_id, update_fields)


# delete_customer: removes a customer document by id, raises 404 if not found
async def delete_customer(customer_id: str) -> dict:
    # Verify customer exists before attempting delete
    await get_customer(customer_id)
    deleted = await customer_repo.delete_by_id(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": f"Customer {customer_id} deleted successfully"}
