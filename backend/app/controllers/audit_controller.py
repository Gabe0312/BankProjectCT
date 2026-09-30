from fastapi import APIRouter
from typing import List
import app.services.audit_service as audit_service

router = APIRouter()


# GET /audit — return all audit records for full compliance and fraud review
@router.get("/audit", response_model=List[dict])
async def get_all():
    return await audit_service.get_all()


# GET /audit/account/{account_id} — return all audit records for a specific account
@router.get("/audit/account/{account_id}", response_model=List[dict])
async def get_by_account(account_id: str):
    return await audit_service.get_by_account(account_id)


# GET /audit/customer/{customer_id} — return all audit records for a specific customer
@router.get("/audit/customer/{customer_id}", response_model=List[dict])
async def get_by_customer(customer_id: str):
    return await audit_service.get_by_customer(customer_id)
