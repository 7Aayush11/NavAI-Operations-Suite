from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# --- Predefined Enum Values ---

class StepNameEnum(str, Enum):
    STARTED = "Application Started"
    PAN_UPLOAD = "PAN Uploaded"
    AADHAAR_UPLOAD = "Aadhaar Uploaded"
    OTP_VERIFIED = "OTP Verified"
    BANK_DETAILS = "Bank Details"
    DOCUMENT_UPLOAD = "Document Upload"
    VIDEO_KYC = "Video KYC"
    SUBMITTED = "Application Submitted"

class EventStatusEnum(str, Enum):
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class EndStatusEnum(str, Enum):
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    ABANDONED = "ABANDONED"

class DeviceTypeEnum(str, Enum):
    MOBILE = "MOBILE"
    TABLET = "TABLET"
    DESKTOP = "DESKTOP"

# --- Request / Response Schemas ---

class CustomerCreate(BaseModel):
    full_name: str
    email: str
    phone_number: str

class CustomerResponse(CustomerCreate):
    id: int

    class Config:
        orm_mode = True

class JourneyStartRequest(BaseModel):
    customer_id: int = Field(..., description="ID of the customer starting the onboarding.")
    branch_name: Optional[str] = Field(None, description="Branch location name.")
    assigned_officer_id: Optional[int] = Field(None, description="Assigned officer user ID.")
    
    # Session Details
    device_type: DeviceTypeEnum = Field(..., description="Device classification.")
    browser: str = Field(..., description="Browser name and version.")
    operating_system: str = Field(..., description="Operating System.")
    ip_address: str = Field(..., description="Client IP address.")
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class JourneyStartResponse(BaseModel):
    application_id: int
    session_id: int

class JourneyEventRequest(BaseModel):
    application_id: int
    session_id: int
    step_name: StepNameEnum
    status: EventStatusEnum
    time_spent_seconds: Optional[float] = Field(None, ge=0)
    failure_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class JourneyEndRequest(BaseModel):
    application_id: int
    session_id: int
    status: EndStatusEnum
    reason: Optional[str] = Field(None, description="Reason for rejection or abandonment.")

class JourneyEventResponse(BaseModel):
    id: int
    application_id: int
    customer_id: int
    session_id: int
    step_name: str
    step_order: int
    status: str
    timestamp: datetime
    time_spent_seconds: Optional[float]
    device_type: str
    browser: str
    operating_system: str
    ip_address: str
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    failure_reason: Optional[str]
    metadata_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class JourneyTimelineResponse(BaseModel):
    application_id: int
    customer_id: int
    customer_name: str
    status: str
    current_step: str
    created_at: datetime
    total_duration_seconds: float = Field(..., description="Total time spent on completed steps in seconds.")
    events: List[JourneyEventResponse] = []

    class Config:
        orm_mode = True

class ApplicationJourneyResponse(BaseModel):
    id: int
    customer_id: int
    status: str
    current_step: str
    created_at: datetime
    updated_at: datetime
    events_count: int

    class Config:
        orm_mode = True

class CustomerJourneysResponse(BaseModel):
    customer_id: int
    full_name: str
    email: str
    phone_number: str
    journeys: List[ApplicationJourneyResponse] = []

    class Config:
        orm_mode = True
