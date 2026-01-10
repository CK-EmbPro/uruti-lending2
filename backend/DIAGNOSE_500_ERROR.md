# Diagnosing 500 Internal Server Error

## Quick Diagnosis Steps

### 1. Check Health Endpoint (No Auth Required)

Test the database connection:
```bash
# Basic health check
curl http://localhost:3001/api/health

# Detailed database check
curl http://localhost:3001/api/health/database
```

Expected response if working:
```json
{
  "status": "ok",
  "database": "connected",
  "usersTableExists": true,
  "userCount": 0,
  "timestamp": "2025-12-07T20:30:00.000Z"
}
```

### 2. Check Browser Console

Open browser DevTools (F12) and check:
- **Network tab**: See which specific endpoint is returning 500
- **Console tab**: Check for JavaScript errors
- **Response tab**: View the actual error message from the server

### 3. Check Backend Logs

The backend console should show detailed error messages with:
- Stack traces
- Database connection errors
- Missing table errors
- JWT configuration errors

### 4. Common Issues and Solutions

#### Issue: Database Connection Failed
**Symptoms**: Health endpoint shows `"database": "disconnected"`

**Solution**:
1. Verify PostgreSQL is running
2. Check `.env` file has correct credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5434
   DB_USERNAME=postgres
   DB_PASSWORD=123
   DB_DATABASE=lending_db
   ```
3. Test connection manually:
   ```bash
   psql -h localhost -p 5434 -U postgres -d lending_db
   ```

#### Issue: Users Table Doesn't Exist
**Symptoms**: Health endpoint shows `"usersTableExists": false`

**Solution**:
- If `synchronize: true` in development, restart the server
- Or run migrations: `npm run migration:run`

#### Issue: No Users in Database
**Symptoms**: Login fails with 401 or 500

**Solution**:
```bash
# Seed default users
curl -X POST http://localhost:3001/api/auth/seed
```

#### Issue: JWT Configuration Error
**Symptoms**: Login works but token generation fails

**Solution**:
- Ensure `JWT_SECRET` is set in `.env`:
  ```
  JWT_SECRET=your-secret-key-change-in-production
  JWT_EXPIRES_IN=24h
  ```

### 5. Test Login Endpoint Directly

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 6. Check Which Endpoint is Failing

Look at the browser Network tab to see:
- `/api/auth/login` - Authentication endpoint
- `/api/analytics/metrics` - Analytics endpoint
- `/api/health` - Health check endpoint

Each endpoint has different requirements and error handling.

## Next Steps

1. **Restart backend server** to pick up new health check endpoint:
   ```bash
   npm run start:dev
   ```

2. **Test health endpoint**:
   ```bash
   curl http://localhost:3001/api/health/database
   ```

3. **Check backend console** for detailed error messages

4. **Share the error message** from:
   - Backend console logs
   - Health endpoint response
   - Browser Network tab response

