# User Seeds

## Overview

The backend includes a user seeding service that creates default users for testing and development.

## Default Users

The following users are created when seeding:

| Email | Password | Name | Roles |
|-------|----------|------|-------|
| admin@urutilending.com | admin123 | System Administrator | admin, user |
| loan.officer@urutilending.com | officer123 | Loan Officer | loan_officer, user |
| manager@urutilending.com | manager123 | Loan Manager | manager, loan_officer, user |
| approver@urutilending.com | approver123 | Loan Approver | approver, user |
| user@urutilending.com | user123 | Regular User | user |

## How to Seed Users

### Option 1: Using API Endpoint (Recommended)

**Normal Seed** (only if no users exist):
```bash
POST http://localhost:3000/api/auth/seed
```

**Force Seed** (creates users even if some exist):
```bash
POST http://localhost:3000/api/auth/seed/force
```

### Option 2: Using Swagger UI

1. Open Swagger UI: http://localhost:3000/api-docs
2. Navigate to `auth` section
3. Find `POST /auth/seed` or `POST /auth/seed/force`
4. Click "Try it out" and then "Execute"

### Option 3: Using cURL

```bash
# Normal seed
curl -X POST http://localhost:3000/api/auth/seed

# Force seed
curl -X POST http://localhost:3000/api/auth/seed/force
```

## Login Credentials

After seeding, you can use any of these credentials to login:

**Admin User:**
- Email: `admin@urutilending.com`
- Password: `admin123`

**Loan Officer:**
- Email: `loan.officer@urutilending.com`
- Password: `officer123`

**Manager:**
- Email: `manager@urutilending.com`
- Password: `manager123`

**Approver:**
- Email: `approver@urutilending.com`
- Password: `approver123`

**Regular User:**
- Email: `user@urutilending.com`
- Password: `user123`

## Security Note

⚠️ **Important**: These are default test credentials. In production:
1. Change all default passwords
2. Remove or disable seed endpoints
3. Use strong, unique passwords
4. Implement proper password policies

## Customization

To modify the seed users, edit `backend/src/modules/auth/user-seed.service.ts`:

```typescript
const users = [
  {
    email: 'your-email@example.com',
    password: 'your-password',
    name: 'Your Name',
    roles: ['admin', 'user'],
    isActive: true,
  },
  // Add more users...
];
```

## Testing with Frontend

1. Start the backend server
2. Seed users using one of the methods above
3. Open the frontend: http://localhost:3001
4. Login with any of the seeded user credentials
5. Test different roles and permissions

## Troubleshooting

**Users not created?**
- Check if users already exist (normal seed skips if users exist)
- Use force seed: `POST /auth/seed/force`
- Check backend logs for errors

**Can't login?**
- Verify users were created: `GET /auth/users`
- Check password is correct
- Ensure user is active (`isActive: true`)

**Permission errors?**
- Verify user has correct roles
- Check role-based guards in backend
- Review workflow permissions

