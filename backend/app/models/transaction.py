from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional


# Enum for all supported transaction types
class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER_OUT = "TRANSFER OUT"
    TRANSFER_IN = "TRANSFER IN"


class Transaction(BaseModel):
    # txn_id is now a string — MongoDB ObjectId stored as str
    txn_id: str
    txn_type: TransactionType
    amount: float
    amount_cents: Optional[int] = None
    created_at: datetime = None
