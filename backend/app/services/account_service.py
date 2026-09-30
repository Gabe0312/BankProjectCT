from datetime import datetime
from fastapi import HTTPException
from app.models.account import AccountType
import app.repositories.account_repository as account_repo
import app.repositories.transaction_repository as transaction_repo
import app.data.store as store


def create_account(user_id: int, account_type: AccountType) -> dict:
    account_id = store.account_id_counter
    account = {
        "account_id": account_id,
        "user_id": user_id,
        "account_type": account_type,
        "balance": 0.0,
        "created_at": datetime.utcnow().isoformat()
    }
    account_repo.save(account)
    store.account_id_counter += 1
    return account


def get_account(account_id: int) -> dict:
    account = account_repo.find_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


def deposit(account_id: int, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    account = get_account(account_id)
    account["balance"] += amount
    account_repo.save(account)
    txn = {
        "txn_id": store.transaction_id_counter,
        "txn_type": "DEPOSIT",
        "amount": amount,
        "created_at": datetime.utcnow().isoformat()
    }
    transaction_repo.append(account_id, txn)
    store.transaction_id_counter += 1
    return {"account_id": account_id, "balance": account["balance"]}


def withdraw(account_id: int, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    account = get_account(account_id)
    if amount > account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    account["balance"] -= amount
    account_repo.save(account)
    txn = {
        "txn_id": store.transaction_id_counter,
        "txn_type": "WITHDRAWAL",
        "amount": amount,
        "created_at": datetime.utcnow().isoformat()
    }
    transaction_repo.append(account_id, txn)
    store.transaction_id_counter += 1
    return {"account_id": account_id, "balance": account["balance"]}


def get_transactions(account_id: int) -> list:
    get_account(account_id)
    return transaction_repo.find_by_account_id(account_id)
