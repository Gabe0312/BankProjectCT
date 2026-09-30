# Phase 5 — MongoDB Atlas Integration: Session Notes

**Date:** September 30, 2026
**Status:** Complete — all 19 routes verified against MongoDB Atlas

---

## What Was Done This Session

Phase 5 migrated the entire backend from an in-memory Python dictionary store (`store.py`) to a live MongoDB Atlas cloud database. Every layer of the MVC stack was rewritten or created from scratch.

---

## Final Project Structure

```
BankProjectCT/
├── backend/
│   ├── app/
│   │   ├── main.py                         # FastAPI entry point, lifespan, all routers registered
│   │   ├── controllers/
│   │   │   ├── account_controller.py       # 11 endpoints
│   │   │   ├── customer_controller.py      # 5 endpoints (NEW)
│   │   │   └── audit_controller.py         # 3 endpoints (NEW)
│   │   ├── models/
│   │   │   ├── account.py                  # Account, CreateAccountRequest, AmountRequest, TransferRequest, UpdateAccountRequest
│   │   │   ├── transaction.py              # Transaction, TransactionType (txn_id: str)
│   │   │   ├── customer.py                 # Customer, CreateCustomerRequest, UpdateCustomerRequest (NEW)
│   │   │   ├── audit.py                    # AuditRecord, CreateAuditRequest (NEW)
│   │   │   └── user.py                     # Deprecated — merged into customer.py
│   │   ├── services/
│   │   │   ├── account_service.py          # 10 async methods
│   │   │   ├── customer_service.py         # 5 async methods (NEW)
│   │   │   └── audit_service.py            # 4 async methods (NEW)
│   │   ├── repositories/
│   │   │   ├── account_repository.py       # 7 async methods
│   │   │   ├── transaction_repository.py   # 2 async methods
│   │   │   ├── customer_repository.py      # 5 async methods (NEW)
│   │   │   └── audit_repository.py         # 4 async methods (NEW)
│   │   └── database/
│   │       └── db.py                       # Motor AsyncIOMotorClient, lifespan, get_database()
│   ├── config.py                           # Loads MONGODB_URL and DATABASE_NAME from .env
│   ├── .env                                # Real Atlas connection string (never commit to git)
│   └── requirements.txt                    # fastapi, uvicorn, motor, pymongo, python-dotenv, pydantic[email]
└── task_doc/
    ├── plan.txt                            # Phase 5 marked COMPLETE
    ├── phase5_mongodb_tasks.txt            # All steps 1-6 marked complete
    ├── phase5_session_notes.md             # This file
    ├── system_architecture.txt
    └── tech_stack_reasoning.txt
```

---

## Bugs Fixed This Session

### Bug 1 — Route Conflict: `/accounts/transfer` matched as `/{account_id}`
**Problem:** FastAPI matched the literal string `"transfer"` as an `account_id` path parameter, causing transfer requests to hit the wrong handler.

**Fix:** Moved `/accounts/transfer` and `/accounts/premium` above `/{account_id}` in `account_controller.py`. FastAPI matches routes top-to-bottom — specific routes must come before wildcard routes.

---

### Bug 2 — Missing `update` method in `account_repository.py`
**Problem:** `account_service.update_account` was calling `get_database()` directly instead of going through the repository layer, breaking the MVC separation.

**Fix:** Added `update(account_id, fields)` to `account_repository.py` using MongoDB `$set` operator. Service layer now delegates to the repository.

---

### Bug 3 — Duplicate Pydantic in `requirements.txt`
**Problem:** Both `pydantic` and `pydantic[email]` were listed, causing a conflict on install.

**Fix:** Removed the plain `pydantic` line, kept `pydantic[email]` which includes the base package.

---

### Bug 4 — MongoDB `_id` Immutable WriteError
**Problem:** `account_repository.save` was passing the full account dict (including `_id`) to `replace_one`, causing MongoDB to throw a `WriteError` because `_id` is immutable.

**Fix:** Strip `_id` from the replacement document before calling `replace_one`:
```python
doc = {k: v for k, v in account.items() if k != "_id"}
await db.accounts.replace_one({"_id": ObjectId(account["_id"])}, doc)
```

---

## Step-by-Step Changes

### Step 1 — DB Connection & Lifecycle
- **`backend/.env`** — updated with real MongoDB Atlas connection string for `cluster0.ltofpov.mongodb.net`
- **`app/database/db.py`** — rewrote using FastAPI lifespan context manager (replaces deprecated `on_event`). Connects Motor client on startup, closes on shutdown. Exposes `get_database()` for repositories.
- **`app/main.py`** — wired lifespan from `db.py` into the FastAPI app. Registered all three routers under `/api` prefix.

### Step 2 — Models
- **`app/models/transaction.py`** — changed `txn_id: int` to `txn_id: str` (MongoDB ObjectId as string)
- **`app/models/account.py`** — changed `account_id: int` to `account_id: str`, renamed `user_id` to `customer_id`, renamed `userId` to `customerId` in `CreateAccountRequest`. Added `PyObjectId` helper, `TransferRequest`, and `UpdateAccountRequest`.
- **`app/models/user.py`** — deprecated, replaced with a comment pointing to `customer.py`
- **`app/models/customer.py`** — new file. `Customer`, `CreateCustomerRequest`, `UpdateCustomerRequest`. Merged from `user.py` with `phone` field added.
- **`app/models/audit.py`** — new file. `AuditRecord`, `CreateAuditRequest`, `AuditTransactionType` enum.

### Step 3 — Repositories
- **`app/repositories/account_repository.py`** — rewrote all methods as async Motor calls. Added `find_all`, `find_by_customer_id`, `find_premium`, `delete_by_id`, `update`. Fixed `save` to strip `_id` before `replace_one`.
- **`app/repositories/transaction_repository.py`** — rewrote as async. Uses MongoDB `$push` to append transactions into the embedded array inside the account document.
- **`app/repositories/customer_repository.py`** — new file. `save`, `find_by_id`, `find_all`, `update`, `delete_by_id`.
- **`app/repositories/audit_repository.py`** — new file. `save`, `find_by_account_id`, `find_by_customer_id`, `find_all`.

### Step 4 — Services
- **`app/services/account_service.py`** — all methods converted to `async def`. Removed `store.py` counter imports. IDs now come from MongoDB `inserted_id`. Added `get_all_accounts`, `get_accounts_by_customer`, `get_premium_accounts`, `update_account`, `delete_account`, `transfer`.
- **`app/services/customer_service.py`** — new file. `create_customer`, `get_customer`, `get_all_customers`, `update_customer`, `delete_customer`.
- **`app/services/audit_service.py`** — new file. `log`, `get_by_account`, `get_by_customer`, `get_all`.

### Step 5 — Controllers
- **`app/controllers/account_controller.py`** — all handlers converted to `async def`. Fixed `body.userId` → `body.customerId`. Fixed `account_id: int` → `account_id: str`. Moved `/transfer` and `/premium` above `/{account_id}`. Added `GET /accounts`, `PUT /accounts/{id}`, `DELETE /accounts/{id}`, `GET /accounts/premium`, `GET /customers/{id}/accounts`, `POST /accounts/transfer`.
- **`app/controllers/customer_controller.py`** — new file. 5 endpoints for full customer CRUD.
- **`app/controllers/audit_controller.py`** — new file. 3 endpoints for audit queries.

### Step 6 — Cleanup
- **`app/data/store.py`** — deleted after MongoDB Atlas confirmed working
- **`app/repositories/user_repository.py`** — deleted, replaced by `customer_repository.py`
- **`app/data/`** — empty folder deleted
- **`app/schemas/`** — empty folder deleted (never used)
- **`task_doc/plan.txt`** — Phase 5 marked COMPLETE
- **`task_doc/phase5_mongodb_tasks.txt`** — all steps 1-6 marked complete

---

## Key Design Decisions

| Decision | Reasoning |
|---|---|
| `user.py` merged into `customer.py` | User and Customer were the same entity. Merged with `phone` field added, `user_id` renamed to `customer_id` throughout. |
| Transactions embedded in account document | Transactions are always accessed via account context. Embedding avoids a separate collection and extra queries. |
| Audit as a separate collection | Audit records must be queryable across all accounts and customers for compliance. Embedding inside accounts would make cross-account queries impossible. |
| Transfer lives in `account_service.py` | Transfer is a two-account operation. Order: debit → credit → audit. MongoDB M0 does not support multi-document transactions. |
| Motor over PyMongo | FastAPI is async. PyMongo is synchronous and would block the event loop. Motor is the async wrapper built for this use case. |
| FastAPI lifespan over `on_event` | `on_event` startup/shutdown hooks are deprecated in modern FastAPI. Lifespan context manager is the current standard. |
| IDs as `str` (ObjectId) | MongoDB auto-generates `_id` as ObjectId. Stored and returned as string throughout all layers. |
| `_id` stripped before `replace_one` | MongoDB `_id` is immutable — including it in a replacement document throws a `WriteError`. Must be stripped before the call. |

---

## MongoDB Collections

| Collection | Description |
|---|---|
| `customers` | One document per customer. Fields: `name`, `email`, `phone`, `created_at`. |
| `accounts` | One document per account. Fields: `customer_id`, `account_type`, `balance`, `created_at`, `transactions` (embedded array). |
| `audit` | One document per financial operation. Fields: `transaction_type`, `customer_id`, `accounts_involved`, `amount`, `timestamp`, `note`. |

---

## All 19 Routes — Verified Against MongoDB Atlas

| # | Method | Endpoint | Description |
|---|---|---|---|
| 1 | POST | /api/customers | Create a new customer |
| 2 | GET | /api/customers | Get all customers |
| 3 | GET | /api/customers/{id} | Get a single customer |
| 4 | PUT | /api/customers/{id} | Partially update a customer |
| 5 | DELETE | /api/customers/{id} | Delete a customer |
| 6 | POST | /api/accounts | Create a new account |
| 7 | GET | /api/accounts | Get all accounts |
| 8 | GET | /api/accounts/{id} | Get a single account |
| 9 | GET | /api/accounts/premium?threshold=X | Get accounts with balance >= X |
| 10 | POST | /api/accounts/{id}/deposit | Deposit money into an account |
| 11 | POST | /api/accounts/{id}/withdraw | Withdraw money from an account |
| 12 | POST | /api/accounts/transfer | Transfer money between two accounts |
| 13 | PUT | /api/accounts/{id} | Partially update an account |
| 14 | DELETE | /api/accounts/{id} | Delete an account |
| 15 | GET | /api/customers/{id}/accounts | Get all accounts for a customer |
| 16 | GET | /api/accounts/{id}/transactions | Get transaction history for an account |
| 17 | GET | /api/audit | Get all audit records |
| 18 | GET | /api/audit/account/{id} | Get audit records for a specific account |
| 19 | GET | /api/audit/customer/{id} | Get audit records for a specific customer |

---

## How to Run

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger UI: `http://127.0.0.1:8000/docs`

---

## What's Next

| Phase | Description |
|---|---|
| Phase 6 | React frontend — pages, components, Axios API calls to this backend |
| Phase 7 | Bootstrap → Tailwind CSS transition |
| Phase 8 | Auth routes (register, login, logout), error handling, final cleanup |
