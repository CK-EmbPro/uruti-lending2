# API Authentication Guide

## Overview
All protected endpoints require JWT authentication. You must include a valid JWT token in the `Authorization` header.

## Step 1: Login to Get a Token

### Endpoint
```
POST /api/auth/login
```

### Request Body
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

### Example using cURL
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Example using JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.access_token;
console.log('Token:', token);
```

### Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "roles": ["admin"]
  }
}
```

## Step 2: Use the Token in API Requests

### Include Token in Authorization Header
```
Authorization: Bearer <your-token-here>
```

### Example using cURL
```bash
curl -X GET "http://localhost:3000/api/loan-repayments?fromDate=2025-11-26&sortBy=postingDate&sortOrder=DESC&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example using JavaScript/Fetch
```javascript
const token = 'your-token-here';

const response = await fetch('http://localhost:3000/api/loan-repayments?fromDate=2025-11-26&sortBy=postingDate&sortOrder=DESC&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### Example using Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set token for all requests
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or set per request
const response = await api.get('/loan-repayments', {
  params: {
    fromDate: '2025-11-26',
    sortBy: 'postingDate',
    sortOrder: 'DESC',
    limit: 20
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Step 3: Store Token (Frontend)

### Browser localStorage (Frontend)
```javascript
// After login
const { access_token } = await login(email, password);
localStorage.setItem('auth_token', access_token);

// Use in subsequent requests
const token = localStorage.getItem('auth_token');
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Testing with Swagger UI

1. Open Swagger UI: `http://localhost:3000/api-docs`
2. Click the **"Authorize"** button (top right)
3. Enter your token in the format: `Bearer <your-token>`
4. Click **"Authorize"**
5. All protected endpoints will now include the token automatically

## Common Issues

### 401 Unauthorized
- **Cause**: Missing or invalid token
- **Solution**: 
  - Make sure you've logged in and received a token
  - Check that the token is included in the `Authorization` header
  - Verify the token format: `Bearer <token>` (note the space after "Bearer")
  - Check if the token has expired (default: 24 hours)

### Token Expired
- **Cause**: JWT tokens expire after 24 hours (default)
- **Solution**: Login again to get a new token

### Invalid Token Format
- **Correct**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Wrong**: `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (missing "Bearer ")
- **Wrong**: `Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (colon instead of space)

## Default Test Users

Check `backend/src/modules/auth/user-seed.service.ts` for default users created on startup.

## Quick Test Script

```javascript
// test-auth.js
async function testAuth() {
  // 1. Login
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    })
  });
  
  const { access_token } = await loginResponse.json();
  console.log('✅ Login successful, token received');
  
  // 2. Use token to access protected endpoint
  const apiResponse = await fetch('http://localhost:3000/api/loan-repayments?limit=10', {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });
  
  if (apiResponse.ok) {
    const data = await apiResponse.json();
    console.log('✅ API request successful:', data);
  } else {
    console.error('❌ API request failed:', await apiResponse.text());
  }
}

testAuth();
```

