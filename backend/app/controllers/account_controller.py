from fastapi import APIRouter
from typing import List
from app.models.account import Account, CreateAccountRequest, AmountRequest, TransferRequest, UpdateAccountRequest
from app.models.transaction import Transaction
import app.services.account_service as account_service

router = APIRouter()


# POST /accounts — create a new account for a customer
# fixes: body.userId -> body.customerId, def -> async def
@router.post("/accounts", response_model=dict)
async def create_account(body: CreateAccountRequest):
    return await account_service.create_account(body.customerId, body.accountType)


# GET /accounts — return all accounts in the system
@router.get("/accounts", response_model=List[dict])
async def get_all_accounts():
    return await account_service.get_all_accounts()


# GET /accounts/premium?threshold=X — return all accounts with balance >= threshold
# NOTE: defined BEFORE /accounts/{account_id} to avoid FastAPI matching
# "premium" as an account_id path parameter
@router.get("/accounts/premium", response_model=List[dict])
async def get_premium_accounts(threshold: float):
    return await account_service.get_premium_accounts(threshold)


# POST /accounts/transfer — transfer funds between two accounts
# NOTE: defined BEFORE /accounts/{account_id} to avoid FastAPI matching
# "transfer" as an account_id path parameter — this was the bug
@router.post("/accounts/transfer", response_model=dict)
async def transfer(body: TransferRequest):
    return await account_service.transfer(
        body.from_account_id,
        body.to_account_id,
        body.amount
    )


# GET /accounts/{account_id} — return a single account by id
# fixes: account_id: int -> account_id: str, def -> async def
@router.get("/accounts/{account_id}", response_model=dict)
async def get_account(account_id: str):
    return await account_service.get_account(account_id)


# PUT /accounts/{account_id} — update an existing account
@router.put("/accounts/{account_id}", response_model=dict)
async def update_account(account_id: str, body: UpdateAccountRequest):
    # Pass only the fields provided in the request body
    return await account_service.update_account(account_id, body.model_dump())


# DELETE /accounts/{account_id} — delete an account by id
@router.delete("/accounts/{account_id}", response_model=dict)
async def delete_account(account_id: str):
    return await account_service.delete_account(account_id)


# POST /accounts/{account_id}/deposit — deposit money into an account
# fixes: account_id: int -> account_id: str, def -> async def
@router.post("/accounts/{account_id}/deposit", response_model=dict)
async def deposit(account_id: str, body: AmountRequest):
    return await account_service.deposit(account_id, body.amount)


# POST /accounts/{account_id}/withdraw — withdraw money from an account
# fixes: account_id: int -> account_id: str, def -> async def
@router.post("/accounts/{account_id}/withdraw", response_model=dict)
async def withdraw(account_id: str, body: AmountRequest):
    return await account_service.withdraw(account_id, body.amount)


# GET /customers/{customer_id}/accounts — return all accounts for a customer
@router.get("/customers/{customer_id}/accounts", response_model=List[dict])
async def get_accounts_by_customer(customer_id: str):
    return await account_service.get_accounts_by_customer(customer_id)


# GET /accounts/{account_id}/transactions — return transaction history for an account
# fixes: account_id: int -> account_id: str, def -> async def
@router.get("/accounts/{account_id}/transactions", response_model=List[dict])
async def get_transactions(account_id: str):
    return await account_service.get_transactions(account_id)
