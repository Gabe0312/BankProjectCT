from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import List, Optional
from bson import ObjectId
from app.models.transaction import Transaction


# PyObjectId: converts MongoDB's ObjectId to a plain string for JSON responses
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


# Enum for supported account types
class AccountType(str, Enum):
    SAVINGS = "SAVINGS"
    CHECKING = "CHECKING"


# Request model for creating a new account
class CreateAccountRequest(BaseModel):
    # customerId references the customer who owns this account
    customerId: str
    accountType: AccountType


# Request model for deposit and withdrawal operations
class AmountRequest(BaseModel):
    amount: float


# Request model for transferring funds between two accounts
class TransferRequest(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: float


# Request model for updating an existing account
class UpdateAccountRequest(BaseModel):
    account_type: Optional[AccountType] = None


# Core account document model — maps to the accounts collection in MongoDB
class Account(BaseModel):
    # account_id is a string — MongoDB ObjectId stored as str
    account_id: str
    # customer_id references the customer document in the customers collection
    customer_id: str
    balance: float
    account_type: AccountType
    created_at: datetime = None
    # Transactions are embedded directly inside the account document
    transactions: List[Transaction] = []
