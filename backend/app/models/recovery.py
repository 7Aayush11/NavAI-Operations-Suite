from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database.session import Base

class RecoveryRecord(Base):
    __tablename__ = 'recovery_records'

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    application_date = Column(String, nullable=True)
    credit_score = Column(Integer, nullable=False)
    outstanding_amount = Column(Float, nullable=False)
    days_overdue = Column(Integer, nullable=False)
    previous_loan_defaults = Column(Integer, nullable=False, default=0)
    bankruptcy_history = Column(Integer, nullable=False, default=0)
    distance_from_branch = Column(Float, nullable=False, default=0.0)
    call_response = Column(Integer, nullable=False, default=0)
    priority_score = Column(Float, nullable=False, default=0.0)
    recovery_strategy = Column(String, nullable=False)  # Current strategy (can be overridden)
    original_strategy = Column(String, nullable=False)  # Initial ML prediction
    payment_status = Column(String, default="UNPAID", nullable=False)  # UNPAID, PAID
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
