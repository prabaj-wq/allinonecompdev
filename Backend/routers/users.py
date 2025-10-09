from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError
from typing import List
import os
import json

from database import get_db, User
from auth.dependencies import get_current_admin_user, is_first_install
from pydantic import BaseModel

# Define UserRole enum locally since it's not in the database.py file
from enum import Enum as PyEnum

class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"

router = APIRouter(prefix="/users", tags=["Users"])

class UserUpdate(BaseModel):
    username: str = None
    email: str = None
    role: UserRole = None
    is_active: bool = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # If this is a first install, return empty list
    if is_first_install():
        return []
    
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        return users
    except ProgrammingError:
        # Database tables don't exist yet
        return []

@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(status_code=404, detail="User not found")

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(status_code=404, detail="User not found")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(db_user)
        db.commit()
        return
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(status_code=404, detail="User not found")