from fastapi import APIRouter, Depends
from app.models.account import Account, CreateAccountRequest, AmountRequest, TransferRequest, UpdateAccountRequest, NicknameRequest
from app.models.transaction import Transaction
import app.services.account_service as account_service
from app.dependencies.jwt_dependencies import require_admin, require_customer, get_current_user

router = APIRouter()


# POST /accounts — customer only, creates a new account for the logged-in customer
@router.post("/accounts")
async def create_account(body: CreateAccountRequest, current_user: dict = Depends(require_customer)):
    return await account_service.create_account(body.customerId, body.accountType, current_user, body.nickname)


# GET /accounts — admin only, returns all accounts in the system
@router.get("/accounts")
async def get_all_accounts(current_user: dict = Depends(require_admin)):
    return await account_service.get_all_accounts()


# GET /accounts/premium?threshold=X — admin only, returns accounts with balance >= threshold
# NOTE: defined BEFORE /accounts/{account_id} to avoid FastAPI matching "premium" as an id
@router.get("/accounts/premium")
async def get_premium_accounts(threshold: float, current_user: dict = Depends(require_admin)):
    return await account_service.get_premium_accounts(threshold)


# POST /accounts/transfer — customer only, transfers funds between two accounts
# NOTE: defined BEFORE /accounts/{account_id} to avoid FastAPI matching "transfer" as an id
@router.post("/accounts/transfer")
async def transfer(body: TransferRequest, current_user: dict = Depends(require_customer)):
    return await account_service.transfer(
        body.from_account_id,
        body.to_account_id,
        body.amount,
        current_user
    )


# GET /accounts/{account_id} — admin only, returns a single account by id
@router.get("/accounts/{account_id}")
async def get_account(account_id: str, current_user: dict = Depends(require_admin)):
    return await account_service.get_account(account_id)


# PUT /accounts/{account_id} — admin only, updates an existing account
@router.put("/accounts/{account_id}")
async def update_account(account_id: str, body: UpdateAccountRequest, current_user: dict = Depends(require_admin)):
    return await account_service.update_account(account_id, body.model_dump())


# DELETE /accounts/{account_id} — admin only, deletes an account by id
@router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: dict = Depends(require_admin)):
    return await account_service.delete_account(account_id)


# POST /accounts/{account_id}/deposit — customer only, deposits money into their account
@router.post("/accounts/{account_id}/deposit")
async def deposit(account_id: str, body: AmountRequest, current_user: dict = Depends(require_customer)):
    return await account_service.deposit(account_id, body.amount, current_user)


# POST /accounts/{account_id}/withdraw — customer only, withdraws money from their account
@router.post("/accounts/{account_id}/withdraw")
async def withdraw(account_id: str, body: AmountRequest, current_user: dict = Depends(require_customer)):
    return await account_service.withdraw(account_id, body.amount, current_user)


# GET /customers/{customer_id}/accounts — returns all accounts for a customer
# accessible by both admin and the customer themselves
@router.get("/customers/{customer_id}/accounts")
async def get_accounts_by_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    return await account_service.get_accounts_by_customer(customer_id, current_user)


# PATCH /accounts/{account_id}/nickname — customer only, updates nickname on their own account
@router.patch("/accounts/{account_id}/nickname")
async def update_nickname(account_id: str, body: NicknameRequest, current_user: dict = Depends(require_customer)):
    account = await account_service.get_account(account_id)
    if current_user.get("customer_id") != account["customer_id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return await account_service.update_account(account_id, {"nickname": body.nickname})


# GET /accounts/{account_id}/transactions — customer only, returns transaction history for an account
@router.get("/accounts/{account_id}/transactions")
async def get_transactions(account_id: str, current_user: dict = Depends(require_customer)):
    return await account_service.get_transactions(account_id, current_user)
