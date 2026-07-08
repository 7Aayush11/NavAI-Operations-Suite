import sys
import os
from datetime import datetime, timedelta
import random
import json

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models.user import User, Role, Application
from app.journey.models import Customer, ApplicationSession, JourneyEvent
from app.auth.security import get_password_hash

def seed_journey_db():
    print("=== SEEDING JOURNEY TRACKING DATA ===")
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
        
    # 2. Seed Users
    print("Seeding Users...")
    users_data = [
        {"full_name": "System Administrator", "email": "admin@navadhan.com", "password": "adminpassword", "role_name": "Super Admin"},
        {"full_name": "Branch Manager One", "email": "manager@navadhan.com", "password": "managerpassword", "role_name": "Branch Manager"},
        {"full_name": "Operations Officer One", "email": "officer@navadhan.com", "password": "officerpassword", "role_name": "Operations Officer"},
        {"full_name": "Analyst User One", "email": "analyst@navadhan.com", "password": "analystpassword", "role_name": "Analyst"}
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

    # 3. Generating Fake Customers & Applications (Total 100)
    print("Generating 100 customer journeys...")
    
    branches = ["Mumbai West", "Bandra Branch", "Worli Hub", "Thane Regional"]
    officer = db_users["Operations Officer"]
    
    first_names = ["Arjun", "Aditya", "Rajesh", "Pooja", "Vikram", "Sneha", "Karan", "Rohan", "Ananya", "Preeti", "Sanjay", "Deepak", "Neha", "Manoj", "Divya", "Amit", "Harsh", "Shruti", "Saurabh", "Payal"]
    last_names = ["Sharma", "Patel", "Verma", "Mehta", "Bose", "Gupta", "Joshi", "Deshmukh", "Nair", "Bhalerao", "Rao", "Chawla", "Bhat", "Shenoy", "Singh", "Das"]
    
    cities = [
        {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lng": 72.8777},
        {"city": "Pune", "state": "Maharashtra", "country": "India", "lat": 18.5204, "lng": 73.8567},
        {"city": "Thane", "state": "Maharashtra", "country": "India", "lat": 19.2183, "lng": 72.9781},
        {"city": "Navi Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0330, "lng": 73.0297}
    ]

    browsers = ["Chrome Mobile", "Safari", "Firefox Mobile", "Edge Mobile"]
    operating_systems = ["Android", "iOS", "Windows Mobile"]
    devices = ["MOBILE", "TABLET"]

    # Predefined Steps mapping
    steps = [
        ("Application Started", 1),
        ("PAN Uploaded", 2),
        ("Aadhaar Uploaded", 3),
        ("OTP Verified", 4),
        ("Bank Details", 5),
        ("Document Upload", 6),
        ("Video KYC", 7),
        ("Application Submitted", 8)
    ]

    random.seed(101) # Set seed for reproducible distribution
    
    summary = {
        "COMPLETED": 0,
        "FAILED_OTP": 0,
        "FAILED_KYC": 0,
        "ABANDONED_MIDWAY": 0
    }

    for i in range(1, 101):
        # Generate Customer profile
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '_')}_{i}@navadhan-test.com"
        phone = f"+91 {random.randint(7000000000, 9999999999)}"
        
        customer = Customer(full_name=name, email=email, phone_number=phone)
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        # Decide journey outcome for this application
        # Target: 45% Completed, 15% Failed OTP, 15% Failed KYC, 25% Abandoned Midway
        roll = random.random()
        
        if roll < 0.45:
            outcome = "COMPLETED"
        elif roll < 0.60:
            outcome = "FAILED_OTP"
        elif roll < 0.75:
            outcome = "FAILED_KYC"
        else:
            outcome = "ABANDONED_MIDWAY"
            
        summary[outcome] += 1
        
        # Create Application
        branch = random.choice(branches)
        days_ago = random.randint(1, 14)
        created_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        
        app = Application(
            customer_id=customer.id,
            customer_name=name,
            phone_number=phone,
            email=email,
            branch_name=branch,
            assigned_officer_id=officer.id,
            status="IN_PROGRESS" if outcome in ["COMPLETED", "ABANDONED_MIDWAY"] else "IN_PROGRESS",
            created_at=created_time,
            updated_at=created_time
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        
        # Create Session Details
        loc = random.choice(cities)
        device = random.choice(devices)
        browser = random.choice(browsers)
        os_name = random.choice(operating_systems)
        ip = f"192.168.{random.randint(1,254)}.{random.randint(1,254)}"
        
        session = ApplicationSession(
            application_id=app.id,
            device_type=device,
            browser=browser,
            operating_system=os_name,
            ip_address=ip,
            city=loc["city"],
            state=loc["state"],
            country=loc["country"],
            latitude=loc["lat"],
            longitude=loc["lng"],
            is_active=True,
            created_at=created_time
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Chronological Progression logging
        last_step_time = created_time
        
        # Determine step path
        if outcome == "COMPLETED":
            active_steps = steps # All 8 steps completed
        elif outcome == "FAILED_OTP":
            active_steps = steps[:4] # Up to OTP Verified
        elif outcome == "FAILED_KYC":
            active_steps = steps[:7] # Up to Video KYC
        else: # ABANDONED_MIDWAY
            active_steps = steps[:random.randint(2, 5)] # Drops out after PAN, Aadhaar or OTP
            
        for idx, (step_name, order) in enumerate(active_steps):
            # Calculate duration spent
            if order == 1:
                duration = 0.0
                status = "COMPLETED"
            else:
                if order == 2: duration = random.uniform(20.0, 50.0)      # PAN
                elif order == 3: duration = random.uniform(30.0, 80.0)    # Aadhaar
                elif order == 4: duration = random.uniform(15.0, 45.0)    # OTP
                elif order == 5: duration = random.uniform(40.0, 110.0)   # Bank
                elif order == 6: duration = random.uniform(60.0, 180.0)   # Document
                elif order == 7: duration = random.uniform(90.0, 240.0)   # KYC
                else: duration = random.uniform(10.0, 30.0)               # Submit
                
                # Check for step failure in failure paths
                is_last_step = (idx == len(active_steps) - 1)
                if is_last_step and outcome in ["FAILED_OTP", "FAILED_KYC"]:
                    status = "FAILED"
                else:
                    status = "COMPLETED"
                    
            step_time = last_step_time + timedelta(seconds=int(duration) if order > 1 else 0)
            
            reason = None
            if status == "FAILED":
                reason = "Invalid OTP digits entered multiple times" if outcome == "FAILED_OTP" else "Liveness check: face match mismatch with Aadhaar photo"
                
            event = JourneyEvent(
                application_id=app.id,
                customer_id=customer.id,
                session_id=session.id,
                step_name=step_name,
                step_order=order,
                status=status,
                timestamp=step_time,
                time_spent_seconds=duration if order > 1 else 0.0,
                device_type=session.device_type,
                browser=session.browser,
                operating_system=session.operating_system,
                ip_address=session.ip_address,
                city=session.city,
                state=session.state,
                country=session.country,
                latitude=session.latitude,
                longitude=session.longitude,
                failure_reason=reason,
                metadata_json=json.dumps({"attempt": 1})
            )
            db.add(event)
            db.commit()
            
            # Increment time
            last_step_time = step_time + timedelta(seconds=random.randint(10, 30))
            
        # Wrap up the application status
        session.is_active = False
        session.ended_at = last_step_time
        
        # End application status
        if outcome == "COMPLETED":
            app.status = "COMPLETED"
            app.current_step = "Approved"
            
            # Write final Approved log
            db.add(JourneyEvent(
                application_id=app.id,
                customer_id=customer.id,
                session_id=session.id,
                step_name="Approved",
                step_order=9,
                status="COMPLETED",
                timestamp=last_step_time,
                time_spent_seconds=random.uniform(5.0, 15.0),
                device_type=session.device_type,
                browser=session.browser,
                operating_system=session.operating_system,
                ip_address=session.ip_address,
                city=session.city,
                state=session.state,
                country=session.country,
                latitude=session.latitude,
                longitude=session.longitude
            ))
        elif outcome == "FAILED_OTP":
            app.status = "ABANDONED"
            app.current_step = "Abandoned"
            app.abandoned_reason = "Failed OTP Verification"
            
            db.add(JourneyEvent(
                application_id=app.id,
                customer_id=customer.id,
                session_id=session.id,
                step_name="Abandoned",
                step_order=9,
                status="COMPLETED",
                timestamp=last_step_time,
                time_spent_seconds=0.0,
                device_type=session.device_type,
                browser=session.browser,
                operating_system=session.operating_system,
                ip_address=session.ip_address,
                city=session.city,
                state=session.state,
                country=session.country,
                latitude=session.latitude,
                longitude=session.longitude,
                failure_reason="OTP token entry failed"
            ))
        elif outcome == "FAILED_KYC":
            app.status = "REJECTED"
            app.current_step = "Rejected"
            app.abandoned_reason = "Identity match validation failure during Video KYC"
            
            db.add(JourneyEvent(
                application_id=app.id,
                customer_id=customer.id,
                session_id=session.id,
                step_name="Rejected",
                step_order=9,
                status="COMPLETED",
                timestamp=last_step_time,
                time_spent_seconds=0.0,
                device_type=session.device_type,
                browser=session.browser,
                operating_system=session.operating_system,
                ip_address=session.ip_address,
                city=session.city,
                state=session.state,
                country=session.country,
                latitude=session.latitude,
                longitude=session.longitude,
                failure_reason="Identity mismatch"
            ))
        else: # ABANDONED_MIDWAY
            app.status = "ABANDONED"
            app.current_step = "Abandoned"
            app.abandoned_reason = "User session inactive limit reached"
            
            db.add(JourneyEvent(
                application_id=app.id,
                customer_id=customer.id,
                session_id=session.id,
                step_name="Abandoned",
                step_order=9,
                status="COMPLETED",
                timestamp=last_step_time,
                time_spent_seconds=0.0,
                device_type=session.device_type,
                browser=session.browser,
                operating_system=session.operating_system,
                ip_address=session.ip_address,
                city=session.city,
                state=session.state,
                country=session.country,
                latitude=session.latitude,
                longitude=session.longitude,
                failure_reason="Inactive timeout"
            ))
            
        db.commit()

    db.close()
    
    print("\n--- Seeding Completed ---")
    print(f"  Total Journeys Generated: 100")
    print(f"  Completed journeys: {summary['COMPLETED']}")
    print(f"  Failed OTP journeys: {summary['FAILED_OTP']}")
    print(f"  Failed KYC journeys: {summary['FAILED_KYC']}")
    print(f"  Abandoned Midway journeys: {summary['ABANDONED_MIDWAY']}")
    print("Database journey seeds initialized successfully.")

if __name__ == "__main__":
    seed_journey_db()
