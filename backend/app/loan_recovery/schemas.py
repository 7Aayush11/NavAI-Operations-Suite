from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class RecoveryRecordBase(BaseModel):
    customer_name: str
    application_date: Optional[str] = None
    credit_score: int
    outstanding_amount: float
    days_overdue: int
    previous_loan_defaults: int
    bankruptcy_history: int
    distance_from_branch: float
    call_response: int
    priority_score: float
    recovery_strategy: str
    original_strategy: str
    payment_status: str
    notes: Optional[str] = None

class RecoveryRecordCreate(RecoveryRecordBase):
    pass

class RecoveryRecordUpdate(BaseModel):
    recovery_strategy: Optional[str] = None
    notes: Optional[str] = None
    payment_status: Optional[str] = None

class RecoveryRecordResponse(RecoveryRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class StrategyStat(BaseModel):
    strategy: str
    count: int
    total_amount: float

class RecoveryStatsResponse(BaseModel):
    total_outstanding: float
    total_records: int
    high_risk_count: int
    strategy_distribution: List[StrategyStat]

class PredictionInput(BaseModel):
    outstanding_amount: float
    days_overdue: int
    previous_defaults: int
    bankruptcy_history: int
    credit_score: int
    distance_from_branch: float
    call_response: int

class PredictionResponse(BaseModel):
    recommended_strategy: str
    prediction_confidence: float
    class_probabilities: Dict[str, float]
    priority_score: float
    risk_level: str
    recommended_action: str
    estimated_recovery_cost: float

class StrategyAverage(BaseModel):
    strategy: str
    average_outstanding: float
    average_days_overdue: float
    average_priority_score: float
    average_credit_score: float

class AnalyticsResponse(BaseModel):
    strategy_counts: Dict[str, int]
    outstanding_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    credit_score_distribution: Dict[str, int]
    days_overdue_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    averages_by_strategy: List[StrategyAverage]
    top_10_priority_customers: List[RecoveryRecordResponse]
    business_insights: List[str]

class DashboardResponse(BaseModel):
    total_customers: int
    average_priority_score: float
    average_outstanding: float
    average_days_overdue: float
    high_risk_customers_count: int
    strategy_distribution: List[StrategyStat]
    top_priority_customers: List[RecoveryRecordResponse]
