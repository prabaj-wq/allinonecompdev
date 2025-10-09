from fastapi import APIRouter

router = APIRouter(prefix="/database", tags=["Database Management"])

# This router is kept for potential future use, but currently empty
# Database management is handled automatically during onboarding
