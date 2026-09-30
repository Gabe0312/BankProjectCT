from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import List
from app.models.transaction import Transaction


class AccountType(str, Enum):
    SAVINGS = "SAVINGS"
    CHECKING = "CHECKING"


class CreateAccountRequest(BaseModel):
    userId: int
    accountType: AccountType


class AmountRequest(BaseModel):
    amount: float


class Account(BaseModel):
    account_id: int
    user_id: int
    balance: float
    account_type: AccountType
    created_at: datetime = None
    transactions: List[Transaction] = []
