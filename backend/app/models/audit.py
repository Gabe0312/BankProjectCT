from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum


# Reuse transaction type enum for audit classification
class AuditTransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER = "TRANSFER"


# Core audit document model — maps to the audit collection in MongoDB
# Every deposit, withdrawal, and transfer writes one record here
class AuditRecord(BaseModel):
    # audit_id is a string — MongoDB ObjectId stored as str
    audit_id: str
    # Type of financial operation that triggered this audit record
    transaction_type: AuditTransactionType
    # The customer who owns the account(s) involved
    customer_id: str
    # One account for deposit/withdrawal, two accounts for transfer
    accounts_involved: List[str]
    amount: float
    # Timestamp of when the transaction occurred
    timestamp: datetime = None
    # Optional note for flagging fraud, memos, compliance notes, etc.
    note: Optional[str] = None


# Request model used internally by the service layer to log an audit record
class CreateAuditRequest(BaseModel):
    transaction_type: AuditTransactionType
    customer_id: str
    accounts_involved: List[str]
    amount: float
    note: Optional[str] = None
