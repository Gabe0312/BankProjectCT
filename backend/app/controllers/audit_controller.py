from fastapi import APIRouter, Depends
import app.services.audit_service as audit_service
from app.dependencies.jwt_dependencies import require_admin

router = APIRouter()


# GET /audit — admin only, returns all audit records for compliance and fraud review
@router.get("/audit")
async def get_all(current_user: dict = Depends(require_admin)):
    return await audit_service.get_all()


# GET /audit/account/{account_number} — admin only, returns all audit records for a specific account
@router.get("/audit/account/{account_number}")
async def get_by_account(account_number: str, current_user: dict = Depends(require_admin)):
    return await audit_service.get_by_account(account_number)


# GET /audit/customer/{customer_number} — admin only, returns all audit records for a specific customer
@router.get("/audit/customer/{customer_number}")
async def get_by_customer(customer_number: str, current_user: dict = Depends(require_admin)):
    return await audit_service.get_by_customer(customer_number)
