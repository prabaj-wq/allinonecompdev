#!/usr/bin/env python3
"""
Database setup script to ensure the main database is properly initialized
"""

import os
import sys
import logging
import time
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db_connection_params():
    """Get database connection parameters based on environment"""
    return {
        'host': 'postgres' if os.getenv('DOCKER_ENV') == 'true' else 'localhost',
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres123')
    }

def wait_for_database(max_retries=30, delay=2):
    """Wait for database to be available"""
    db_params = get_db_connection_params()
    encoded_password = quote_plus(db_params['password'])
    postgres_url = f"postgresql://{db_params['user']}:{encoded_password}@{db_params['host']}:{db_params['port']}/postgres"
    
    for attempt in range(max_retries):
        try:
            logger.info(f"🔍 Attempting to connect to database (attempt {attempt + 1}/{max_retries})")
            engine = create_engine(postgres_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Database is available!")
            return True
        except Exception as e:
            logger.warning(f"⏳ Database not ready yet: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                logger.error("❌ Database connection failed after all retries")
                return False
    return False

def setup_main_database():
    """Set up the main database and tables"""
    try:
        logger.info("🚀 Setting up main database...")
        
        # Wait for database to be available
        if not wait_for_database():
            logger.error("❌ Cannot connect to database")
            return False
        
        # Import after database is available
        from database import init_db
        
        # Initialize the database
        logger.info("📊 Initializing database tables...")
        success = init_db()
        
        if success:
            logger.info("✅ Database setup completed successfully!")
            return True
        else:
            logger.error("❌ Database setup failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error setting up database: {e}")
        return False

def verify_database_setup():
    """Verify that the database is properly set up"""
    try:
        logger.info("🔍 Verifying database setup...")
        
        from database import SessionLocal, Company
        
        db = SessionLocal()
        try:
            # Try to query companies table
            companies = db.query(Company).all()
            logger.info(f"✅ Database verification successful. Found {len(companies)} companies.")
            return True
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Database verification failed: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("🎯 Starting database setup process...")
    
    # Setup main database
    if not setup_main_database():
        logger.error("❌ Failed to setup main database")
        sys.exit(1)
    
    # Verify setup
    if not verify_database_setup():
        logger.error("❌ Failed to verify database setup")
        sys.exit(1)
    
    logger.info("🎉 Database setup completed successfully!")

if __name__ == "__main__":
    main()
