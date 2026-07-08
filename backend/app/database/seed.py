import sys
import os

# Adjust path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models.user import User, Role
from app.auth.security import get_password_hash

def seed_db():
    print("Creating tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    # 1. Seed Roles
    roles_data = [
        {"name": "Super Admin", "description": "Manage users, roles, system config, view everything, analytics, AI recommendations"},
        {"name": "Branch Manager", "description": "View applications, journey analytics, customer analytics, AI recommendations, reports"},
        {"name": "Operations Officer", "description": "View assigned applications, update application status, record events"},
        {"name": "Analyst", "description": "View dashboards, funnel analytics, AI insights, export reports (read-only)"}
    ]
    
    db_roles = {}
    for r in roles_data:
        role = db.query(Role).filter(Role.name == r["name"]).first()
        if not role:
            role = Role(name=r["name"], description=r["description"])
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"Created role: {role.name}")
        else:
            print(f"Role already exists: {role.name}")
        db_roles[role.name] = role
        
    # 2. Seed Users
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
    
    for u in users_data:
        user = db.query(User).filter(User.email == u["email"]).first()
        if not user:
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
            print(f"Created user: {user.email} with role {u['role_name']}")
        else:
            print(f"User already exists: {user.email}")
            
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
