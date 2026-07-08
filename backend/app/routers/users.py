from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.user import User, Role
from app.schemas.user import UserResponse, RoleResponse
from app.auth.dependencies import RoleChecker

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Super Admin"]))
):
    users = db.query(User).all()
    return users

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Super Admin"]))
):
    roles = db.query(Role).all()
    return roles
