import sys
import os
from datetime import datetime, timedelta
import random

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models.user import User, Role, Application, JourneyStepLog, CustomerFeedback
from app.auth.security import get_password_hash

def seed_db():
    print("Dropping existing tables and recreating them...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    # 1. Seed Roles
    print("Seeding Roles...")
    roles_data = [
        {"name": "Super Admin", "description": "Manage users, roles, system config, view everything, analytics, AI recommendations"},
        {"name": "Branch Manager", "description": "View applications, journey analytics, customer analytics, AI recommendations, reports"},
        {"name": "Operations Officer", "description": "View assigned applications, update application status, record events"},
        {"name": "Analyst", "description": "View dashboards, funnel analytics, AI insights, export reports (read-only)"}
    ]
    
    db_roles = {}
    for r in roles_data:
        role = Role(name=r["name"], description=r["description"])
        db.add(role)
        db.commit()
        db.refresh(role)
        db_roles[role.name] = role
        print(f"  Created role: {role.name}")
        
    # 2. Seed Users
    print("Seeding Users...")
    users_data = [
        {
            "full_name": "System Administrator",
            "email": "admin@navadhan.com",
            "password": "adminpassword",
            "role_name": "Super Admin"
        },
        {
            "full_name": "Branch Manager One",
            "email": "manager@navadhan.com",
            "password": "managerpassword",
            "role_name": "Branch Manager"
        },
        {
            "full_name": "Operations Officer One",
            "email": "officer@navadhan.com",
            "password": "officerpassword",
            "role_name": "Operations Officer"
        },
        {
            "full_name": "Analyst User One",
            "email": "analyst@navadhan.com",
            "password": "analystpassword",
            "role_name": "Analyst"
        }
    ]
    
    db_users = {}
    for u in users_data:
        role = db_roles[u["role_name"]]
        hashed_pwd = get_password_hash(u["password"])
        user = User(
            full_name=u["full_name"],
            email=u["email"],
            password_hash=hashed_pwd,
            role_id=role.id,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db_users[u["role_name"]] = user
        print(f"  Created user: {user.email} ({u['role_name']})")
        
    # 3. Seed Mock Applications & Onboarding Journeys
    print("Seeding Applications & Onboarding Funnel (Targeting ~48% Conversion)...")
    
    branches = ["Mumbai West", "Bandra Branch", "Worli Hub", "Thane Regional"]
    officer = db_users["Operations Officer"]
    
    # We will generate 50 mock applications
    num_applications = 50
    steps = ["REGISTER", "PERSONAL_INFO", "KYC_UPLOAD", "SIGNATURE"]
    
    kyc_errors = [
        "Document glare rendering text unreadable",
        "Liveness check: face match mismatch with ID card",
        "ID barcode scanning validation timeout",
        "Image upload failed due to slow network connections",
        "OCR extraction error: missing document corners"
    ]
    
    abandoned_feedbacks = [
        {"cat": "KYC_ISSUE", "notes": "Customer got stuck on KYC photo upload 3 times. Camera kept freezing."},
        {"cat": "UI_NAVIGATION", "notes": "Customer struggled to input address fields. Page reload reset the form."},
        {"cat": "PRICING", "notes": "Called customer. They decided the loan processing fees were too high."},
        {"cat": "NO_INTEREST", "notes": "Customer filled basic info but lost interest. Prefers paper application."},
        {"cat": "OTHER", "notes": "Customer's phone numbers changed. Unable to complete security SMS validation."}
    ]

    random.seed(42)  # For reproducible seeding numbers
    
    completed_count = 0
    abandoned_count = 0
    in_progress_count = 0
    
    first_names = ["Raj", "Amit", "Sanjay", "Vikram", "Priya", "Neha", "Ananya", "Deepak", "Aarav", "Kiara", "Karan", "Simran", "Rahul", "Aditya", "Riya", "Pooja"]
    last_names = ["Sharma", "Verma", "Mehta", "Patel", "Joshi", "Gupta", "Sen", "Nair", "Rao", "Reddy", "Singh", "Deshmukh", "Chawla", "Bose", "Das"]

    for i in range(1, num_applications + 1):
        cust_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        phone = f"+91 {random.randint(7000000000, 9999999999)}"
        email = f"{cust_name.lower().replace(' ', '.')}@example.com"
        branch = random.choice(branches)
        
        # Decide conversion path
        # Index determines how far they go
        # We target approx 48% Completed (24), 8% In Progress (4), 44% Abandoned (22)
        roll = random.random()
        
        if roll < 0.48:
            # 1. COMPLETED PATH
            app_status = "COMPLETED"
            curr_step = "SIGNATURE"
            abandon_reason = None
            completed_count += 1
        elif roll < 0.56:
            # 2. IN_PROGRESS PATH
            app_status = "IN_PROGRESS"
            curr_step = random.choice(["PERSONAL_INFO", "KYC_UPLOAD"])
            abandon_reason = None
            in_progress_count += 1
        else:
            # 3. ABANDONED PATH
            app_status = "ABANDONED"
            # Decide where they drop off
            # Problem 5 specifies that they don't know where, but we seed the bottleneck at KYC_UPLOAD (65% of drop-offs)
            drop_roll = random.random()
            if drop_roll < 0.10:
                curr_step = "REGISTER"
                abandon_reason = "Failed basic onboarding registration"
            elif drop_roll < 0.25:
                curr_step = "PERSONAL_INFO"
                abandon_reason = "Dropped out during address input"
            elif drop_roll < 0.85: # 60% bottleneck at KYC
                curr_step = "KYC_UPLOAD"
                abandon_reason = random.choice(kyc_errors)
            else:
                curr_step = "SIGNATURE"
                abandon_reason = "Verification signature timeout"
            abandoned_count += 1

        # Calculate dates
        days_ago = random.randint(1, 14)
        created_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(1, 23))
        updated_time = created_time + timedelta(minutes=random.randint(5, 60))
        
        application = Application(
            customer_name=cust_name,
            phone_number=phone,
            email=email,
            current_step=curr_step,
            status=app_status,
            assigned_officer_id=officer.id,
            branch_name=branch,
            abandoned_reason=abandon_reason,
            created_at=created_time,
            updated_at=updated_time
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        
        # 4. Generate Journey Step Logs
        app_steps = []
        for s in steps:
            app_steps.append(s)
            if s == curr_step:
                break
                
        for step_idx, step_name in enumerate(app_steps):
            # Calculate duration
            # KYC takes longer, and failed steps can have high or low duration
            is_last = (step_name == curr_step)
            
            if step_name == "REGISTER":
                duration = random.uniform(15.0, 45.0)
            elif step_name == "PERSONAL_INFO":
                duration = random.uniform(45.0, 180.0)
            elif step_name == "KYC_UPLOAD":
                duration = random.uniform(120.0, 450.0)  # KYC takes longer
            else: # SIGNATURE
                duration = random.uniform(30.0, 120.0)
                
            step_time = created_time + timedelta(seconds=sum([30, 60]) * step_idx)
            
            if is_last and app_status == "ABANDONED":
                # Log step start
                log_start = JourneyStepLog(
                    application_id=application.id,
                    step_name=step_name,
                    status="STARTED",
                    duration_seconds=None,
                    timestamp=step_time
                )
                db.add(log_start)
                
                # Log step failure
                log_fail = JourneyStepLog(
                    application_id=application.id,
                    step_name=step_name,
                    status="FAILED",
                    duration_seconds=duration,
                    error_message=abandon_reason,
                    timestamp=step_time + timedelta(seconds=int(duration))
                )
                db.add(log_fail)
            else:
                # Normal successful logs
                log_start = JourneyStepLog(
                    application_id=application.id,
                    step_name=step_name,
                    status="STARTED",
                    duration_seconds=None,
                    timestamp=step_time
                )
                db.add(log_start)
                
                log_comp = JourneyStepLog(
                    application_id=application.id,
                    step_name=step_name,
                    status="COMPLETED",
                    duration_seconds=duration,
                    timestamp=step_time + timedelta(seconds=int(duration))
                )
                db.add(log_comp)
        
        # 5. Generate Customer Feedback notes for Abandoned applications
        if app_status == "ABANDONED" and random.random() < 0.85: # 85% follow-up rate
            feedback_template = random.choice(abandoned_feedbacks)
            
            # If the step was KYC but category is PRICING, make them align
            if curr_step == "KYC_UPLOAD" and random.random() < 0.70:
                cat = "KYC_ISSUE"
                notes = f"Follow-up: customer experienced '{abandon_reason}' during photo upload. Lost interest after multiple attempts."
            else:
                cat = feedback_template["cat"]
                notes = f"Follow-up call: {feedback_template['notes']}"
                
            feedback = CustomerFeedback(
                application_id=application.id,
                abandoned_reason_category=cat,
                notes=notes,
                recorded_by=officer.id,
                timestamp=updated_time + timedelta(hours=random.randint(2, 24))
            )
            db.add(feedback)
            
        db.commit()

    db.close()
    
    print("\n--- Seeding Results Summary ---")
    print(f"  Total Applications Generated: {num_applications}")
    print(f"  Completed Applications (Conversions): {completed_count} ({completed_count/num_applications*100:.1f}%)")
    print(f"  Abandoned Applications (Drop-offs): {abandoned_count} ({abandoned_count/num_applications*100:.1f}%)")
    print(f"  In Progress Applications: {in_progress_count} ({in_progress_count/num_applications*100:.1f}%)")
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
