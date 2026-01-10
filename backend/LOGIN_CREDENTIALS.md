# Login Credentials

## Default Seeded Users

The following users are available for testing:

| Email | Password | Roles | Description |
|-------|----------|-------|-------------|
| `admin@urutilending.com` | `admin123` | admin, user | System Administrator |
| `loan.officer@urutilending.com` | `officer123` | loan_officer, user | Loan Officer |
| `manager@urutilending.com` | `manager123` | manager, loan_officer, user | Loan Manager |
| `approver@urutilending.com` | `approver123` | approver, user | Loan Approver |
| `user@urutilending.com` | `user123` | user | Regular User |

## Testing Login

### Using cURL:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}'
```

### Using Browser/Postman:
- **URL**: `POST http://localhost:3001/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@urutilending.com",
    "password": "admin123"
  }
  ```

### Expected Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cd11ba72-afdc-4c58-a38e-a96568c597d1",
    "email": "admin@urutilending.com",
    "name": "System Administrator",
    "roles": ["admin", "user"],
    "isActive": true,
    "createdAt": "2025-12-03T11:01:59.376Z",
    "updatedAt": "2025-12-03T11:01:59.376Z"
  }
}
```

## Health Check Endpoints

### Basic Health Check:
```bash
curl http://localhost:3001/api/health
```

### Database Health Check:
```bash
curl http://localhost:3001/api/health/database
```

## Troubleshooting

If login still fails with 500 error:

1. **Check backend logs** for detailed error messages
2. **Test health endpoint** to verify database connection
3. **Verify database is running** and accessible
4. **Check .env file** has correct database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5434
   DB_USERNAME=postgres
   DB_PASSWORD=123
   DB_DATABASE=lending_db
   ```

## Recent Fixes

- ✅ Added comprehensive error handling to login endpoint
- ✅ Fixed roles array handling (TypeORM simple-array compatibility)
- ✅ Added health check endpoints for diagnostics
- ✅ Improved error logging with stack traces

