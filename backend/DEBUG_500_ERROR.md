# Debugging 500 Internal Server Error

## Current Status
- ✅ Backend is running and listening on port 3001
- ✅ Code compiles successfully
- ❌ Login endpoint returns 500 error
- ❌ Health endpoint also returns 500 error
- ❌ Error response is plain text (not JSON from exception filter)

## What This Means
The backend is **crashing when handling requests**, likely due to a **database connection issue**.

## Immediate Action: Check Backend Console Logs

**Look at the terminal where the backend is running.** You should see error messages like:

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
or
```
Error: password authentication failed for user "postgres"
```
or
```
Error: database "lending_db" does not exist
```

## Common Causes & Solutions

### 1. Database Connection Failed
**Error in logs:** `ECONNREFUSED` or `Connection refused`

**Solution:**
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check PostgreSQL is listening: `netstat -ano | findstr :5432`
- Verify DB_PORT in `.env` matches your PostgreSQL port

### 2. Wrong Database Credentials
**Error in logs:** `password authentication failed` or `role does not exist`

**Solution:**
- Check `.env` file has correct:
  - `DB_USERNAME=postgres` (or your PostgreSQL username)
  - `DB_PASSWORD=123` (or your actual password)
- Test connection manually:
  ```powershell
  psql -U postgres -d lending_db
  ```

### 3. Database Doesn't Exist
**Error in logs:** `database "lending_db" does not exist`

**Solution:**
- Create the database:
  ```sql
  CREATE DATABASE lending_db;
  ```
- Or change `DB_DATABASE` in `.env` to an existing database

### 4. Database Connection Timeout
**Error in logs:** `timeout` or request hangs

**Solution:**
- Check PostgreSQL is accessible
- Verify firewall isn't blocking port 5432
- Check PostgreSQL logs for connection attempts

## Steps to Fix

### Step 1: Check Backend Console
Look at the terminal running `npm run start:dev` and find the error message.

### Step 2: Verify Database Connection
Test if you can connect to PostgreSQL:
```powershell
# If psql is installed
psql -U postgres -d lending_db -c "SELECT 1;"
```

### Step 3: Check .env File
Verify `backend/.env` has correct values:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123
DB_DATABASE=lending_db
```

### Step 4: Restart Backend
After fixing `.env` or database:
1. Stop backend (Ctrl+C)
2. Restart: `npm run start:dev`
3. Watch for startup errors

### Step 5: Test Health Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
```

## Expected Behavior After Fix

Once the database connection is fixed:
1. Backend should start without errors
2. Health endpoint should return: `{"status":"ok","database":"connected",...}`
3. Login endpoint should work (or return proper error messages)
4. Exception filter should format errors as JSON

## Next Steps

1. **Check backend console logs** - This will show the exact error
2. **Share the error message** from the backend console
3. **Fix the database connection issue** based on the error
4. **Restart backend** and test again

The backend console logs are the key to diagnosing this issue!

