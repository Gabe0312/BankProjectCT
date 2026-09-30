from fastapi import APIRouter
from typing import List
from app.models.account import Account, CreateAccountRequest, AmountRequest
from app.models.transaction import Transaction
import app.services.account_service as account_service

router = APIRouter()


@router.post("/accounts", response_model=Account)
def create_account(body: CreateAccountRequest):
    return account_service.create_account(body.userId, body.accountType)


@router.get("/accounts/{account_id}", response_model=Account)
def get_account(account_id: int):
    return account_service.get_account(account_id)


@router.post("/accounts/{account_id}/deposit")
def deposit(account_id: int, body: AmountRequest):
    return account_service.deposit(account_id, body.amount)


@router.post("/accounts/{account_id}/withdraw")
def withdraw(account_id: int, body: AmountRequest):
    return account_service.withdraw(account_id, body.amount)


@router.get("/accounts/{account_id}/transactions", response_model=List[Transaction])
def get_transactions(account_id: int):
    return account_service.get_transactions(account_id)
