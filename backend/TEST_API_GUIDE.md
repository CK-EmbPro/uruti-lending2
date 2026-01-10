# Testing Weighted Credit Scoring API - Guide

## Quick Test Guide

### Prerequisites

1. **Backend server running**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Get JWT Token**
   - Login via API or use existing token
   - Default test credentials: `admin@urutilending.com` / `admin123`

---

## Method 1: Using Node.js Test Script (Recommended)

### Step 1: Install dependencies (if needed)
```bash
cd backend
npm install axios
```

### Step 2: Get JWT Token
```bash
# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}'
```

Copy the `access_token` from the response.

### Step 3: Set token and run test
```bash
# Windows PowerShell
$env:JWT_TOKEN="your-token-here"
node test-weighted-scoring.js

# Linux/Mac
export JWT_TOKEN="your-token-here"
node test-weighted-scoring.js
```

---

## Method 2: Using PowerShell Script (Windows)

### Step 1: Get JWT Token
```powershell
# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@urutilending.com","password":"admin123"}'

$token = $loginResponse.access_token
$env:JWT_TOKEN = $token
```

### Step 2: Run test
```powershell
.\test-weighted-scoring.ps1
```

---

## Method 3: Using cURL (Any Platform)

### Step 1: Get JWT Token
```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}' \
  | jq -r '.access_token')
```

### Step 2: Test API
```bash
curl -X POST http://localhost:3000/credit-scoring-engine/calculate-weighted-score \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantId": "test-applicant-123",
    "bankAccountData": {
      "transactions": [
        {
          "date": "2024-01-15",
          "amount": 5000,
          "category": "SALARY",
          "description": "Monthly salary"
        }
      ]
    },
    "utilityTelecomData": {
      "payments": [
        {
          "date": "2024-01-05",
          "amount": 100,
          "daysLate": 0,
          "utilityType": "ELECTRICITY"
        }
      ],
      "accounts": [
        {
          "startDate": "2022-01-01",
          "type": "ELECTRICITY"
        }
      ]
    },
    "rentPaymentData": {
      "payments": [
        {
          "date": "2024-01-01",
          "amount": 1200,
          "daysLate": 0
        }
      ],
      "verified": true
    },
    "behavioralData": {
      "completionRate": 1.0,
      "typingConsistency": 0.85,
      "authentic": true,
      "timeSpentSeconds": 600
    },
    "digitalFootprintData": {
      "consent": true,
      "professionalStrength": 0.8,
      "educationVerified": true
    },
    "transactionalData": {
      "timeConsistency": 0.8,
      "geographicConsistency": 0.9
    }
  }'
```

---

## Method 4: Using Postman

### Step 1: Import Collection
1. Open Postman
2. Create new request
3. Method: `POST`
4. URL: `http://localhost:3000/credit-scoring-engine/calculate-weighted-score`

### Step 2: Set Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Step 3: Set Body (raw JSON)
Use the sample request from `test-weighted-scoring.js`

### Step 4: Send Request

---

## Expected Response

```json
{
  "finalScore": 725,
  "scoreBreakdown": {
    "traditional": {
      "score": 680,
      "breakdown": {
        "paymentHistory": 85,
        "creditUtilization": 75,
        "publicRecords": 100
      },
      "confidence": 0.9
    },
    "alternative": {
      "score": 750,
      "breakdown": {
        "bankAccount": {
          "score": 80,
          "confidence": 0.8,
          "aiInsights": {
            "cashFlowPatterns": { ... },
            "incomeStability": { ... },
            "spendingBehavior": { ... }
          }
        },
        "utilityTelecom": { ... },
        "rentPayment": { ... }
      },
      "confidence": 0.75
    },
    "behavioral": {
      "score": 720,
      "breakdown": {
        "deviceBiometrics": { ... },
        "digitalFootprint": { ... },
        "transactionalIntelligence": { ... }
      },
      "confidence": 0.65
    }
  },
  "weights": {
    "TRADITIONAL_BUREAU": 0.30,
    "ALTERNATIVE_FINANCIAL": 0.40,
    "BEHAVIORAL_DIGITAL": 0.30
  },
  "explanation": "Final credit score: 725 (LOW risk tier)...",
  "confidence": 0.77,
  "riskTier": "LOW",
  "processingTimeMs": 1250,
  "calculatedAt": "2024-01-20T10:30:00Z"
}
```

---

## Troubleshooting

### Error: 401 Unauthorized
- **Solution**: Check JWT token is valid and not expired
- Get a new token by logging in again

### Error: 404 Not Found
- **Solution**: Check backend server is running on correct port
- Verify endpoint: `/credit-scoring-engine/calculate-weighted-score`

### Error: Connection Refused
- **Solution**: Start the backend server
  ```bash
  cd backend
  npm run start:dev
  ```

### Error: Module not found (axios)
- **Solution**: Install axios
  ```bash
  cd backend
  npm install axios
  ```

---

## Test Scenarios

### Scenario 1: Full Data
- All data sources provided
- Expected: High confidence score

### Scenario 2: Minimal Data
- Only bank account data
- Expected: Lower confidence, but still calculates score

### Scenario 3: No Traditional Data
- Only alternative and behavioral data
- Expected: Score based on available data sources

---

## Next Steps

1. ✅ Test with sample data
2. Integrate with loan application flow
3. Connect to real data sources
4. Enhance AI models
5. Add monitoring and logging

---

**Ready to test!** Choose your preferred method above and start testing.

