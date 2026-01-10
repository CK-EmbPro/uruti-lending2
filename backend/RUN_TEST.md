# Run Loan Application Scoring Test

## Quick Start

### Step 1: Start Backend Server

```bash
cd backend
npm run start:dev
```

Wait for the server to start (you'll see "Application is running on: http://localhost:3000").

### Step 2: Get JWT Token

In a **new terminal window**, run:

**PowerShell:**
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@urutilending.com","password":"admin123"}'

$env:JWT_TOKEN = $loginResponse.access_token
Write-Host "Token: $env:JWT_TOKEN"
```

**Bash/Node.js:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}' \
  | jq -r '.access_token')

export JWT_TOKEN=$TOKEN
echo "Token: $JWT_TOKEN"
```

### Step 3: Run Test

**Node.js:**
```bash
cd backend
node test-loan-application-scoring.js
```

**PowerShell:**
```powershell
.\backend\test-loan-application-scoring.ps1
```

---

## Expected Output

```
🧪 Testing Loan Application with Credit Scoring Integration
============================================================
Base URL: http://localhost:3000
============================================================

📋 Step 1: Getting user information...
✅ User: admin@urutilending.com
✅ Company ID: uuid

📋 Step 2: Getting or creating loan product...
✅ Loan Product ID: uuid

📋 Step 3: Creating loan application...
✅ Application created: APP-2024-000001
   ID: uuid
   Status: Draft

📋 Step 4: Submitting application with credit scoring data...
✅ Application submitted successfully!
   Status: Submitted
   Credit Score: 725
   Risk Tier: LOW
   Confidence: 77.0%

📊 Credit Scoring Breakdown:
────────────────────────────────────────────────────────────
Traditional Bureau: 680 (30% weight)
  - Payment History: 85
  - Credit Utilization: 75
  - Public Records: 100
Alternative Financial: 750 (40% weight)
  - Bank Account: 80
    AI Insights: Cash flow stability detected
  - Utility/Telecom: 85
  - Rent Payments: 90
Behavioral & Digital: 720 (30% weight)
  - Device Biometrics: 75
  - Digital Footprint: 80
  - Transactional Intelligence: 70
────────────────────────────────────────────────────────────
Final Score: 725
Explanation: Final credit score: 725 (LOW risk tier)...

📋 Step 5: Verifying data persistence...
✅ Credit score persisted: 725
✅ Scoring details stored: Yes
✅ Calculated at: 2024-01-20T10:30:00Z

============================================================
✅ TEST SUMMARY
============================================================
Application Number: APP-2024-000001
Application Status: Submitted
Credit Score: 725
Risk Tier: LOW
Integration Status: ✅ SUCCESS
============================================================

🎉 All tests passed!
```

---

## Troubleshooting

### "Unable to connect to the remote server"
- **Solution**: Start the backend server first (`npm run start:dev`)

### "401 Unauthorized"
- **Solution**: Get a fresh JWT token (tokens expire)

### "Loan product not found"
- **Solution**: The script will try to create one, or create one manually first

### "Application can only be submitted from DRAFT status"
- **Solution**: Make sure you're creating a new application, not updating an existing one

---

## Manual API Testing

If you prefer to test manually using curl or Postman:

### 1. Create Application
```bash
POST /loan-applications
Authorization: Bearer YOUR_TOKEN

{
  "applicantType": "Customer",
  "applicantId": "test-123",
  "loanProductId": "uuid",
  "requestedAmount": 50000,
  "repaymentPeriods": 24
}
```

### 2. Submit with Scoring
```bash
POST /loan-applications/{id}/submit
Authorization: Bearer YOUR_TOKEN

{
  "scoringData": {
    "bankAccountData": { "transactions": [...] },
    "utilityTelecomData": { "payments": [...] },
    "rentPaymentData": { "payments": [...] },
    "behavioralData": { ... },
    "digitalFootprintData": { "consent": true, ... },
    "transactionalData": { ... }
  }
}
```

### 3. Verify
```bash
GET /loan-applications/{id}
Authorization: Bearer YOUR_TOKEN
```

Check for:
- `creditScore` field
- `scoringDetails` object
- `creditScoreCalculatedAt` timestamp

---

**Ready to test!** Start the server and run the test script.

