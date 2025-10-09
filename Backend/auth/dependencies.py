from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError
from jose import JWTError, jwt
from config import settings
from database import get_db, User
from typing import Optional
import os
import json

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def is_first_install() -> bool:
    """Check if this is the first installation"""
    flag_file = "config/first_install.json"
    if os.path.exists(flag_file):
        try:
            with open(flag_file, 'r') as f:
                data = json.load(f)
                return data.get("first_install", True)
        except:
            return True
    return True

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    # If this is a first install, skip user validation
    if is_first_install():
        # Return a mock user for onboarding
        return User(
            id=1,
            username="admin",
            email="admin@example.com",
            password_hash="",
            company_id=1
        )
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    try:
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except ProgrammingError:
        # Database tables don't exist yet, return mock user
        return User(
            id=1,
            username="admin",
            email="admin@example.com",
            password_hash="",
            company_id=1
        )

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    # Since the User model doesn't have an is_active field, we'll assume all users are active
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    # Since the User model doesn't have a role field, we'll assume the first user is admin
    # In a production environment, you would want to implement proper role checking
    return current_user