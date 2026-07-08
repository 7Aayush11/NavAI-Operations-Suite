from datetime import datetime
from typing import List, Dict, Any, Optional
import json
from app.journey.repository import JourneyRepository
from app.journey.models import Customer, ApplicationSession, JourneyEvent
from app.models.user import Application

class JourneyService:
    # Ordered progression mapping
    STEP_ORDERS = {
        "Application Started": 1,
        "PAN Uploaded": 2,
        "Aadhaar Uploaded": 3,
        "OTP Verified": 4,
        "Bank Details": 5,
        "Document Upload": 6,
        "Video KYC": 7,
        "Application Submitted": 8
    }

    def __init__(self, repository: JourneyRepository):
        self.repo = repository

    def start_journey(self, customer_id: int, branch_name: Optional[str], assigned_officer_id: Optional[int], 
                      session_details: Dict[str, Any]) -> Dict[str, Any]:
        
        # 1. Validate customer exists
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise ValueError(f"Customer with ID {customer_id} does not exist.")

        # 2. Create new application
        application = self.repo.create_application(
            customer_id=customer_id,
            branch_name=branch_name,
            assigned_officer_id=assigned_officer_id
        )

        # 3. Create active session
        session = self.repo.create_session(
            application_id=application.id,
            device_type=session_details["device_type"],
            browser=session_details["browser"],
            operating_system=session_details["operating_system"],
            ip_address=session_details["ip_address"],
            city=session_details.get("city"),
            state=session_details.get("state"),
            country=session_details.get("country"),
            latitude=session_details.get("latitude"),
            longitude=session_details.get("longitude")
        )

        # 4. Automatically write the starting event: "Application Started"
        self.repo.create_event(
            application_id=application.id,
            customer_id=customer_id,
            session_id=session.id,
            step_name="Application Started",
            step_order=1,
            status="COMPLETED",
            time_spent_seconds=0.0,
            device_type=session.device_type,
            browser=session.browser,
            operating_system=session.operating_system,
            ip_address=session.ip_address,
            city=session.city,
            state=session.state,
            country=session.country,
            latitude=session.latitude,
            longitude=session.longitude
        )

        return {
            "application_id": application.id,
            "session_id": session.id
        }

    def record_event(self, application_id: int, session_id: int, step_name: str, status: str, 
                     time_spent_seconds: Optional[float] = None, failure_reason: Optional[str] = None, 
                     metadata: Optional[Dict[str, Any]] = None) -> JourneyEvent:
        
        # 1. Validate application
        application = self.repo.get_application(application_id)
        if not application:
            raise ValueError(f"Application with ID {application_id} does not exist.")

        # 2. Validate session
        session = self.repo.get_session(session_id)
        if not session:
            raise ValueError(f"Session with ID {session_id} does not exist.")
        if not session.is_active:
            raise ValueError(f"Session with ID {session_id} is no longer active.")
        if session.application_id != application_id:
            raise ValueError(f"Session does not match Application ID {application_id}.")

        # 3. Validate Step Enum
        if step_name not in self.STEP_ORDERS:
            raise ValueError(f"Step name '{step_name}' is invalid.")
        step_order = self.STEP_ORDERS[step_name]

        # 4. Transition Integrity Validation
        if step_order > 1:
            # Find predecessor step name
            pred_step = [name for name, order in self.STEP_ORDERS.items() if order == step_order - 1][0]
            completed_events = self.repo.get_completed_events_for_application(application_id)
            has_pred_completed = any(e.step_name == pred_step for e in completed_events)
            if not has_pred_completed:
                raise ValueError(f"Invalid transition: Cannot move to '{step_name}' because predecessor step '{pred_step}' is not completed.")

        # 5. Duplicate Consecutive Event Check
        last_event = self.repo.get_last_event_for_application(application_id)
        if last_event and last_event.step_name == step_name and last_event.status == status:
            raise ValueError(f"Duplicate consecutive event blocked: Step '{step_name}' with status '{status}' already logged.")

        # 6. Automatic Duration Calculation between steps
        calculated_duration = time_spent_seconds
        if calculated_duration is None:
            if last_event:
                delta = datetime.utcnow() - last_event.timestamp
                calculated_duration = max(0.0, delta.total_seconds())
            else:
                delta = datetime.utcnow() - session.created_at
                calculated_duration = max(0.0, delta.total_seconds())

        # Serialize metadata dictionary to text string
        metadata_str = json.dumps(metadata) if metadata else None

        # 7. Write Event
        event = self.repo.create_event(
            application_id=application_id,
            customer_id=application.customer_id,
            session_id=session_id,
            step_name=step_name,
            step_order=step_order,
            status=status,
            time_spent_seconds=calculated_duration,
            device_type=session.device_type,
            browser=session.browser,
            operating_system=session.operating_system,
            ip_address=session.ip_address,
            city=session.city,
            state=session.state,
            country=session.country,
            latitude=session.latitude,
            longitude=session.longitude,
            failure_reason=failure_reason,
            metadata_str=metadata_str
        )

        # Update application state representation
        application.current_step = step_name
        self.repo.update_application(application)

        return event

    def end_journey(self, application_id: int, session_id: int, end_status: str, reason: Optional[str] = None) -> Application:
        # 1. Validate application
        application = self.repo.get_application(application_id)
        if not application:
            raise ValueError(f"Application with ID {application_id} does not exist.")

        # 2. Validate session
        session = self.repo.get_session(session_id)
        if not session:
            raise ValueError(f"Session with ID {session_id} does not exist.")
        if not session.is_active:
            raise ValueError(f"Session with ID {session_id} is already closed.")

        # 3. Check conversion requirements on completion
        if end_status == "COMPLETED":
            completed_events = self.repo.get_completed_events_for_application(application_id)
            has_submitted = any(e.step_name == "Application Submitted" for e in completed_events)
            if not has_submitted:
                raise ValueError("Cannot complete journey: Onboarding has not been submitted yet.")

        # 4. Deactivate session
        self.repo.deactivate_session(session_id)

        # 5. Log final status event (Completed/Rejected/Abandoned) in the timeline
        step_label = "Approved" if end_status == "COMPLETED" else ("Rejected" if end_status == "REJECTED" else "Abandoned")
        
        last_event = self.repo.get_last_event_for_application(application_id)
        delta_seconds = 0.0
        if last_event:
            delta = datetime.utcnow() - last_event.timestamp
            delta_seconds = max(0.0, delta.total_seconds())

        self.repo.create_event(
            application_id=application_id,
            customer_id=application.customer_id,
            session_id=session_id,
            step_name=step_label,
            step_order=9,
            status="COMPLETED",
            time_spent_seconds=delta_seconds,
            device_type=session.device_type,
            browser=session.browser,
            operating_system=session.operating_system,
            ip_address=session.ip_address,
            city=session.city,
            state=session.state,
            country=session.country,
            latitude=session.latitude,
            longitude=session.longitude,
            failure_reason=reason
        )

        # 6. Set overall application state
        application.status = end_status
        application.current_step = step_label
        if reason:
            application.abandoned_reason = reason
        self.repo.update_application(application)

        return application

    def get_timeline(self, application_id: int) -> Dict[str, Any]:
        application = self.repo.get_application(application_id)
        if not application:
            raise ValueError(f"Application with ID {application_id} does not exist.")

        customer = self.repo.get_customer(application.customer_id)
        events = self.repo.get_events_for_application(application_id)

        # Sum total duration across completed steps
        total_duration = sum(e.time_spent_seconds for e in events if e.time_spent_seconds is not None)

        return {
            "application_id": application_id,
            "customer_id": application.customer_id,
            "customer_name": customer.full_name if customer else "Unknown Customer",
            "status": application.status,
            "current_step": application.current_step,
            "created_at": application.created_at,
            "total_duration_seconds": total_duration,
            "events": events
        }

    def get_customer_journeys(self, customer_id: int) -> Dict[str, Any]:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise ValueError(f"Customer with ID {customer_id} does not exist.")

        apps = self.repo.get_journeys_by_customer(customer_id)
        journeys = []
        for app in apps:
            events = self.repo.get_events_for_application(app.id)
            journeys.append({
                "id": app.id,
                "customer_id": app.customer_id,
                "status": app.status,
                "current_step": app.current_step,
                "created_at": app.created_at,
                "updated_at": app.updated_at,
                "events_count": len(events)
            })

        return {
            "customer_id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone_number": customer.phone_number,
            "journeys": journeys
        }
