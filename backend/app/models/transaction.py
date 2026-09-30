from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class Transaction(BaseModel):
    txn_id: int
    txn_type: TransactionType
    amount: float
    created_at: datetime = None
