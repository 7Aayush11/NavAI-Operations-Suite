from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from app.journey.models import Customer, ApplicationSession, JourneyEvent
from app.models.user import Application

class JourneyRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Customer Operations ---
    def get_customer(self, customer_id: int) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()

    def get_customer_by_email(self, email: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.email == email).first()

    def create_customer(self, full_name: str, email: str, phone_number: str) -> Customer:
        customer = Customer(full_name=full_name, email=email, phone_number=phone_number)
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    # --- Application Operations ---
    def get_application(self, application_id: int) -> Optional[Application]:
        return self.db.query(Application).filter(Application.id == application_id).first()

    def create_application(self, customer_id: int, branch_name: Optional[str] = None, assigned_officer_id: Optional[int] = None) -> Application:
        # Fetch customer to get default name/phone for existing application table requirements
        customer = self.get_customer(customer_id)
        cust_name = customer.full_name if customer else "Unknown"
        cust_phone = customer.phone_number if customer else "Unknown"
        cust_email = customer.email if customer else None

        application = Application(
            customer_id=customer_id,
            customer_name=cust_name,
            phone_number=cust_phone,
            email=cust_email,
            branch_name=branch_name,
            assigned_officer_id=assigned_officer_id,
            current_step="Application Started",
            status="IN_PROGRESS"
        )
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application

    def update_application(self, application: Application) -> Application:
        self.db.commit()
        self.db.refresh(application)
        return application

    # --- Session Operations ---
    def get_session(self, session_id: int) -> Optional[ApplicationSession]:
        return self.db.query(ApplicationSession).filter(ApplicationSession.id == session_id).first()

    def get_active_session_for_application(self, application_id: int) -> Optional[ApplicationSession]:
        return self.db.query(ApplicationSession).filter(
            ApplicationSession.application_id == application_id,
            ApplicationSession.is_active == True
        ).first()

    def create_session(self, application_id: int, device_type: str, browser: str, operating_system: str, ip_address: str, 
                       city: Optional[str] = None, state: Optional[str] = None, country: Optional[str] = None, 
                       latitude: Optional[float] = None, longitude: Optional[float] = None) -> ApplicationSession:
        
        # Deactivate any existing active session for this application
        active_sess = self.get_active_session_for_application(application_id)
        if active_sess:
            active_sess.is_active = False
            active_sess.ended_at = datetime.utcnow()

        session = ApplicationSession(
            application_id=application_id,
            device_type=device_type,
            browser=browser,
            operating_system=operating_system,
            ip_address=ip_address,
            city=city,
            state=state,
            country=country,
            latitude=latitude,
            longitude=longitude,
            is_active=True
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def deactivate_session(self, session_id: int) -> Optional[ApplicationSession]:
        session = self.get_session(session_id)
        if session and session.is_active:
            session.is_active = False
            session.ended_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(session)
        return session

    # --- Journey Event Operations ---
    def get_events_for_application(self, application_id: int) -> List[JourneyEvent]:
        return self.db.query(JourneyEvent).filter(
            JourneyEvent.application_id == application_id
        ).order_by(JourneyEvent.timestamp.asc()).all()

    def get_last_event_for_application(self, application_id: int) -> Optional[JourneyEvent]:
        return self.db.query(JourneyEvent).filter(
            JourneyEvent.application_id == application_id
        ).order_by(desc(JourneyEvent.timestamp), desc(JourneyEvent.id)).first()

    def get_completed_events_for_application(self, application_id: int) -> List[JourneyEvent]:
        return self.db.query(JourneyEvent).filter(
            JourneyEvent.application_id == application_id,
            JourneyEvent.status == "COMPLETED"
        ).all()

    def create_event(self, application_id: int, customer_id: int, session_id: int, step_name: str, step_order: int, status: str, 
                     time_spent_seconds: Optional[float] = None, device_type: str = "", browser: str = "", operating_system: str = "", 
                     ip_address: str = "", city: Optional[str] = None, state: Optional[str] = None, country: Optional[str] = None, 
                     latitude: Optional[float] = None, longitude: Optional[float] = None, failure_reason: Optional[str] = None, 
                     metadata_str: Optional[str] = None, timestamp: Optional[datetime] = None) -> JourneyEvent:
        
        event = JourneyEvent(
            application_id=application_id,
            customer_id=customer_id,
            session_id=session_id,
            step_name=step_name,
            step_order=step_order,
            status=status,
            timestamp=timestamp or datetime.utcnow(),
            time_spent_seconds=time_spent_seconds,
            device_type=device_type,
            browser=browser,
            operating_system=operating_system,
            ip_address=ip_address,
            city=city,
            state=state,
            country=country,
            latitude=latitude,
            longitude=longitude,
            failure_reason=failure_reason,
            metadata_json=metadata_str
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_journeys_by_customer(self, customer_id: int) -> List[Application]:
        return self.db.query(Application).filter(
            Application.customer_id == customer_id
        ).order_by(Application.created_at.desc()).all()
