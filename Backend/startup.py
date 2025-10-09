#!/usr/bin/env python3
"""
Startup script to ensure the application is properly initialized
"""

import os
import sys
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def wait_for_database(max_retries=30, delay=2):
    """Wait for database to be available"""
    from urllib.parse import quote_plus
    from sqlalchemy import create_engine, text
    
    # Get database configuration
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres123')
    
    encoded_password = quote_plus(POSTGRES_PASSWORD)
    postgres_url = f"postgresql://{POSTGRES_USER}:{encoded_password}@{POSTGRES_HOST}:{POSTGRES_PORT}/postgres"
    
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

def setup_database():
    """Set up the main database and tables"""
    try:
        logger.info("📊 Setting up database tables...")
        
        # Import database module
        from database import init_db
        
        # Initialize the database
        success = init_db()
        
        if success:
            logger.info("✅ Database setup completed successfully!")
            return True
        else:
            logger.error("❌ Database setup failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error setting up database: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def start_application():
    """Start the FastAPI application"""
    try:
        logger.info("🚀 Starting FastAPI application...")
        
        # Import and start the app
        import uvicorn
        from main import app
        
        # Get configuration
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", "8000"))
        reload = os.getenv("ENVIRONMENT", "development") == "development"
        
        logger.info(f"🌐 Starting server on {host}:{port}")
        uvicorn.run(app, host=host, port=port, reload=reload)
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)

def main():
    """Main startup function"""
    logger.info("🎯 Starting application initialization...")
    
    # Wait for database to be available
    if not wait_for_database():
        logger.error("❌ Database not available, exiting...")
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        logger.error("❌ Failed to setup database, exiting...")
        sys.exit(1)
    
    # Start the application
    start_application()

if __name__ == "__main__":
    main()
