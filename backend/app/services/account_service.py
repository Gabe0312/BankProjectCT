import random
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from fastapi import HTTPException
from typing import Any
from app.models.account import AccountType
import app.repositories.account_repository as account_repo
import app.repositories.transaction_repository as transaction_repo
import app.repositories.audit_repository as audit_repo
import app.repositories.customer_repository as customer_repo

CENT = Decimal("0.01")


def to_cents(value: Any) -> int:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError) as error:
        raise ValueError("Amount must be a valid decimal value") from error
    if not amount.is_finite():
        raise ValueError("Amount must be finite")
    rounded = amount.quantize(CENT, rounding=ROUND_HALF_UP)
    if rounded != amount:
        raise ValueError("Amount cannot contain fractions of a cent")
    return int(rounded * 100)


def legacy_dollars_to_cents(value: Any) -> int:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError) as error:
        raise ValueError("Stored amount is not a valid decimal value") from error
    if not amount.is_finite():
        raise ValueError("Stored amount must be finite")
    return int(amount.quantize(CENT, rounding=ROUND_HALF_UP) * 100)


def cents_to_dollars(cents: int) -> float:
    return float(Decimal(cents) / 100)


def cents_from_record(record: dict, cents_field: str, legacy_field: str) -> int:
    if cents_field in record:
        return int(record[cents_field])
    return legacy_dollars_to_cents(record.get(legacy_field, 0))


def _generate_account_number() -> str:
    return "ACC-" + str(random.randint(100000, 999999))


def _generate_txn_number() -> str:
    return "TXN-" + str(random.randint(100000, 999999))


def _transaction_response(transaction: dict) -> dict:
    result = dict(transaction)
    amount_cents = cents_from_record(result, "amount_cents", "amount")
    result["amount_cents"] = amount_cents
    result["amount"] = cents_to_dollars(amount_cents)
    return result


def _account_response(account: dict) -> dict:
    result = dict(account)
    balance_cents = cents_from_record(result, "balance_cents", "balance")
    result["balance_cents"] = balance_cents
    result["balance"] = cents_to_dollars(balance_cents)
    result["transactions"] = [
        _transaction_response(transaction)
        for transaction in result.get("transactions", [])
    ]
    return result


def _store_balance(account: dict, balance_cents: int) -> None:
    account["balance_cents"] = balance_cents
    account["balance"] = cents_to_dollars(balance_cents)


def _validated_cents(amount: Decimal, label: str) -> int:
    try:
        return to_cents(amount)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=f"{label} must be a valid amount in cents") from error


# create_account: creates a new account document for a customer in MongoDB
# verifies the token's customer_id matches the requested customer_id (self-scoping)
async def create_account(customer_id: str, account_type: AccountType, current_user: dict, nickname: str = None) -> dict:
    # Ensure the customer can only create accounts for themselves
    if current_user.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    # Look up customer_number to store alongside customer_id
    customer = await customer_repo.find_by_id(customer_id)
    customer_number = customer.get("customer_number", "") if customer else ""
    account = {
        "customer_id": customer_id,
        "customer_number": customer_number,
        "account_type": account_type,
        "account_number": _generate_account_number(),
        "nickname": nickname,
        "balance": 0.0,
        "balance_cents": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "transactions": []
    }
    # MongoDB generates the _id on insert — returned as str
    return _account_response(await account_repo.save(account))


# get_account: fetches a single account by id, raises 404 if not found
async def get_account(account_id: str) -> dict:
    account = await account_repo.find_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return _account_response(account)


# get_all_accounts: returns every account — admin only, no self-scoping needed
async def get_all_accounts() -> list:
    return [_account_response(account) for account in await account_repo.find_all()]


# get_accounts_by_customer: returns all accounts owned by a specific customer
# verifies the token's customer_id matches the requested customer_id (self-scoping)
async def get_accounts_by_customer(customer_id: str, current_user: dict) -> list:
    # Admin can view any customer's accounts — customers can only view their own
    if current_user.get("role") != "admin" and current_user.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    accounts = await account_repo.find_by_customer_id(customer_id)
    return [_account_response(account) for account in accounts]


# get_premium_accounts: returns all accounts with balance >= threshold — admin only
async def get_premium_accounts(threshold: Decimal) -> list:
    threshold_cents = _validated_cents(threshold, "Threshold")
    accounts = await account_repo.find_premium(threshold_cents)
    return [_account_response(account) for account in accounts]


# deposit: adds amount to account balance and writes a transaction + audit record
# verifies the account belongs to the token's customer_id (self-scoping)
async def deposit(account_id: str, amount: Decimal, current_user: dict) -> dict:
    amount_cents = _validated_cents(amount, "Deposit amount")
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    account = await get_account(account_id)
    # Ensure the customer can only deposit into their own accounts
    if current_user.get("customer_id") != account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    balance_cents = cents_from_record(account, "balance_cents", "balance") + amount_cents
    _store_balance(account, balance_cents)
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": _generate_txn_number(),
        "txn_type": "DEPOSIT",
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    # Push transaction into the embedded array inside the account document
    await transaction_repo.append(account_id, txn)
    # Write audit record for compliance tracking
    await audit_repo.save({
        "transaction_type": "DEPOSIT",
        "customer_id": account["customer_id"],
        "customer_number": account.get("customer_number", ""),
        "accounts_involved": [account_id],
        "account_numbers": [account.get("account_number", "")],
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {"account_id": account_id, "balance": account["balance"], "balance_cents": balance_cents}


# withdraw: deducts amount from account balance and writes a transaction + audit record
# verifies the account belongs to the token's customer_id (self-scoping)
async def withdraw(account_id: str, amount: Decimal, current_user: dict) -> dict:
    amount_cents = _validated_cents(amount, "Withdrawal amount")
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    account = await get_account(account_id)
    # Ensure the customer can only withdraw from their own accounts
    if current_user.get("customer_id") != account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    balance_cents = cents_from_record(account, "balance_cents", "balance")
    if amount_cents > balance_cents:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    balance_cents -= amount_cents
    _store_balance(account, balance_cents)
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": _generate_txn_number(),
        "txn_type": "WITHDRAWAL",
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    # Push transaction into the embedded array inside the account document
    await transaction_repo.append(account_id, txn)
    # Write audit record for compliance tracking
    await audit_repo.save({
        "transaction_type": "WITHDRAWAL",
        "customer_id": account["customer_id"],
        "customer_number": account.get("customer_number", ""),
        "accounts_involved": [account_id],
        "account_numbers": [account.get("account_number", "")],
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {"account_id": account_id, "balance": account["balance"], "balance_cents": balance_cents}


# transfer: moves amount from one account to another and writes an audit record
# verifies the from_account belongs to the token's customer_id (self-scoping)
# order: debit from_account -> credit to_account -> write audit
async def transfer(from_account_id: str, to_account_id: str, amount: Decimal, current_user: dict) -> dict:
    amount_cents = _validated_cents(amount, "Transfer amount")
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be positive")
    # Fetch both accounts — raises 404 if either is not found
    from_account = await get_account(from_account_id)
    to_account = await get_account(to_account_id)
    # Ensure the customer can only transfer from their own accounts
    if current_user.get("customer_id") != from_account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    from_balance_cents = cents_from_record(from_account, "balance_cents", "balance")
    to_balance_cents = cents_from_record(to_account, "balance_cents", "balance")
    if amount_cents > from_balance_cents:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    # Debit the source account
    from_balance_cents -= amount_cents
    _store_balance(from_account, from_balance_cents)
    await account_repo.save(from_account)
    await transaction_repo.append(from_account_id, {
        "txn_id": _generate_txn_number(),
        "txn_type": "TRANSFER OUT",
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "created_at": datetime.utcnow().isoformat() + "Z"
    })
    # Credit the destination account
    to_balance_cents += amount_cents
    _store_balance(to_account, to_balance_cents)
    await account_repo.save(to_account)
    await transaction_repo.append(to_account_id, {
        "txn_id": _generate_txn_number(),
        "txn_type": "TRANSFER IN",
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "created_at": datetime.utcnow().isoformat() + "Z"
    })
    # Write a single audit record covering both accounts involved in the transfer
    await audit_repo.save({
        "transaction_type": "TRANSFER",
        "customer_id": from_account["customer_id"],
        "customer_number": from_account.get("customer_number", ""),
        "accounts_involved": [from_account_id, to_account_id],
        "account_numbers": [
            from_account.get("account_number", ""),
            to_account.get("account_number", "")
        ],
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {
        "from_account_id": from_account_id,
        "to_account_id": to_account_id,
        "amount": cents_to_dollars(amount_cents),
        "amount_cents": amount_cents,
        "from_balance": from_account["balance"],
        "from_balance_cents": from_balance_cents,
        "to_balance": to_account["balance"],
        "to_balance_cents": to_balance_cents,
    }


# update_account: applies partial field updates — admin only, no self-scoping needed
async def update_account(account_id: str, fields: dict) -> dict:
    # Verify account exists before attempting update — raises 404 if not found
    await get_account(account_id)
    # Strip out None values so only provided fields are updated
    db_fields = {k: v for k, v in fields.items() if v is not None}
    # Repository handles the $set operation and returns the updated document
    return await account_repo.update(account_id, db_fields)


# delete_account: removes an account document by id — admin only, no self-scoping needed
async def delete_account(account_id: str) -> dict:
    await get_account(account_id)
    deleted = await account_repo.delete_by_id(account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": f"Account {account_id} deleted successfully"}


# get_transactions: returns the embedded transactions list for an account
# verifies the account belongs to the token's customer_id (self-scoping)
async def get_transactions(account_id: str, current_user: dict) -> list:
    account = await get_account(account_id)
    # Ensure the customer can only view transactions for their own accounts
    if current_user.get("customer_id") != account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    transactions = await transaction_repo.find_by_account_id(account_id)
    return [_transaction_response(transaction) for transaction in transactions]
