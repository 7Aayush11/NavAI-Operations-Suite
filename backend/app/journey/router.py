from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.session import get_db
from app.journey.repository import JourneyRepository
from app.journey.service import JourneyService
from app.journey.schemas import (
    CustomerCreate, CustomerResponse,
    JourneyStartRequest, JourneyStartResponse,
    JourneyEventRequest, JourneyEventResponse,
    JourneyEndRequest, JourneyTimelineResponse,
    CustomerJourneysResponse
)

router = APIRouter(prefix="/api/journey", tags=["journey_tracking"])

def get_journey_service(db: Session = Depends(get_db)) -> JourneyService:
    repo = JourneyRepository(db)
    return JourneyService(repo)

@router.post("/customer", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    repo = JourneyRepository(db)
    # Return existing if matched to prevent unique collisions
    existing = repo.get_customer_by_email(payload.email)
    if existing:
        return existing
    customer = repo.create_customer(
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number
    )
    return customer

@router.post("/start", response_model=JourneyStartResponse, status_code=status.HTTP_201_CREATED)
def start_journey(payload: JourneyStartRequest, service: JourneyService = Depends(get_journey_service)):
    try:
        session_details = {
            "device_type": payload.device_type,
            "browser": payload.browser,
            "operating_system": payload.operating_system,
            "ip_address": payload.ip_address,
            "city": payload.city,
            "state": payload.state,
            "country": payload.country,
            "latitude": payload.latitude,
            "longitude": payload.longitude
        }
        res = service.start_journey(
            customer_id=payload.customer_id,
            branch_name=payload.branch_name,
            assigned_officer_id=payload.assigned_officer_id,
            session_details=session_details
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/event", response_model=JourneyEventResponse, status_code=status.HTTP_201_CREATED)
def record_event(payload: JourneyEventRequest, service: JourneyService = Depends(get_journey_service)):
    try:
        event = service.record_event(
            application_id=payload.application_id,
            session_id=payload.session_id,
            step_name=payload.step_name,
            status=payload.status,
            time_spent_seconds=payload.time_spent_seconds,
            failure_reason=payload.failure_reason,
            metadata=payload.metadata
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/end", status_code=status.HTTP_200_OK)
def end_journey(payload: JourneyEndRequest, service: JourneyService = Depends(get_journey_service)):
    try:
        application = service.end_journey(
            application_id=payload.application_id,
            session_id=payload.session_id,
            end_status=payload.status,
            reason=payload.reason
        )
        return {
            "message": "Journey successfully closed.",
            "application_id": application.id,
            "status": application.status
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{application_id}", response_model=JourneyTimelineResponse)
def get_timeline(application_id: int, service: JourneyService = Depends(get_journey_service)):
    try:
        timeline = service.get_timeline(application_id)
        return timeline
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/customer/{customer_id}", response_model=CustomerJourneysResponse)
def get_customer_journeys(customer_id: int, service: JourneyService = Depends(get_journey_service)):
    try:
        data = service.get_customer_journeys(customer_id)
        return data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
