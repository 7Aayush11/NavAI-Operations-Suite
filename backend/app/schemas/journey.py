from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# ----------------- JOURNEY STEP LOGS -----------------
class JourneyStepLogBase(BaseModel):
    step_name: str
    status: str
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None

class JourneyStepLogCreate(JourneyStepLogBase):
    pass

class JourneyStepLogResponse(JourneyStepLogBase):
    id: int
    application_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

# ----------------- CUSTOMER FEEDBACK -----------------
class CustomerFeedbackBase(BaseModel):
    abandoned_reason_category: str
    notes: Optional[str] = None

class CustomerFeedbackCreate(CustomerFeedbackBase):
    pass

class CustomerFeedbackResponse(CustomerFeedbackBase):
    id: int
    application_id: int
    recorded_by: int
    timestamp: datetime

    class Config:
        orm_mode = True

# ----------------- APPLICATION -----------------
class ApplicationBase(BaseModel):
    customer_name: str
    phone_number: str
    email: Optional[str] = None
    branch_name: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    assigned_officer_id: Optional[int] = None

class ApplicationUpdate(BaseModel):
    current_step: Optional[str] = None
    status: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    abandoned_reason: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: int
    current_step: str
    status: str
    assigned_officer_id: Optional[int] = None
    abandoned_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    step_logs: List[JourneyStepLogResponse] = []
    feedbacks: List[CustomerFeedbackResponse] = []

    class Config:
        orm_mode = True
