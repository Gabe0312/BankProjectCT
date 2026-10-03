from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum


class AuditTransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER = "TRANSFER"


# Core audit document model — maps to the audit collection in MongoDB
class AuditRecord(BaseModel):
    audit_id: str
    transaction_type: AuditTransactionType
    customer_id: str
    accounts_involved: List[str]
    amount: float
    timestamp: datetime = None
