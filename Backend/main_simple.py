import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from database import init_db
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="All in One Company Management System",
    version="1.0.0",
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url="/api/openapi.json" if not settings.is_production else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=600,
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

# Root endpoint
@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "version": "1.0.0"}

# Import and include essential routers
try:
    from routers.auth import router as auth_router
    app.include_router(auth_router, prefix="/api")
    logger.info("✅ Auth router loaded")
except ImportError as e:
    logger.error(f"❌ Failed to load auth router: {e}")

try:
    from routers.onboarding import router as onboarding_router
    app.include_router(onboarding_router, prefix="/api")
    logger.info("✅ Onboarding router loaded")
except ImportError as e:
    logger.error(f"❌ Failed to load onboarding router: {e}")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting {settings.APP_NAME} in {settings.ENVIRONMENT.upper()} mode")
    logger.info(f"🌐 Frontend URL: {settings.FRONTEND_URL}")
    logger.info(f"🔗 Allowed origins: {settings.allowed_origins}")
    
    # Initialize database
    try:
        logger.info("📊 Initializing database...")
        success = init_db()
        if success:
            logger.info("✅ Database initialized successfully")
        else:
            logger.error("❌ Database initialization failed")
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        # Don't fail startup if database initialization fails
        logger.info("⚠️ Continuing startup despite database initialization error")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Shutting down application...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
