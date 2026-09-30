from fastapi import APIRouter
from typing import List
from app.models.customer import CreateCustomerRequest, UpdateCustomerRequest
import app.services.customer_service as customer_service

router = APIRouter()


# GET /customers — return all customers in the system
@router.get("/customers", response_model=List[dict])
async def get_all_customers():
    return await customer_service.get_all_customers()


# POST /customers — create a new customer
@router.post("/customers", response_model=dict)
async def create_customer(body: CreateCustomerRequest):
    return await customer_service.create_customer(body.name, body.email, body.phone)


# GET /customers/{customer_id} — return a single customer by id
@router.get("/customers/{customer_id}", response_model=dict)
async def get_customer(customer_id: str):
    return await customer_service.get_customer(customer_id)


# PUT /customers/{customer_id} — update an existing customer
# only fields provided in the request body are updated — others stay unchanged
@router.put("/customers/{customer_id}", response_model=dict)
async def update_customer(customer_id: str, body: UpdateCustomerRequest):
    return await customer_service.update_customer(customer_id, body.model_dump())


# DELETE /customers/{customer_id} — delete a customer by id
@router.delete("/customers/{customer_id}", response_model=dict)
async def delete_customer(customer_id: str):
    return await customer_service.delete_customer(customer_id)
