from sqlalchemy import create_engine, Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, event, Table, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session, Session, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
from datetime import datetime
from typing import Optional, Generator
from config import settings
import os
import time
import logging
from contextlib import contextmanager
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_url() -> str:
    """Get the database URL from environment variables or construct it from individual components."""
    # Check if DATABASE_URL is explicitly set (from Docker Compose or elsewhere)
    if os.getenv('DATABASE_URL'):
        return os.getenv('DATABASE_URL')
    
    # Build DATABASE_URL from individual components
    if os.getenv('DOCKER_ENV', '').lower() in ('true', '1', 't'):
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')  # For docker-compose
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')  # For local development

    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    # Use postgres user for consistency with docker-compose and auth.py
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'epm_tool')

    # Create database URL with proper encoding
    encoded_password = quote_plus(POSTGRES_PASSWORD)
    return f"postgresql://{POSTGRES_USER}:{encoded_password}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}?sslmode=disable"

def create_db_engine():
    """Create a database engine with retry logic."""
    max_retries = 5
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            db_url = get_database_url()
            logger.info(f"Attempting to connect to database (Attempt {attempt + 1}/{max_retries})")
            
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=300,  # Recycle connections every 5 minutes
                pool_size=10,      # Increased pool size
                max_overflow=20,   # Allow more connections than pool_size when needed
                echo=settings.DEBUG,  # Only echo in debug mode
                connect_args={
                    "connect_timeout": 10,
                    "keepalives": 1,
                    "keepalives_idle": 30,
                    "keepalives_interval": 10,
                    "keepalives_count": 5
                }
            )
            
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                
            logger.info("Successfully connected to the database")
            return engine
            
        except Exception as e:
            logger.error(f"Error connecting to database (Attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt == max_retries - 1:  # Last attempt
                logger.error("Max retries reached. Could not connect to database.")
                raise
                
            logger.info(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            
    # This should never be reached due to the raise in the loop
    raise Exception("Failed to create database engine after multiple attempts")

# Create the database engine
engine = create_db_engine()

# Create a scoped session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Association table for many-to-many relationship between roles and permissions
role_permission = Table(
    'role_permission',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True),
    # Add a unique constraint on the combination of role_id and permission_id
    UniqueConstraint('role_id', 'permission_id', name='uq_role_permission')
)

# Role and permission models removed - not needed in main database

# ===== MODELS =====

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False)
    environment_type = Column(String(50), nullable=False)  # production, development
    industry = Column(String(100), nullable=False)  # Technology, Manufacturing, etc.
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    
    # Add a unique constraint for role_code within a company
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    username = Column(String(100), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Table arguments for constraints
    __table_args__ = (
        # Ensure email is unique within a company
        UniqueConstraint('company_id', 'email', name='uq_company_user_email'),
        # Ensure username is unique within a company
        UniqueConstraint('company_id', 'username', name='uq_company_username'),
    )
    
    # Relationships
    company = relationship("Company", back_populates="users")

# Account, Entity, and Hierarchy models removed - these belong in company-specific databases

def get_db() -> Generator[Session, None, None]:
    """Provide a database session that's properly closed after use."""
    db = SessionLocal()
    try:
        yield db
        db.commit()  # Commit the transaction
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()

# Add event listeners for connection handling (disabled to fix transaction issues)
# @event.listens_for(engine, 'engine_connect')
# def receive_engine_connect(conn, branch):
#     """Handle connection events."""
#     if branch:
#         # 'branch' refers to a sub-transaction
#         return
#     
#     # Set statement timeout to 30 seconds
#     conn.execute(text('SET statement_timeout = 30000'))
#     
#     # Set search path if needed
#     conn.execute(text('SET search_path TO public'))
#     logger.debug("Database connection established with custom settings")

def init_db():
    """Initialize the database by creating all tables."""
    logger.info("Initializing database...")
    try:
        # Create all tables using the engine directly (no explicit transaction)
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialization completed successfully")
        print("Database initialized successfully with all necessary tables")
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    # Initialize the database when run directly
    init_db()
