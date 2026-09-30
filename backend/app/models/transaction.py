from pydantic import BaseModel
from datetime import datetime
from enum import Enum


# Enum for the two supported transaction types
class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class Transaction(BaseModel):
    # txn_id is now a string — MongoDB ObjectId stored as str
    txn_id: str
    txn_type: TransactionType
    amount: float
    created_at: datetime = None
