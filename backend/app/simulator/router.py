from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database.session import get_db
from app.simulator.service import SimulatorService

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class SeedRequest(BaseModel):
    count: int = Field(..., ge=1, le=1000, description="Number of customer onboarding journeys to simulate.")

@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_simulations(payload: SeedRequest, db: Session = Depends(get_db)):
    try:
        service = SimulatorService(db)
        summary = service.seed_simulated_journeys(payload.count)
        return {
            "message": f"Successfully simulated and seeded {payload.count} customer applications.",
            "summary": summary
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
