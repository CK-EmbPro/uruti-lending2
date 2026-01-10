# Routing After Login Guide

## 🔐 Authentication Flow

### Step 1: Login
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@urutilending.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@urutilending.com",
    "name": "System Administrator",
    "roles": ["admin", "user"],
    "isActive": true
  }
}
```

### Step 2: Use Token in Requests
Include the token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 📍 Available Routes After Login

### 🔑 Authentication Routes (Some require auth)
- `GET /api/auth/me` - Get current user (requires token)
- `GET /api/auth/users` - List all users
- `GET /api/auth/users/:id` - Get user by ID
- `PATCH /api/auth/users/:id/roles` - Update user roles

### 🏢 Company Management
- `GET /api/companies` - List companies
- `GET /api/companies/:id` - Get company
- `POST /api/companies` - Create company
- `PATCH /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### 👥 Customer Management
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `POST /api/customers/check-duplicate` - Check for duplicates

### 💰 Loan Products
- `GET /api/loan-products` - List loan products
- `GET /api/loan-products/:id` - Get loan product
- `POST /api/loan-products` - Create loan product
- `PATCH /api/loan-products/:id` - Update loan product
- `DELETE /api/loan-products/:id` - Delete loan product

### 📝 Loan Applications
- `GET /api/loan-applications` - List applications
- `GET /api/loan-applications/:id` - Get application
- `POST /api/loan-applications` - Create application
- `PATCH /api/loan-applications/:id` - Update application
- `POST /api/loan-applications/:id/approve` - Approve application
- `POST /api/loan-applications/:id/reject` - Reject application
- `POST /api/loan-applications/:id/submit` - Submit application
- `DELETE /api/loan-applications/:id` - Delete application

### 💵 Loans
- `GET /api/loans` - List loans
- `GET /api/loans/:id` - Get loan
- `POST /api/loans` - Create loan
- `PATCH /api/loans/:id` - Update loan
- `POST /api/loans/:id/submit` - Submit loan
- `POST /api/loans/:id/cancel` - Cancel loan
- `POST /api/loans/:id/close` - Close loan
- `POST /api/loans/:id/mark-npa` - Mark as NPA
- `POST /api/loans/:id/transfer` - Transfer loan

### 💸 Loan Disbursements
- `GET /api/loan-disbursements` - List disbursements
- `GET /api/loan-disbursements/:id` - Get disbursement
- `POST /api/loan-disbursements` - Create disbursement
- `POST /api/loan-disbursements/partial` - Partial disbursement

### 💳 Loan Repayments
- `GET /api/loan-repayments` - List repayments
- `GET /api/loan-repayments/:id` - Get repayment
- `POST /api/loan-repayments` - Create repayment
- `POST /api/loan-repayments/bulk` - Bulk repayment
- `POST /api/loan-repayments/prepayment` - Prepayment
- `POST /api/loan-repayments/waiver` - Waiver
- `POST /api/loan-repayments/settlement` - Settlement

### 📊 Reporting
- `GET /api/reporting/portfolio` - Portfolio report
- `GET /api/reporting/npa` - NPA report
- `GET /api/reporting/collection` - Collection report
- `GET /api/reporting/disbursement` - Disbursement report
- `GET /api/reporting/overdue` - Overdue report

### 🔄 Workflows
- `GET /api/workflows` - List workflows
- `GET /api/workflows/:id` - Get workflow
- `POST /api/workflows/:id/actions` - Perform workflow action
- `GET /api/workflows/:id/history` - Get workflow history

### 🧮 Calculations
- `POST /api/calculations/emi` - Calculate EMI
- `POST /api/calculations/interest` - Calculate interest
- `POST /api/calculations/penalty` - Calculate penalty

---

## 🧪 Testing Routes After Login

### Using cURL:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Use token for protected routes
curl -X GET http://localhost:3000/api/loans \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:3000/api/loan-applications \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using PowerShell:

```powershell
# 1. Login
$loginBody = @{
    email = "admin@urutilending.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $response.access_token

# 2. Use token for protected routes
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/loans" `
    -Method GET `
    -Headers $headers

Invoke-RestMethod -Uri "http://localhost:3000/api/loan-applications" `
    -Method GET `
    -Headers $headers

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
    -Method GET `
    -Headers $headers
```

### Using Swagger UI:

1. Open: `http://localhost:3000/api-docs`
2. Click on `POST /api/auth/login`
3. Click "Try it out"
4. Enter credentials and execute
5. Copy the `access_token` from response
6. Click the "Authorize" button (🔒) at the top
7. Enter: `Bearer <your-token>`
8. Now all protected endpoints will use this token automatically

---

## 🔒 Protected vs Public Routes

### Public Routes (No authentication required):
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/seed` - Seed users (dev only)

### Protected Routes (Require JWT token):
- All other routes require authentication
- Include `Authorization: Bearer <token>` header

---

## 📚 Complete API Documentation

View all available routes and test them at:
**http://localhost:3000/api-docs**

The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Try it out functionality
- Token authorization support

---

## 🎯 Quick Test Checklist

After logging in, test these key routes:

- [ ] `GET /api/auth/me` - Verify token works
- [ ] `GET /api/loans` - List loans
- [ ] `GET /api/loan-applications` - List applications
- [ ] `GET /api/loan-repayments` - List repayments
- [ ] `GET /api/companies` - List companies
- [ ] `GET /api/reporting/portfolio` - Get portfolio report

---

## ⚠️ Common Issues

### 401 Unauthorized
- **Cause:** Missing or invalid token
- **Solution:** Login again to get a new token

### Token Expired
- **Cause:** JWT token has expired (default: 24h)
- **Solution:** Login again to get a new token

### Invalid Token Format
- **Cause:** Token not in `Bearer <token>` format
- **Solution:** Ensure header is: `Authorization: Bearer <token>`

