# Quick Start Guide - All in One Company

## 🚀 Getting Started

### Prerequisites
- Docker Desktop installed and running
- Ports 3000, 5432, 6379, and 8000 available

### Start the Application

```powershell
# Navigate to project directory
cd "c:\Users\praba\OneDrive\Desktop\Desktop apps\Personal\All in one company - production"

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Access the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/docs

---

## 📝 Complete Onboarding

### Step 1: Open Frontend
Navigate to http://localhost:3000 in your browser

### Step 2: Fill Onboarding Form
- **Company Name**: Your company name (e.g., "Acme Corp")
- **Environment Type**: Production or Development
- **Industry**: Your industry (e.g., "Technology", "Finance")
- **Admin Username**: Your username (e.g., "admin")
- **Admin Email**: Your email (e.g., "admin@acme.com")
- **Admin Password**: Strong password (min 8 characters)

### Step 3: Click "Complete Onboarding"
The system will:
1. Create a new database for your company
2. Create all necessary tables
3. Create your admin user account
4. Log you in automatically

---

## 🔧 Useful Commands

### View Logs
```powershell
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs postgres
docker compose logs frontend
docker compose logs redis

# Follow logs in real-time
docker compose logs -f backend
```

### Restart Services
```powershell
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Stop Services
```powershell
# Stop all services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker compose down -v
```

### Database Access
```powershell
# Connect to PostgreSQL
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -d epm_tool

# List all databases
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -c "\l"

# List tables in a database
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -d <database_name> -c "\dt"
```

---

## 🐛 Troubleshooting

### Services Not Starting
```powershell
# Check Docker is running
docker version

# Check logs for errors
docker compose logs

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Kill the process using the port (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Issues
```powershell
# Check postgres is healthy
docker compose ps

# Restart postgres
docker compose restart postgres

# Check postgres logs
docker compose logs postgres
```

### Frontend Can't Connect to Backend
1. Check backend is running: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Verify CORS settings in backend
4. Clear browser cache and reload

---

## 📊 Verify Onboarding Success

### Check Database Created
```powershell
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -c "\l"
```
You should see your company database (e.g., `acme_corp`)

### Check Tables Created
```powershell
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -d <your_company_db> -c "\dt"
```
You should see tables like: companies, users, roles, permissions, etc.

### Check Company Record
```powershell
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -d epm_tool -c "SELECT * FROM companies;"
```

### Check User Record
```powershell
docker exec -it allinonecompany-production-postgres-1 psql -U postgres -d epm_tool -c "SELECT id, username, email, is_superuser FROM users;"
```

---

## 🔐 Default Credentials

### Database
- **Host**: localhost (or `postgres` inside Docker)
- **Port**: 5432
- **Database**: epm_tool
- **Username**: postgres
- **Password**: epm_password

### Application User (epm_user)
- **Username**: epm_user
- **Password**: epm_password
- **Purpose**: Application database connections

---

## 📁 Important Files

### Configuration
- `docker-compose.yml` - Docker services configuration
- `Backend/config.py` - Application settings
- `Backend/.env` - Environment variables (create if needed)

### Database
- `Backend/database.py` - SQLAlchemy models
- `Backend/postgres-init.sql` - Database initialization script

### API Routes
- `Backend/main.py` - Main application entry point
- `Backend/routers/onboarding.py` - Onboarding endpoints
- `Backend/routers/auth.py` - Authentication endpoints

---

## 🌐 Production Deployment

### Environment Variables to Set
```env
ENVIRONMENT=production
SECRET_KEY=<generate-secure-random-key>
POSTGRES_PASSWORD=<strong-password>
FRONTEND_URL=https://your-frontend-domain.com
SECURE_COOKIES=true
```

### Security Checklist
- [ ] Change SECRET_KEY to a secure random value
- [ ] Change POSTGRES_PASSWORD to a strong password
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up SSL for database connections
- [ ] Enable secure cookies
- [ ] Set up proper logging and monitoring

---

## 📞 Support

### Check System Status
```powershell
docker compose ps
docker compose logs --tail=50
```

### Common Issues
1. **502 Bad Gateway**: Backend not running - check `docker compose logs backend`
2. **Database Connection Failed**: Check postgres is healthy - `docker compose ps`
3. **Onboarding Fails**: Check backend logs for detailed error messages

### Need Help?
- Check `ONBOARDING_FIX_SUMMARY.md` for detailed technical information
- Review backend logs: `docker compose logs backend`
- Check database logs: `docker compose logs postgres`

---

## ✅ Success Indicators

After successful onboarding, you should see:
- ✅ All 4 Docker containers running (postgres, redis, backend, frontend)
- ✅ New company database created
- ✅ All tables created in company database
- ✅ Company record in main database
- ✅ Admin user created with hashed password
- ✅ Automatically logged in to the application
- ✅ JWT token received and stored

---

## 🎉 You're Ready!

Your All in One Company application is now set up and ready to use. You can start:
- Managing users and roles
- Setting up accounts and entities
- Creating financial hierarchies
- Processing transactions
- Generating reports

Enjoy using the application! 🚀
