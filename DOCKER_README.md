# Docker Deployment Guide

This guide explains how to run the application using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

3. **Complete the onboarding process:**
   - Visit http://localhost:3000 to start the onboarding wizard
   - Fill in the company and admin user details
   - The system will automatically create a database for your company

## Services Overview

- **frontend**: React/TypeScript application (port 3000)
- **backend**: FastAPI Python application (port 8000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

## Environment Variables

The docker-compose.yml file sets the following environment variables:

- `DOCKER_ENV=true` - Indicates the application is running in Docker
- `DATABASE_URL` - Connection string for the main database
- `REDIS_URL` - Connection string for Redis
- `SECRET_KEY` - Secret key for JWT tokens
- `POSTGRES_FALLBACK_PASSWORD` - Password for the postgres user (used for database creation)

## Database Setup

The PostgreSQL container is configured with:
- Main user: `epm_user` with password `epm_password`
- Database: `epm_tool`
- Superuser: `postgres` with password `root@123` (used for database creation)

The `root@123` password is used for the postgres superuser which has the necessary privileges to create databases. This is different from the `epm_user` which has limited privileges and cannot create databases.

During initialization, a SQL script grants the necessary privileges to the `epm_user`.

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   If you get "port already in use" errors, make sure no other services are running on ports 3000, 5432, 6379, or 8000.

2. **Database connection errors:**
   Ensure the PostgreSQL service is healthy before the backend starts. The `depends_on` configuration with health checks ensures this.

3. **Permission errors:**
   The PostgreSQL initialization script ensures the `postgres` user has the correct password and privileges.

### Resetting the Application

To start fresh:

1. Stop all services:
   ```bash
   docker-compose down
   ```

2. Remove volumes (this will delete all data):
   ```bash
   docker-compose down -v
   ```

3. Rebuild and start:
   ```bash
   docker-compose up --build
   ```

## Testing the Docker Setup

Run the test script to verify the Docker configuration:

```bash
docker-compose exec backend python test-docker-setup.py
```

This script tests:
- Connection to PostgreSQL as both `epm_user` and `postgres`
- Database creation and privilege granting
- Data manipulation as `epm_user`

## Development Notes

- The backend and frontend services mount the source code directories for live reloading
- Changes to the code will be reflected immediately without rebuilding
- Logs from all services can be viewed in the terminal where docker-compose is running