from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Customer(Base):
    __tablename__ = 'customers'

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = relationship("Application", back_populates="customer", cascade="all, delete-orphan")
    journey_events = relationship("JourneyEvent", back_populates="customer", cascade="all, delete-orphan")

class ApplicationSession(Base):
    __tablename__ = 'application_sessions'

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete="CASCADE"), nullable=False)
    device_type = Column(String, nullable=False)                  # MOBILE, TABLET, DESKTOP
    browser = Column(String, nullable=False)                      # Chrome, Safari, Firefox
    operating_system = Column(String, nullable=False)             # iOS, Android, Windows, macOS
    ip_address = Column(String, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="sessions")
    journey_events = relationship("JourneyEvent", back_populates="session", cascade="all, delete-orphan")

class JourneyEvent(Base):
    __tablename__ = 'journey_events'

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.id', ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey('application_sessions.id', ondelete="CASCADE"), nullable=False)
    step_name = Column(String, nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String, nullable=False)                        # STARTED, COMPLETED, FAILED
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    time_spent_seconds = Column(Float, nullable=True)
    device_type = Column(String, nullable=False)
    browser = Column(String, nullable=False)
    operating_system = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    failure_reason = Column(Text, nullable=True)
    metadata_json = Column(Text, name="metadata", nullable=True)   # JSON string serialization helper
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="journey_events")
    customer = relationship("Customer", back_populates="journey_events")
    session = relationship("ApplicationSession", back_populates="journey_events")
