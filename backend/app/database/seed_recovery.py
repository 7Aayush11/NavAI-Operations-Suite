import sys
import os
import csv
import random

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models.recovery import RecoveryRecord
# Force import of all models to populate SQLAlchemy registries
import app.models.user
import app.journey.models

def seed_recovery_db():
    print("=== SEEDING LOAN RECOVERY RECORDS ===")
    
    # We should make sure recovery_records table is created
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    # Clear existing recovery records to prevent double seed
    db.query(RecoveryRecord).delete()
    db.commit()
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    CSV_PATH = os.path.join(BASE_DIR, "data", "final_processed_dataset.csv")
    
    print(f"Reading CSV from: {CSV_PATH}")
    
    # Let's generate some mock names
    first_names = ["Aarav", "Kabir", "Vihaan", "Aditya", "Ishaan", "Sai", "Ananya", "Diya", "Riya", "Kiara", "Kavya", "Rahul", "Siddharth", "Yash", "Dev", "Alia", "Priya", "Nisha"]
    last_names = ["Sharma", "Patel", "Verma", "Mehta", "Bose", "Gupta", "Joshi", "Deshmukh", "Nair", "Bhalerao", "Rao", "Chawla", "Bhat", "Shenoy"]
    
    random.seed(42)  # Deterministic names
    
    records_to_add = []
    i = 0
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Map features
            outstanding_amount = float(row.get('OutstandingAmount', 0.0))
            days_overdue = int(row.get('DaysOverdue', 0))
            previous_defaults = int(row.get('PreviousLoanDefaults', 0))
            bankruptcy_history = int(row.get('BankruptcyHistory', 0))
            credit_score = int(row.get('CreditScore', 0))
            distance_from_branch = float(row.get('DistanceFromBranch', 0.0))
            call_response = int(row.get('CallResponse', 0))
            priority_score = float(row.get('PriorityScore', 0.0))
            recovery_strategy = row.get('RecoveryStrategy', 'SMS Reminder')
            app_date = row.get('ApplicationDate', '')
            
            record = RecoveryRecord(
                customer_name=name,
                application_date=app_date,
                credit_score=credit_score,
                outstanding_amount=outstanding_amount,
                days_overdue=days_overdue,
                previous_loan_defaults=previous_defaults,
                bankruptcy_history=bankruptcy_history,
                distance_from_branch=distance_from_branch,
                call_response=call_response,
                priority_score=priority_score,
                recovery_strategy=recovery_strategy,
                original_strategy=recovery_strategy,
                payment_status="UNPAID",
                notes=""
            )
            records_to_add.append(record)
            
            # Commit in batches of 500
            if len(records_to_add) >= 500:
                db.bulk_save_objects(records_to_add)
                db.commit()
                records_to_add = []
                print(f"  Seeded {i} records...")
                
    if records_to_add:
        db.bulk_save_objects(records_to_add)
        db.commit()
        print(f"  Seeded final batch. Total: {i} records.")
        
    db.close()
    print("=== SEEDING COMPLETED ===")

if __name__ == "__main__":
    seed_recovery_db()
