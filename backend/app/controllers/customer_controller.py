from fastapi import APIRouter, Depends
from app.models.customer import CreateCustomerRequest, UpdateCustomerRequest
import app.services.customer_service as customer_service
from app.dependencies.jwt_dependencies import require_admin

router = APIRouter()


# GET /customers — admin only, returns all customers in the system
@router.get("/customers")
async def get_all_customers(current_user: dict = Depends(require_admin)):
    return await customer_service.get_all_customers()


# POST /customers — admin only, creates a new customer
@router.post("/customers")
async def create_customer(body: CreateCustomerRequest, current_user: dict = Depends(require_admin)):
    return await customer_service.create_customer(body.name, body.email, body.phone)


# GET /customers/{customer_id} — admin only, returns a single customer by id
@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: dict = Depends(require_admin)):
    return await customer_service.get_customer(customer_id)


# PUT /customers/{customer_id} — admin only, updates an existing customer
# only fields provided in the request body are updated — others stay unchanged
@router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, body: UpdateCustomerRequest, current_user: dict = Depends(require_admin)):
    return await customer_service.update_customer(customer_id, body.model_dump())


# DELETE /customers/{customer_id} — admin only, deletes a customer by id
@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(require_admin)):
    return await customer_service.delete_customer(customer_id)
