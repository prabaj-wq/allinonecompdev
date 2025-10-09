# Database Setup Instructions

## Prerequisites

Make sure PostgreSQL is installed and running on your system.

## Setting Up the Database and User

### Option 1: Using PostgreSQL Command Line

1. Open PostgreSQL command line (psql) as a superuser:
   ```bash
   psql -U postgres
   ```

2. Run these commands to create the database and user:
   ```sql
   CREATE DATABASE epm_tool;
   CREATE USER epm_user WITH PASSWORD 'epm_password';
   GRANT ALL PRIVILEGES ON DATABASE epm_tool TO epm_user;
   \q
   ```

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases" and select "Create" > "Database"
3. Name: `epm_tool`
4. Go to "Login/Group Roles" in the left sidebar
5. Right-click and select "Create" > "Login/Group Role"
6. Name: `epm_user`
7. Go to the "Definition" tab and set password to `epm_password`
8. Go to the "Privileges" tab and toggle "Can login?" to yes
9. Right-click on the `epm_tool` database and select "Properties"
10. Go to the "Security" tab and add `epm_user` with "All" privileges

### Option 3: Using the Setup Script

If you know your PostgreSQL superuser credentials:

1. Edit `Backend/setup_db.py` and update the credentials:
   ```python
   connection = psycopg2.connect(
       user="your_postgres_user",
       password="your_postgres_password",
       host="localhost",
       port="5432"
   )
   ```

2. Run the setup script:
   ```bash
   cd Backend
   python setup_db.py
   ```

## Verifying the Setup

After setting up the database, you can verify the connection by running:
```bash
cd Backend
python test_db.py
```

You should see output similar to:
```
Connected to PostgreSQL database
You are connected to - ('PostgreSQL ...',) 

PostgreSQL connection is closed
```

## Environment Variables

The application uses the following environment variables for database connection:

- `DATABASE_URL`: PostgreSQL connection string
  - Default: `postgresql://epm_user:epm_password@localhost:5432/epm_tool`

When running with Docker, the host will be `postgres` instead of `localhost`:
- Docker: `postgresql://epm_user:epm_password@postgres:5432/epm_tool`

## Troubleshooting

### Authentication Failed

If you get authentication errors:
1. Make sure the database and user were created correctly
2. Verify the password is `epm_password`
3. Check PostgreSQL is running on port 5432

### Connection Refused

If you get connection refused errors:
1. Make sure PostgreSQL is running
2. Check if PostgreSQL is listening on port 5432:
   ```bash
   netstat -an | grep 5432
   ```
3. Verify the PostgreSQL service is started

### Database Already Exists

If the database or user already exists, the setup script will handle this gracefully by updating the password if needed.