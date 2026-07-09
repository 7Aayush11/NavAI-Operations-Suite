from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.user import User, Role, Application, JourneyStepLog, CustomerFeedback
from app.schemas.journey import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    JourneyStepLogCreate, JourneyStepLogResponse,
    CustomerFeedbackCreate, CustomerFeedbackResponse
)
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/applications", tags=["journey"])

# ----------------- APPLICATIONS CRUD -----------------

@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    status_filter: Optional[str] = None,
    branch_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resolve the user's role name
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "User"

    query = db.query(Application)

    # Role Scoping: Operations Officers can only view their assigned applications
    if role_name == "Operations Officer":
        query = query.filter(Application.assigned_officer_id == current_user.id)
    
    # Query Filters
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if branch_filter:
        query = query.filter(Application.branch_name == branch_filter)

    return query.order_by(Application.created_at.desc()).all()

@router.get("/{id}", response_model=ApplicationResponse)
def get_application_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Role Scoping: Operations Officers can only view their assigned applications
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "User"
    if role_name == "Operations Officer" and application.assigned_officer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this application"
        )

    return application

@router.post("", response_model=ApplicationResponse)
def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    # Only Super Admin, Branch Manager, or Operations Officer can manually initialize an onboarding application
    current_user: User = Depends(RoleChecker(["Super Admin", "Branch Manager", "Operations Officer"]))
):
    new_app = Application(
        customer_name=application_data.customer_name,
        phone_number=application_data.phone_number,
        email=application_data.email,
        branch_name=application_data.branch_name,
        current_step="REGISTER",
        status="IN_PROGRESS",
        assigned_officer_id=application_data.assigned_officer_id
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Automatically write the starting timeline log for the REGISTER step
    start_log = JourneyStepLog(
        application_id=new_app.id,
        step_name="REGISTER",
        status="STARTED",
        timestamp=datetime.utcnow()
    )
    db.add(start_log)
    db.commit()
    db.refresh(new_app)
    
    return new_app

@router.put("/{id}", response_model=ApplicationResponse)
def update_application(
    id: int,
    update_data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Role Scoping: Operations Officers can only update their assigned applications
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "User"
    if role_name == "Operations Officer" and application.assigned_officer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this application"
        )

    # Operations Officer restriction: Officers cannot manually assign applications to other people
    if role_name == "Operations Officer" and update_data.assigned_officer_id is not None and update_data.assigned_officer_id != application.assigned_officer_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operations Officers cannot reassign applications"
        )

    # Apply updates
    if update_data.current_step is not None:
        application.current_step = update_data.current_step
    if update_data.status is not None:
        application.status = update_data.status
    if update_data.assigned_officer_id is not None:
        application.assigned_officer_id = update_data.assigned_officer_id
    if update_data.abandoned_reason is not None:
        application.abandoned_reason = update_data.abandoned_reason

    application.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(application)
    return application

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    id: int,
    db: Session = Depends(get_db),
    # Strictly restricted to Super Admin
    current_user: User = Depends(RoleChecker(["Super Admin"]))
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    db.delete(application)
    db.commit()
    return None


# ----------------- TIMELINE EVENTS / STEP LOGS -----------------

@router.get("/{id}/logs", response_model=List[JourneyStepLogResponse])
def get_step_logs(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify application exists
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Scoping check
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if role and role.name == "Operations Officer" and application.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(JourneyStepLog).filter(JourneyStepLog.application_id == id).order_by(JourneyStepLog.timestamp.asc()).all()

@router.post("/{id}/logs", response_model=JourneyStepLogResponse)
def record_step_log(
    id: int,
    log_data: JourneyStepLogCreate,
    db: Session = Depends(get_db),
    # Admins or Operations Officers who are managing the onboarding validation checks
    current_user: User = Depends(RoleChecker(["Super Admin", "Operations Officer"]))
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Scoping check
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if role and role.name == "Operations Officer" and application.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    new_log = JourneyStepLog(
        application_id=id,
        step_name=log_data.step_name,
        status=log_data.status,
        duration_seconds=log_data.duration_seconds,
        error_message=log_data.error_message,
        timestamp=datetime.utcnow()
    )
    db.add(new_log)
    
    # Side-effect: update current_step and status of the application automatically!
    application.current_step = log_data.step_name
    if log_data.status == "FAILED":
        application.status = "ABANDONED"
        application.abandoned_reason = log_data.error_message
    elif log_data.status == "COMPLETED" and log_data.step_name == "SIGNATURE":
        application.status = "COMPLETED"
        application.abandoned_reason = None
    
    application.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(new_log)
    return new_log


# ----------------- CUSTOMER FEEDBACK NOTES -----------------

@router.get("/{id}/feedbacks", response_model=List[CustomerFeedbackResponse])
def get_customer_feedbacks(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Scoping check
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if role and role.name == "Operations Officer" and application.assigned_officer_id != current_user.id:
         raise HTTPException(status_code=403, detail="Access denied")

    return db.query(CustomerFeedback).filter(CustomerFeedback.application_id == id).order_by(CustomerFeedback.timestamp.desc()).all()

@router.post("/{id}/feedbacks", response_model=CustomerFeedbackResponse)
def record_customer_feedback(
    id: int,
    feedback_data: CustomerFeedbackCreate,
    db: Session = Depends(get_db),
    # Officers or Admins who complete follow-up telephone checks
    current_user: User = Depends(RoleChecker(["Super Admin", "Operations Officer"]))
):
    application = db.query(Application).filter(Application.id == id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Scoping check
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if role and role.name == "Operations Officer" and application.assigned_officer_id != current_user.id:
         raise HTTPException(status_code=403, detail="Access denied")

    new_feedback = CustomerFeedback(
        application_id=id,
        abandoned_reason_category=feedback_data.abandoned_reason_category,
        notes=feedback_data.notes,
        recorded_by=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(new_feedback)
    
    # Side-effect: update application abandonment reason category in text if it's there
    application.abandoned_reason = f"Category: {feedback_data.abandoned_reason_category}. Note: {feedback_data.notes}"
    application.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_feedback)
    return new_feedback
