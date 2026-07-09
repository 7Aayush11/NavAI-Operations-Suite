from datetime import datetime, timedelta
import random
import json
from sqlalchemy.orm import Session
from app.journey.repository import JourneyRepository
from app.journey.models import Customer, ApplicationSession, JourneyEvent
from app.models.user import User, Role, Application

class SimulatorService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = JourneyRepository(db)

    def seed_simulated_journeys(self, count: int) -> dict:
        # Predefined data lists
        branches = ["Mumbai West", "Bandra Branch", "Worli Hub", "Thane Regional"]
        
        # Get default Operations Officer for assignment
        officer = self.db.query(User).join(Role).filter(Role.name == "Operations Officer").first()
        officer_id = officer.id if officer else None

        first_names = ["Aarav", "Kabir", "Vihaan", "Aditya", "Ishaan", "Sai", "Ananya", "Diya", "Riya", "Kiara", "Kavya", "Rahul", "Siddharth", "Yash", "Dev", "Alia", "Priya", "Nisha"]
        last_names = ["Sharma", "Patel", "Verma", "Mehta", "Bose", "Gupta", "Joshi", "Deshmukh", "Nair", "Bhalerao", "Rao", "Chawla", "Bhat", "Shenoy"]
        
        cities = [
            {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lng": 72.8777},
            {"city": "Pune", "state": "Maharashtra", "country": "India", "lat": 18.5204, "lng": 73.8567},
            {"city": "Thane", "state": "Maharashtra", "country": "India", "lat": 19.2183, "lng": 72.9781}
        ]

        browsers = ["Chrome Mobile", "Safari", "Firefox Mobile", "Edge Mobile"]
        operating_systems = ["Android", "iOS", "Windows Mobile"]
        devices = ["MOBILE", "TABLET"]

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

        summary = {
            "COMPLETED": 0,
            "FAILED_OTP": 0,
            "FAILED_KYC": 0,
            "ABANDONED_MIDWAY": 0
        }

        # Cap seed size for performance limits
        seed_count = min(count, 1000)

        for i in range(seed_count):
            name = f"Sim_{random.choice(first_names)} {random.choice(last_names)}"
            email = f"{name.lower().replace(' ', '_')}_{random.randint(1000,9999)}@sim-navadhan.com"
            phone = f"+91 {random.randint(7000000000, 9999999999)}"

            # Create Customer
            customer = self.repo.create_customer(name, email, phone)

            # Choose Outcome
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
            created_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))

            app = Application(
                customer_id=customer.id,
                customer_name=name,
                phone_number=phone,
                email=email,
                branch_name=branch,
                assigned_officer_id=officer_id,
                status="IN_PROGRESS",
                created_at=created_time,
                updated_at=created_time
            )
            self.db.add(app)
            self.db.commit()
            self.db.refresh(app)

            # Create Session
            loc = random.choice(cities)
            device = random.choice(devices)
            browser = random.choice(browsers)
            os_name = random.choice(operating_systems)
            ip = f"10.0.{random.randint(1,254)}.{random.randint(1,254)}"

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
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)

            last_step_time = created_time

            # Determine steps progression
            if outcome == "COMPLETED":
                active_steps = steps
            elif outcome == "FAILED_OTP":
                active_steps = steps[:4] # Up to OTP
            elif outcome == "FAILED_KYC":
                active_steps = steps[:7] # Up to Video KYC
            else:
                active_steps = steps[:random.randint(2, 5)]

            for idx, (step_name, order) in enumerate(active_steps):
                if order == 1:
                    duration = 0.0
                    status = "COMPLETED"
                else:
                    if order == 2: duration = random.uniform(15.0, 45.0)
                    elif order == 3: duration = random.uniform(30.0, 75.0)
                    elif order == 4: duration = random.uniform(10.0, 30.0)
                    elif order == 5: duration = random.uniform(40.0, 90.0)
                    elif order == 6: duration = random.uniform(50.0, 120.0)
                    elif order == 7: duration = random.uniform(90.0, 200.0)
                    else: duration = random.uniform(10.0, 25.0)

                    is_last = (idx == len(active_steps) - 1)
                    if is_last and outcome in ["FAILED_OTP", "FAILED_KYC"]:
                        status = "FAILED"
                    else:
                        status = "COMPLETED"

                step_time = last_step_time + timedelta(seconds=int(duration))
                reason = None
                if status == "FAILED":
                    reason = "OTP verification retry count exceeded" if outcome == "FAILED_OTP" else "Face detection match score below threshold"

                self.repo.create_event(
                    application_id=app.id,
                    customer_id=customer.id,
                    session_id=session.id,
                    step_name=step_name,
                    step_order=order,
                    status=status,
                    timestamp=step_time,
                    time_spent_seconds=duration,
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
                    metadata_str=json.dumps({"mode": "auto_seed"})
                )

                last_step_time = step_time + timedelta(seconds=random.randint(5, 15))

            # Conclude session
            session.is_active = False
            session.ended_at = last_step_time
            self.db.commit()

            if outcome == "COMPLETED":
                app.status = "COMPLETED"
                app.current_step = "Approved"
                self.repo.create_event(
                    application_id=app.id, customer_id=customer.id, session_id=session.id,
                    step_name="Approved", step_order=9, status="COMPLETED",
                    timestamp=last_step_time, time_spent_seconds=5.0,
                    device_type=session.device_type, browser=session.browser,
                    operating_system=session.operating_system, ip_address=session.ip_address
                )
            elif outcome == "FAILED_OTP":
                app.status = "ABANDONED"
                app.current_step = "Abandoned"
                app.abandoned_reason = "OTP validation failed"
                self.repo.create_event(
                    application_id=app.id, customer_id=customer.id, session_id=session.id,
                    step_name="Abandoned", step_order=9, status="COMPLETED",
                    timestamp=last_step_time, time_spent_seconds=0.0,
                    device_type=session.device_type, browser=session.browser,
                    operating_system=session.operating_system, ip_address=session.ip_address,
                    failure_reason="OTP Verification Failure"
                )
            elif outcome == "FAILED_KYC":
                app.status = "REJECTED"
                app.current_step = "Rejected"
                app.abandoned_reason = "KYC photo mismatch"
                self.repo.create_event(
                    application_id=app.id, customer_id=customer.id, session_id=session.id,
                    step_name="Rejected", step_order=9, status="COMPLETED",
                    timestamp=last_step_time, time_spent_seconds=0.0,
                    device_type=session.device_type, browser=session.browser,
                    operating_system=session.operating_system, ip_address=session.ip_address,
                    failure_reason="Video KYC Failure"
                )
            else:
                app.status = "ABANDONED"
                app.current_step = "Abandoned"
                app.abandoned_reason = "Customer dropped midway"
                self.repo.create_event(
                    application_id=app.id, customer_id=customer.id, session_id=session.id,
                    step_name="Abandoned", step_order=9, status="COMPLETED",
                    timestamp=last_step_time, time_spent_seconds=0.0,
                    device_type=session.device_type, browser=session.browser,
                    operating_system=session.operating_system, ip_address=session.ip_address,
                    failure_reason="Session Inactive Timeout"
                )

            self.repo.update_application(app)

        return summary
