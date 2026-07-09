from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.journey import router as journey_router
from app.journey.router import router as journey_tracking_router
from app.simulator.router import router as simulator_router
from app.database.session import engine, Base, SessionLocal
from app.models.user import User, Role, Application, JourneyStepLog, CustomerFeedback
from app.journey.models import Customer, ApplicationSession, JourneyEvent
import logging

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NavAI Operations Suite API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(journey_router)
app.include_router(journey_tracking_router)
app.include_router(simulator_router)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        if db.query(Role).count() == 0:
            logger.info("Database is empty. Running auto-seeding...")
            from app.database.seed_journey import seed_journey_db
            seed_journey_db(drop_tables=False)
    except Exception as e:
        logger.error(f"Error checking/seeding database on startup: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the NavAI Operations Suite API!"}