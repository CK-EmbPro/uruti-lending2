# Fix Login 500 Error - Step by Step Guide

## Changes Made

1. ✅ **Fixed Health Controller** - Updated from deprecated `@InjectConnection()` to `@InjectDataSource()`
2. ✅ **Enhanced Error Handling** - Added detailed logging in auth service
3. ✅ **Global Exception Filter** - Added to catch and format all errors properly

## Current Issue

The login endpoint returns 500 error, likely due to:
- Database connection failure
- Missing environment variables
- Backend not restarted after setting environment variables

## Solution Steps

### Step 1: Create/Update .env File

Create or update `backend/.env` file with your database credentials:

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123
DB_DATABASE=lending_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
API_PREFIX=api
NODE_ENV=development
```

### Step 2: Restart Backend Server

**Important:** After setting environment variables, you MUST restart the backend:

```powershell
# Stop the backend (Ctrl+C in the terminal where it's running)
# Then restart it:
cd backend
npm run start:dev
```

### Step 3: Verify Database Connection

Test the health endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health/database" -Method GET
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "usersTableExists": true,
  "userCount": 0,
  "timestamp": "..."
}
```

### Step 4: Seed Users (If No Users Exist)

If `userCount` is 0, seed default users:

```powershell
$body = @{ } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/seed" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

### Step 5: Test Login Endpoint

```powershell
$body = @{
  email = "admin@urutilending.com"
  password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@urutilending.com",
    "name": "System Administrator",
    "roles": ["admin", "user"],
    "isActive": true
  }
}
```

## Troubleshooting

### If Health Endpoint Returns 500:

1. **Check PostgreSQL is running:**
   ```powershell
   Get-Service -Name postgresql*
   ```

2. **Verify database exists:**
   ```powershell
   # Connect to PostgreSQL and check
   psql -U postgres -d lending_db -c "SELECT 1;"
   ```

3. **Check backend logs** for specific error messages

### If Login Still Returns 500:

1. **Check backend console logs** - The improved error handling will show:
   - Database connection errors
   - Table not found errors
   - JWT configuration errors

2. **Verify .env file** is in `backend/` directory

3. **Check database credentials** match your PostgreSQL setup

4. **Ensure users table exists:**
   - If `synchronize: true` in development, tables should auto-create
   - Or run migrations: `npm run migration:run`

## Default Login Credentials

After seeding, use these credentials:

| Email | Password | Roles |
|-------|----------|-------|
| `admin@urutilending.com` | `admin123` | admin, user |
| `loan.officer@urutilending.com` | `officer123` | loan_officer, user |
| `manager@urutilending.com` | `manager123` | manager, loan_officer, user |
| `approver@urutilending.com` | `approver123` | approver, user |
| `user@urutilending.com` | `user123` | user |

## Next Steps

After fixing the login:
1. Test the frontend login page
2. Verify JWT token is stored in localStorage
3. Test protected routes

