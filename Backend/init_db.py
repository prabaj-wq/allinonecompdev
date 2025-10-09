import logging
from sqlalchemy import inspect, text
from database import Base, engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_all_tables():
    """Drop all tables in the database"""
    logger.info("Dropping all tables...")
    with engine.begin() as conn:
        # Disable foreign key checks temporarily
        conn.execute(text('SET session_replication_role = \'replica\''))
        
        # Drop all tables
        inspector = inspect(engine)
        for table_name in inspector.get_table_names():
            conn.execute(text(f'DROP TABLE IF EXISTS \"{table_name}\" CASCADE'))
        
        # Re-enable foreign key checks
        conn.execute(text('SET session_replication_role = \'origin\''))
        
    logger.info("All tables dropped successfully")

def create_all_tables():
    """Create all tables defined in the models"""
    logger.info("Creating all tables...")
    with engine.begin() as conn:
        Base.metadata.create_all(conn)
    logger.info("All tables created successfully")

def reset_database():
    """Reset the database by dropping and recreating all tables"""
    logger.info("Starting database reset...")
    
    # Drop all tables
    drop_all_tables()
    
    # Create all tables
    create_all_tables()
    
    logger.info("Database reset completed successfully")

if __name__ == "__main__":
    print("This will reset the database by dropping and recreating all tables.")
    confirm = input("Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() == 'yes':
        reset_database()
    else:
        print("Database reset cancelled.")
