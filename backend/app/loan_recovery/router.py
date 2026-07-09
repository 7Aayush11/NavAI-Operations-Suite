from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.loan_recovery.schemas import (
    RecoveryRecordResponse,
    RecoveryStatsResponse,
    RecoveryRecordUpdate,
    PredictionInput,
    PredictionResponse,
    DashboardResponse,
    AnalyticsResponse
)
from app.loan_recovery.service import LoanRecoveryService

# Declare router without a fixed prefix so we can register paths flexibly for Swagger
router = APIRouter(tags=["loan_recovery"])

def get_recovery_service(db: Session = Depends(get_db)) -> LoanRecoveryService:
    return LoanRecoveryService(db)

# ----------------- NEW LOAN RECOVERY APIS -----------------

@router.get("/loan-recovery/dashboard", response_model=DashboardResponse)
def get_loan_recovery_dashboard(
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Retrieve overview dashboard metrics for the Loan Recovery AI module,
    including total customers, average priority score, average outstanding,
    strategy distribution, and top priority customers.
    """
    try:
        return service.get_dashboard()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load recovery dashboard: {e}"
        )

@router.post("/loan-recovery/predict", response_model=PredictionResponse)
def predict_loan_recovery_strategy(
    payload: PredictionInput,
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Predict the recommended recovery strategy using the loaded Random Forest model.
    Returns the recommended strategy, confidence score, all class probabilities,
    calculated Priority Score, Risk Level (High/Medium/Low), and descriptive recommended action.
    """
    try:
        return service.predict_strategy(
            outstanding_amount=payload.outstanding_amount,
            days_overdue=payload.days_overdue,
            previous_defaults=payload.previous_defaults,
            bankruptcy_history=payload.bankruptcy_history,
            credit_score=payload.credit_score,
            distance_from_branch=payload.distance_from_branch,
            call_response=payload.call_response
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {e}"
        )

@router.get("/loan-recovery/analytics", response_model=AnalyticsResponse)
def get_loan_recovery_analytics(
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Retrieve aggregated analytical distributions for strategies, outstanding amounts,
    priority scores, credit scores, days overdue, and averages grouped by strategy.
    """
    try:
        return service.get_analytics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate analytics: {e}"
        )


# ----------------- COMPATIBILITY APIS -----------------

@router.get("/loan-recovery/queue", response_model=List[RecoveryRecordResponse])
@router.get("/api/recovery/queue", response_model=List[RecoveryRecordResponse])
def get_queue(
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Get the prioritized loan recovery queue.
    """
    try:
        return service.get_recovery_queue()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recovery queue: {e}"
        )

@router.get("/loan-recovery/stats", response_model=RecoveryStatsResponse)
@router.get("/api/recovery/stats", response_model=RecoveryStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Get general metrics and stats for recovery.
    """
    try:
        return service.get_recovery_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate stats: {e}"
        )

@router.put("/loan-recovery/{record_id}", response_model=RecoveryRecordResponse)
@router.put("/api/recovery/{record_id}", response_model=RecoveryRecordResponse)
def update_record(
    record_id: int,
    payload: RecoveryRecordUpdate,
    current_user: User = Depends(get_current_user),
    service: LoanRecoveryService = Depends(get_recovery_service)
):
    """
    Update a loan recovery record strategy, comments, or payment status.
    """
    try:
        record = service.update_recovery_record(
            record_id=record_id,
            strategy=payload.recovery_strategy,
            notes=payload.notes
        )
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recovery record with ID {record_id} not found."
            )
        if payload.payment_status is not None:
            record.payment_status = payload.payment_status
            service.db.commit()
            service.db.refresh(record)
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update recovery record: {e}"
        )
