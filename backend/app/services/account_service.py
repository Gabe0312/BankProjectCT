import random
from datetime import datetime
from fastapi import HTTPException
from app.models.account import AccountType
import app.repositories.account_repository as account_repo
import app.repositories.transaction_repository as transaction_repo
import app.repositories.audit_repository as audit_repo
import app.repositories.customer_repository as customer_repo


def _generate_account_number() -> str:
    return "ACC-" + str(random.randint(100000, 999999))


def _generate_txn_number() -> str:
    return "TXN-" + str(random.randint(100000, 999999))


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
        "created_at": datetime.utcnow().isoformat() + "Z",
        "transactions": []
    }
    # MongoDB generates the _id on insert — returned as str
    return await account_repo.save(account)


# get_account: fetches a single account by id, raises 404 if not found
async def get_account(account_id: str) -> dict:
    account = await account_repo.find_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


# get_all_accounts: returns every account — admin only, no self-scoping needed
async def get_all_accounts() -> list:
    return await account_repo.find_all()


# get_accounts_by_customer: returns all accounts owned by a specific customer
# verifies the token's customer_id matches the requested customer_id (self-scoping)
async def get_accounts_by_customer(customer_id: str, current_user: dict) -> list:
    # Admin can view any customer's accounts — customers can only view their own
    if current_user.get("role") != "admin" and current_user.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return await account_repo.find_by_customer_id(customer_id)


# get_premium_accounts: returns all accounts with balance >= threshold — admin only
async def get_premium_accounts(threshold: float) -> list:
    return await account_repo.find_premium(threshold)


# deposit: adds amount to account balance and writes a transaction + audit record
# verifies the account belongs to the token's customer_id (self-scoping)
async def deposit(account_id: str, amount: float, current_user: dict) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    account = await get_account(account_id)
    # Ensure the customer can only deposit into their own accounts
    if current_user.get("customer_id") != account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    account["balance"] += amount
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": _generate_txn_number(),
        "txn_type": "DEPOSIT",
        "amount": amount,
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
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {"account_id": account_id, "balance": account["balance"]}


# withdraw: deducts amount from account balance and writes a transaction + audit record
# verifies the account belongs to the token's customer_id (self-scoping)
async def withdraw(account_id: str, amount: float, current_user: dict) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    account = await get_account(account_id)
    # Ensure the customer can only withdraw from their own accounts
    if current_user.get("customer_id") != account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if amount > account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    account["balance"] -= amount
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": _generate_txn_number(),
        "txn_type": "WITHDRAWAL",
        "amount": amount,
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
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {"account_id": account_id, "balance": account["balance"]}


# transfer: moves amount from one account to another and writes an audit record
# verifies the from_account belongs to the token's customer_id (self-scoping)
# order: debit from_account -> credit to_account -> write audit
async def transfer(from_account_id: str, to_account_id: str, amount: float, current_user: dict) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be positive")
    # Fetch both accounts — raises 404 if either is not found
    from_account = await get_account(from_account_id)
    to_account = await get_account(to_account_id)
    # Ensure the customer can only transfer from their own accounts
    if current_user.get("customer_id") != from_account["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if amount > from_account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    # Debit the source account
    from_account["balance"] -= amount
    await account_repo.save(from_account)
    await transaction_repo.append(from_account_id, {
        "txn_id": _generate_txn_number(),
        "txn_type": "TRANSFER OUT",
        "amount": amount,
        "created_at": datetime.utcnow().isoformat() + "Z"
    })
    # Credit the destination account
    to_account["balance"] += amount
    await account_repo.save(to_account)
    await transaction_repo.append(to_account_id, {
        "txn_id": _generate_txn_number(),
        "txn_type": "TRANSFER IN",
        "amount": amount,
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
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return {
        "from_account_id": from_account_id,
        "to_account_id": to_account_id,
        "amount": amount,
        "from_balance": from_account["balance"],
        "to_balance": to_account["balance"]
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
    return await transaction_repo.find_by_account_id(account_id)
