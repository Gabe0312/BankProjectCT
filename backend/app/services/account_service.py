from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.models.account import AccountType
import app.repositories.account_repository as account_repo
import app.repositories.transaction_repository as transaction_repo
import app.repositories.audit_repository as audit_repo


# create_account: creates a new account document for a customer in MongoDB
async def create_account(customer_id: str, account_type: AccountType) -> dict:
    account = {
        # customer_id links this account to its owner in the customers collection
        "customer_id": customer_id,
        "account_type": account_type,
        "balance": 0.0,
        "created_at": datetime.utcnow().isoformat(),
        # Transactions start as an empty embedded array
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


# get_all_accounts: returns every account in the accounts collection
async def get_all_accounts() -> list:
    return await account_repo.find_all()


# get_accounts_by_customer: returns all accounts owned by a specific customer
async def get_accounts_by_customer(customer_id: str) -> list:
    return await account_repo.find_by_customer_id(customer_id)


# get_premium_accounts: returns all accounts with balance >= threshold
async def get_premium_accounts(threshold: float) -> list:
    return await account_repo.find_premium(threshold)


# deposit: adds amount to account balance and writes a transaction + audit record
async def deposit(account_id: str, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    account = await get_account(account_id)
    account["balance"] += amount
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": str(ObjectId()),
        "txn_type": "DEPOSIT",
        "amount": amount,
        "created_at": datetime.utcnow().isoformat()
    }
    # Push transaction into the embedded array inside the account document
    await transaction_repo.append(account_id, txn)
    # Write audit record for compliance tracking
    await audit_repo.save({
        "transaction_type": "DEPOSIT",
        "customer_id": account["customer_id"],
        "accounts_involved": [account_id],
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"account_id": account_id, "balance": account["balance"]}


# withdraw: deducts amount from account balance and writes a transaction + audit record
async def withdraw(account_id: str, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    account = await get_account(account_id)
    if amount > account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    account["balance"] -= amount
    # Persist the updated balance back to MongoDB
    await account_repo.save(account)
    # Build the embedded transaction record
    txn = {
        "txn_id": str(ObjectId()),
        "txn_type": "WITHDRAWAL",
        "amount": amount,
        "created_at": datetime.utcnow().isoformat()
    }
    # Push transaction into the embedded array inside the account document
    await transaction_repo.append(account_id, txn)
    # Write audit record for compliance tracking
    await audit_repo.save({
        "transaction_type": "WITHDRAWAL",
        "customer_id": account["customer_id"],
        "accounts_involved": [account_id],
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"account_id": account_id, "balance": account["balance"]}


# transfer: moves amount from one account to another and writes an audit record
# order: debit from_account -> credit to_account -> write audit
async def transfer(from_account_id: str, to_account_id: str, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be positive")
    # Fetch both accounts — raises 404 if either is not found
    from_account = await get_account(from_account_id)
    to_account = await get_account(to_account_id)
    if amount > from_account["balance"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    # Debit the source account
    from_account["balance"] -= amount
    await account_repo.save(from_account)
    # Credit the destination account
    to_account["balance"] += amount
    await account_repo.save(to_account)
    # Write a single audit record covering both accounts involved in the transfer
    await audit_repo.save({
        "transaction_type": "TRANSFER",
        "customer_id": from_account["customer_id"],
        "accounts_involved": [from_account_id, to_account_id],
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {
        "from_account_id": from_account_id,
        "to_account_id": to_account_id,
        "amount": amount,
        "from_balance": from_account["balance"],
        "to_balance": to_account["balance"]
    }


# update_account: applies partial field updates to an existing account document
# delegates to account_repo.update — no raw db calls in the service layer
async def update_account(account_id: str, fields: dict) -> dict:
    # Verify account exists before attempting update — raises 404 if not found
    await get_account(account_id)
    # Strip out None values so only provided fields are updated
    db_fields = {k: v for k, v in fields.items() if v is not None}
    # Repository handles the $set operation and returns the updated document
    return await account_repo.update(account_id, db_fields)


# delete_account: removes an account document by id, raises 404 if not found
async def delete_account(account_id: str) -> dict:
    await get_account(account_id)
    deleted = await account_repo.delete_by_id(account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": f"Account {account_id} deleted successfully"}


# get_transactions: returns the embedded transactions list for an account
async def get_transactions(account_id: str) -> list:
    # Verify account exists before fetching transactions
    await get_account(account_id)
    return await transaction_repo.find_by_account_id(account_id)
