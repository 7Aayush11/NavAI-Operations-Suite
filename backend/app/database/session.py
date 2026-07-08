from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Get absolute path for local SQLite db to avoid Cwd mismatch errors between uvicorn & seed scripts
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "navai_operations.db")

try:
    # Attempt connection to the primary database
    engine = create_engine(db_url, connect_args=connect_args)
    with engine.connect() as conn:
        pass
    print(f"Successfully connected to database at: {db_url}")
except Exception as e:
    print(f"\n[DATABASE WARNING]: Failed to connect to primary database configuration: {db_url}")
    print(f"Error: {e}")
    print(f"Falling back to local SQLite database at: {SQLITE_DB_PATH}\n")
    db_url = f"sqlite:///{SQLITE_DB_PATH}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
