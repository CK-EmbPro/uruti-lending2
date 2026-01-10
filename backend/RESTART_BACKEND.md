# Backend Restart Instructions

## Current Issue
The backend is **hanging/timing out** when trying to connect to the database.

## Diagnosis Results
- ✅ Backend is listening on port 3001
- ✅ .env file exists
- ✅ DB_PASSWORD is set
- ✅ PostgreSQL service is running
- ❌ **Backend is hanging on database connection**

## Solution

### Step 1: Stop the Current Backend
1. Find the terminal/console where the backend is running
2. Press `Ctrl+C` to stop it
3. Wait for it to fully stop

### Step 2: Verify .env File
Check that `backend/.env` has these values (adjust as needed):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123
DB_DATABASE=lending_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=development
```

### Step 3: Verify Database Exists
Test if you can connect to the database:

```powershell
# If you have psql installed
psql -U postgres -d lending_db -c "SELECT 1;"
```

If the database doesn't exist, create it:
```sql
CREATE DATABASE lending_db;
```

### Step 4: Restart Backend
```powershell
cd backend
npm run start:dev
```

**Watch the console output** for:
- Database connection errors
- "🚀 Uruti Lending Platform API is running" message
- Any error messages

### Step 5: Test Again
After restarting, test the health endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
```

## Common Issues

### Database Connection Timeout
- Check PostgreSQL is actually running: `Get-Service postgresql*`
- Verify port 5432 is not blocked by firewall
- Check PostgreSQL logs for connection attempts

### Wrong Database Name
- Verify `lending_db` exists: `psql -U postgres -l`
- Create it if missing: `CREATE DATABASE lending_db;`

### Wrong Credentials
- Double-check username and password in `.env`
- Test connection manually: `psql -U postgres -d lending_db`

### Backend Not Picking Up .env
- Make sure `.env` is in `backend/` directory
- Restart backend after changing `.env`
- Check for `.env.local` that might override `.env`

## Next Steps
After restarting, the backend should:
1. Connect to database successfully
2. Respond to health checks
3. Handle login requests without hanging

If it still hangs, check the backend console logs for specific database error messages.

