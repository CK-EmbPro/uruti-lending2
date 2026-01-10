# Test Loan Application with Credit Scoring

## Quick Test Guide

This guide shows how to test the complete loan application flow with credit scoring integration.

---

## Prerequisites

1. **Backend server running**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Database migration completed**
   - Credit scoring fields should be added to `loan_applications` table
   - Run: `npm run migration:run` (if not already done)

3. **JWT Token**
   - Login to get token: `POST /auth/login`
   - Default: `admin@urutilending.com` / `admin123`

---

## Test Methods

### Method 1: Node.js Test Script (Recommended)

```bash
# Set token
export JWT_TOKEN="your-token-here"  # Linux/Mac
$env:JWT_TOKEN="your-token-here"    # Windows PowerShell

# Run test
cd backend
node test-loan-application-scoring.js
```

### Method 2: PowerShell Script (Windows)

```powershell
$env:JWT_TOKEN = "your-token-here"
.\backend\test-loan-application-scoring.ps1
```

### Method 3: Manual API Testing

#### Step 1: Create Loan Application

```bash
POST /loan-applications
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "applicantType": "Customer",
  "applicantId": "test-applicant-123",
  "loanProductId": "uuid-of-loan-product",
  "requestedAmount": 50000,
  "repaymentPeriods": 24,
  "repaymentFrequency": "Monthly",
  "isSecuredLoan": false
}
```

#### Step 2: Submit with Scoring Data

```bash
POST /loan-applications/{applicationId}/submit
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "scoringData": {
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
  }
}
```

#### Step 3: Verify Response

Expected response should include:
- `status`: "Submitted" or "Under Review"
- `creditScore`: Number (300-850)
- `scoringDetails`: Complete breakdown
- `creditScoreCalculatedAt`: Timestamp

---

## Expected Test Flow

```
1. Create Application
   ↓
   Status: DRAFT
   ↓
2. Submit with Scoring Data
   ↓
   Credit Score Calculated
   Status: SUBMITTED or UNDER_REVIEW (if score >= 700)
   ↓
3. Verify Persistence
   ↓
   Credit score stored in database
   Scoring details stored in JSONB field
```

---

## Test Scenarios

### Scenario 1: Full Data (High Score)

**Input:**
- Complete bank account history
- Good utility payment history
- Consistent rent payments
- Positive behavioral signals

**Expected:**
- Credit score: 700-850
- Status: UNDER_REVIEW (auto-updated)
- Risk tier: LOW

### Scenario 2: Minimal Data

**Input:**
- Only bank account data
- No utility/rent data

**Expected:**
- Credit score: Calculated with available data
- Lower confidence score
- Status: SUBMITTED

### Scenario 3: Poor Data (Low Score)

**Input:**
- Late payments
- High debt
- Inconsistent behavior

**Expected:**
- Credit score: < 600
- Status: SUBMITTED (requires manual review)
- Risk tier: HIGH

---

## Verification Queries

### Check Application in Database

```sql
SELECT 
  application_number,
  status,
  credit_score,
  credit_score_calculated_at,
  scoring_details->>'riskTier' as risk_tier,
  scoring_details->>'explanation' as explanation
FROM loan_applications
WHERE id = 'your-application-id';
```

### Check Scoring Breakdown

```sql
SELECT 
  scoring_details->'scoreBreakdown'->'traditional'->>'score' as traditional_score,
  scoring_details->'scoreBreakdown'->'alternative'->>'score' as alternative_score,
  scoring_details->'scoreBreakdown'->'behavioral'->>'score' as behavioral_score,
  scoring_details->>'finalScore' as final_score
FROM loan_applications
WHERE id = 'your-application-id';
```

---

## Troubleshooting

### Error: "Application can only be submitted from DRAFT status"

**Solution:** Make sure the application is in DRAFT status before submitting.

### Error: "Credit score not calculated"

**Solution:** 
- Check if scoring data was provided
- Verify scoring service is working
- Check server logs for errors

### Error: "Loan product not found"

**Solution:**
- Create a loan product first
- Or use an existing product ID

---

## Success Indicators

✅ Application created successfully  
✅ Application submitted with status change  
✅ Credit score calculated (300-850)  
✅ Scoring details stored in database  
✅ Status auto-updated based on score (if >= 700)  
✅ Data persists after fetch  

---

## Next Steps After Testing

1. ✅ Verify scoring accuracy
2. Test with different data combinations
3. Monitor performance (latency)
4. Check database storage
5. Test auto-approval (if score >= 750)

---

**Ready to test!** Run the test script or use the API endpoints manually.

