# Debugging Login 500 Error - Enhanced Logging

## Changes Made

1. **Enhanced Controller Logging**:
   - Logs when login is attempted
   - Logs successful logins
   - Logs detailed error information including stack traces

2. **Enhanced Service Logging**:
   - Logs JWT token generation attempts
   - Catches and logs JWT signing errors specifically
   - Provides detailed error messages

3. **JWT Module Configuration Logging**:
   - Logs JWT configuration on module initialization
   - Verifies JWT secret is loaded correctly

## Next Steps

1. **Restart the backend server**:
   ```bash
   npm run start:dev
   ```

2. **Watch the console logs** when you try to login. You should see:
   - `JWT Module Configuration: { secret: '***', expiresIn: '24h' }` - on startup
   - `Login attempt for: admin@urutilending.com` - when login is attempted
   - Either `Login successful for: ...` or detailed error information

3. **Check for these specific errors**:

   ### JWT Configuration Error
   If you see: `JWT signing error: ...`
   - **Solution**: Check that `JWT_SECRET` is set in `.env` file
   - Verify the JWT module is properly initialized

   ### Database Connection Error
   If you see: `Error validating user: ...`
   - **Solution**: Check database connection settings in `.env`
   - Test with health endpoint: `http://localhost:3001/api/health/database`

   ### User Not Found Error
   If you see: `Invalid credentials`
   - **Solution**: Verify user exists in database
   - Check password is correct (see `LOGIN_CREDENTIALS.md`)

   ### Roles Processing Error
   If you see errors related to roles:
   - **Solution**: The roles handling fix should prevent this, but check logs for details

## Testing

### Test Login with cURL:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}' \
  -v
```

The `-v` flag will show the full HTTP response including status code and error message.

### Check Backend Logs:
Look for these log messages in order:
1. `JWT Module Configuration: ...` (on startup)
2. `Login attempt for: ...` (when request received)
3. Either success or detailed error message

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `JWT signing error: secretOrPrivateKey must have a value` | JWT secret not configured | Set `JWT_SECRET` in `.env` |
| `Error validating user: ...` | Database connection issue | Check database settings and connection |
| `Invalid credentials` | Wrong email/password | Use correct credentials from `LOGIN_CREDENTIALS.md` |
| `User account is inactive` | User isActive = false | Update user in database |
| `Failed to generate authentication token` | JWT service error | Check JWT configuration and logs |

## Share Error Details

When reporting the error, please share:
1. **Backend console logs** - especially the error message and stack trace
2. **HTTP response** - status code and response body
3. **Request details** - email used (password not needed)

