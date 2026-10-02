from datetime import datetime
import random
import app.repositories.audit_repository as audit_repo


def _generate_audit_number() -> str:
    return "AUD-" + str(random.randint(100000, 999999))


# log: writes a new audit record — called by account_service on every financial operation
# stores customer_number and account_numbers for human-readable display in AuditPage
async def log(transaction_type: str, customer_id: str, customer_number: str,
              accounts_involved: list, account_numbers: list,
              amount: float, note: str = None) -> dict:
    audit_record = {
        "audit_number": _generate_audit_number(),
        "transaction_type": transaction_type,
        "customer_id": customer_id,
        "customer_number": customer_number,
        "accounts_involved": accounts_involved,
        "account_numbers": account_numbers,
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "note": note
    }
    return await audit_repo.save(audit_record)


# get_by_account: returns all audit records where a specific account was involved
async def get_by_account(account_number: str) -> list:
    return await audit_repo.find_by_account_number(account_number)


# get_by_customer: returns all audit records for a specific customer
async def get_by_customer(customer_number: str) -> list:
    return await audit_repo.find_by_customer_number(customer_number)


# get_all: returns every audit record — used for full compliance and fraud review
async def get_all() -> list:
    return await audit_repo.find_all()
