from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    assigned_applications = relationship("Application", back_populates="assigned_officer")
    feedbacks_recorded = relationship("CustomerFeedback", back_populates="officer")

class Application(Base):
    __tablename__ = 'applications'

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    email = Column(String, nullable=True)
    current_step = Column(String, default="REGISTER", nullable=False)  # REGISTER, PERSONAL_INFO, KYC_UPLOAD, SIGNATURE
    status = Column(String, default="IN_PROGRESS", nullable=False)      # IN_PROGRESS, COMPLETED, ABANDONED, DRAFT
    assigned_officer_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    branch_name = Column(String, nullable=True)
    abandoned_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_officer = relationship("User", back_populates="assigned_applications")
    step_logs = relationship("JourneyStepLog", back_populates="application", cascade="all, delete-orphan")
    feedbacks = relationship("CustomerFeedback", back_populates="application", cascade="all, delete-orphan")

class JourneyStepLog(Base):
    __tablename__ = 'journey_step_logs'

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete="CASCADE"), nullable=False)
    step_name = Column(String, nullable=False)      # REGISTER, PERSONAL_INFO, KYC_UPLOAD, SIGNATURE
    status = Column(String, nullable=False)         # STARTED, COMPLETED, FAILED
    duration_seconds = Column(Float, nullable=True)  # Duration spent on the step
    error_message = Column(String, nullable=True)     # Error details if status = FAILED
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="step_logs")

class CustomerFeedback(Base):
    __tablename__ = 'customer_feedbacks'

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete="CASCADE"), nullable=False)
    abandoned_reason_category = Column(String, nullable=False)  # PRICING, UI_NAVIGATION, KYC_ISSUE, NO_INTEREST, OTHER
    notes = Column(String, nullable=True)
    recorded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="feedbacks")
    officer = relationship("User", back_populates="feedbacks_recorded")
