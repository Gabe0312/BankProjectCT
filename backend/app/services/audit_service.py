from datetime import datetime
import app.repositories.audit_repository as audit_repo


# log: writes a new audit record — called by account_service on every financial operation
async def log(transaction_type: str, customer_id: str,
              accounts_involved: list, amount: float, note: str = None) -> dict:
    audit_record = {
        "transaction_type": transaction_type,
        "customer_id": customer_id,
        # List of account ids involved — 1 for deposit/withdrawal, 2 for transfer
        "accounts_involved": accounts_involved,
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat(),
        # Optional note for fraud flags, memos, or compliance annotations
        "note": note
    }
    return await audit_repo.save(audit_record)


# get_by_account: returns all audit records where a specific account was involved
async def get_by_account(account_id: str) -> list:
    return await audit_repo.find_by_account_id(account_id)


# get_by_customer: returns all audit records for a specific customer
async def get_by_customer(customer_id: str) -> list:
    return await audit_repo.find_by_customer_id(customer_id)


# get_all: returns every audit record — used for full compliance and fraud review
async def get_all() -> list:
    return await audit_repo.find_all()
