# Troubleshooting Login 500 Error

## Error Handling Improvements

Added comprehensive error handling to the login endpoint:
- Added try-catch blocks in `auth.service.ts` for `validateUser` and `login` methods
- Added error logging with stack traces
- Added graceful error handling in `auth.controller.ts`

## Common Causes of 500 Error on Login

### 1. Database Connection Issue
**Symptoms:** 500 error with database-related error in logs

**Solution:**
- Verify PostgreSQL is running: `pg_isready` or check service status
- Check database connection settings in `.env` file:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_DATABASE=lending_db
  ```
- Test connection manually using `psql` or database client

### 2. Missing Users Table
**Symptoms:** Table "users" does not exist error

**Solution:**
- Run migrations: `npm run migration:run`
- Or enable synchronize in development (already enabled if `NODE_ENV !== 'production'`)

### 3. JWT Configuration Issue
**Symptoms:** JWT signing errors

**Solution:**
- Ensure `JWT_SECRET` is set in `.env` file:
  ```
  JWT_SECRET=your-secret-key-change-in-production
  JWT_EXPIRES_IN=24h
  ```
- Default fallback is `'your-secret-key'` if not set

### 4. Missing Users
**Symptoms:** Login works but no users exist

**Solution:**
- Seed default users: `POST /api/auth/seed`
- Or register a new user: `POST /api/auth/register`

## Debugging Steps

1. **Check Backend Logs**
   - Restart backend: `npm run start:dev`
   - Look for error messages in console when login is attempted
   - The improved error handling will now log detailed error messages

2. **Verify Database Connection**
   ```bash
   # Test PostgreSQL connection
   psql -h localhost -U postgres -d lending_db
   ```

3. **Check Environment Variables**
   ```bash
   # In backend directory
   cat .env
   # Or check if .env.local exists
   ```

4. **Verify Users Table Exists**
   ```sql
   -- Connect to database and run:
   SELECT * FROM users LIMIT 1;
   ```

5. **Test Login Endpoint Directly**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```

## Next Steps

1. Restart the backend server to see improved error messages
2. Check the backend console logs for specific error details
3. Verify database is running and accessible
4. Ensure migrations have been run
5. Check that users exist in the database

## Error Messages

The improved error handling will now show:
- Database connection errors
- User validation errors
- JWT signing errors
- Detailed stack traces in development mode

