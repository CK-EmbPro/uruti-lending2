# Loan Application - Weighted Credit Scoring Integration ✅

## Overview

The **Weighted Credit Scoring Engine** has been fully integrated into the loan application flow, enabling automatic credit scoring when applications are submitted.

---

## What Was Integrated

### 1. Entity Updates

**File:** `backend/src/modules/loan-application/entities/loan-application.entity.ts`

Added fields to store credit scoring results:
- `creditScore` (int) - Final weighted credit score (300-850)
- `scoringDetails` (json) - Complete scoring breakdown and AI insights
- `creditScoreCalculatedAt` (timestamp) - When score was last calculated

### 2. Service Integration

**File:** `backend/src/modules/loan-application/loan-application.service.ts`

Added methods:
- `submit()` - Submit application and optionally trigger credit scoring
- `calculateCreditScore()` - Calculate weighted credit score for an application
- `autoApproveIfEligible()` - Auto-approve high-scoring applications (optional)

### 3. Controller Endpoints

**File:** `backend/src/modules/loan-application/loan-application.controller.ts`

New endpoints:
- `POST /loan-applications/:id/submit` - Submit application with optional scoring data
- `POST /loan-applications/:id/calculate-credit-score` - Calculate credit score

### 4. Module Integration

**File:** `backend/src/modules/loan-application/loan-application.module.ts`

Added `CreditScoringEngineModule` to imports.

---

## API Endpoints

### 1. Submit Application with Credit Scoring

**POST** `/loan-applications/:id/submit`

**Request Body:**
```json
{
  "scoringData": {
    "bankAccountData": {
      "transactions": [...]
    },
    "utilityTelecomData": {
      "payments": [...]
    },
    "rentPaymentData": {
      "payments": [...]
    },
    "behavioralData": {...},
    "digitalFootprintData": {
      "consent": true,
      ...
    },
    "transactionalData": {...}
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "applicationNumber": "APP-2024-000001",
  "status": "Submitted",
  "creditScore": 725,
  "scoringDetails": {
    "finalScore": 725,
    "scoreBreakdown": {...},
    "explanation": "...",
    "riskTier": "LOW"
  },
  ...
}
```

### 2. Calculate Credit Score

**POST** `/loan-applications/:id/calculate-credit-score`

**Request Body:**
```json
{
  "scoringData": {
    "bankAccountData": {...},
    "utilityTelecomData": {...},
    "rentPaymentData": {...},
    "behavioralData": {...},
    "digitalFootprintData": {...},
    "transactionalData": {...},
    "creditBureauData": {...}
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "applicationNumber": "APP-2024-000001",
  "creditScore": 725,
  "scoringDetails": {
    "finalScore": 725,
    "scoreBreakdown": {
      "traditional": {
        "score": 680,
        "breakdown": {...}
      },
      "alternative": {
        "score": 750,
        "breakdown": {
          "bankAccount": {
            "score": 80,
            "aiInsights": {
              "cashFlowPatterns": {...},
              "incomeStability": {...},
              "spendingBehavior": {...}
            }
          },
          ...
        }
      },
      "behavioral": {
        "score": 720,
        "breakdown": {...}
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
    "calculatedAt": "2024-01-20T10:30:00Z"
  },
  "creditScoreCalculatedAt": "2024-01-20T10:30:00Z"
}
```

---

## Application Flow

### Standard Flow

```
1. Create Application (DRAFT)
   ↓
2. Submit Application (POST /loan-applications/:id/submit)
   - Optionally provide scoring data
   - Status: DRAFT → SUBMITTED
   - Credit score calculated if data provided
   ↓
3. Credit Score Calculated
   - If score >= 700: Status → UNDER_REVIEW
   - If score < 700: Status remains SUBMITTED
   ↓
4. Manual Review / Auto-Approval
   - High scores (>= 750) can be auto-approved
   - Medium scores: Manual review
   - Low scores: Manual review required
   ↓
5. Approval / Rejection
   - Status: UNDER_REVIEW → APPROVED / REJECTED
```

### Credit Scoring Flow

```
Application Submitted
   ↓
Collect Scoring Data
   ├─ Bank Account Data
   ├─ Utility/Telecom Data
   ├─ Rent Payment Data
   ├─ Behavioral Data
   ├─ Digital Footprint (with consent)
   └─ Transactional Data
   ↓
Calculate Weighted Score
   ├─ Traditional Bureau (30%)
   ├─ Alternative Financial (40%) - AI-powered
   └─ Behavioral & Digital (30%)
   ↓
Store Results
   ├─ creditScore
   ├─ scoringDetails (full breakdown)
   └─ creditScoreCalculatedAt
   ↓
Auto-Update Status (if applicable)
   - High score (>= 700) → UNDER_REVIEW
```

---

## Usage Examples

### Example 1: Submit with Credit Scoring

```typescript
// Submit application with scoring data
const response = await axios.post(
  `/loan-applications/${applicationId}/submit`,
  {
    scoringData: {
      bankAccountData: {
        transactions: [
          { date: '2024-01-15', amount: 5000, category: 'SALARY' },
          { date: '2024-01-10', amount: -800, category: 'GROCERIES' },
        ],
      },
      utilityTelecomData: {
        payments: [
          { date: '2024-01-05', amount: 100, daysLate: 0, utilityType: 'ELECTRICITY' },
        ],
        accounts: [{ startDate: '2022-01-01', type: 'ELECTRICITY' }],
      },
      rentPaymentData: {
        payments: [{ date: '2024-01-01', amount: 1200, daysLate: 0 }],
        verified: true,
      },
      behavioralData: {
        completionRate: 1.0,
        typingConsistency: 0.85,
        authentic: true,
      },
      digitalFootprintData: {
        consent: true,
        professionalStrength: 0.8,
        educationVerified: true,
      },
    },
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log(`Credit Score: ${response.data.creditScore}`);
console.log(`Risk Tier: ${response.data.scoringDetails.riskTier}`);
```

### Example 2: Calculate Score Separately

```typescript
// Calculate credit score after submission
const response = await axios.post(
  `/loan-applications/${applicationId}/calculate-credit-score`,
  {
    scoringData: {
      // ... scoring data
    },
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

// Use score for decision making
if (response.data.creditScore >= 750) {
  // Auto-approve
  await axios.post(`/loan-applications/${applicationId}/approve`);
} else if (response.data.creditScore >= 600) {
  // Manual review
  // Status already updated to UNDER_REVIEW
} else {
  // Requires additional review
}
```

### Example 3: Service-Level Integration

```typescript
// In your service
async processApplication(applicationId: string, companyId: string) {
  const application = await this.applicationService.findOne(applicationId, companyId);
  
  // Collect scoring data from various sources
  const scoringData = {
    bankAccountData: await this.getBankAccountData(application),
    utilityTelecomData: await this.getUtilityData(application),
    rentPaymentData: await this.getRentData(application),
    behavioralData: await this.getBehavioralData(application),
    digitalFootprintData: await this.getDigitalFootprint(application),
    transactionalData: await this.getTransactionalData(application),
  };
  
  // Calculate credit score
  const scoredApplication = await this.applicationService.calculateCreditScore(
    applicationId,
    companyId,
    scoringData,
  );
  
  // Use score for decision
  if (scoredApplication.creditScore >= 750) {
    return await this.applicationService.autoApproveIfEligible(applicationId, companyId);
  }
  
  return scoredApplication;
}
```

---

## Auto-Status Updates

The system automatically updates application status based on credit score:

- **Score >= 700**: Status changes from `SUBMITTED` → `UNDER_REVIEW`
- **Score < 700**: Status remains `SUBMITTED` (requires manual review)

This helps prioritize high-scoring applications for faster processing.

---

## Auto-Approval (Optional)

High-scoring applications (>= 750) can be auto-approved:

```typescript
// Check if eligible for auto-approval
const autoApproved = await this.applicationService.autoApproveIfEligible(
  applicationId,
  companyId,
);

if (autoApproved) {
  console.log('Application auto-approved based on high credit score');
}
```

---

## Benefits

✅ **Automatic Scoring** - Credit score calculated on submission  
✅ **Multi-Source Data** - Uses traditional, alternative, and behavioral data  
✅ **AI-Powered** - Advanced analysis for alternative financial data  
✅ **Auto-Prioritization** - High scores automatically move to review  
✅ **Complete Audit Trail** - Full scoring details stored in application  
✅ **Explainable** - Human-readable explanations for every score  

---

## Database Migration

The entity changes require a database migration:

```sql
ALTER TABLE loan_applications
ADD COLUMN credit_score INT NULL,
ADD COLUMN scoring_details JSON NULL,
ADD COLUMN credit_score_calculated_at TIMESTAMP NULL;
```

Or use TypeORM migrations:
```bash
npm run typeorm:generate-migration AddCreditScoringToLoanApplication
npm run typeorm:run-migrations
```

---

## Testing

### Test Submission with Scoring

```bash
curl -X POST http://localhost:3000/loan-applications/{id}/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scoringData": {
      "bankAccountData": {
        "transactions": [
          {
            "date": "2024-01-15",
            "amount": 5000,
            "category": "SALARY"
          }
        ]
      }
    }
  }'
```

### Test Credit Score Calculation

```bash
curl -X POST http://localhost:3000/loan-applications/{id}/calculate-credit-score \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scoringData": {
      "bankAccountData": {...},
      "utilityTelecomData": {...}
    }
  }'
```

---

## Next Steps

1. ✅ **Integration Complete** - Scoring engine integrated
2. **Data Collection** - Connect to real data sources (bank APIs, utilities, etc.)
3. **Workflow Integration** - Add scoring to workflow rules
4. **Notifications** - Notify applicants of credit score
5. **Reporting** - Add scoring metrics to dashboards
6. **A/B Testing** - Test different weight configurations

---

**Status**: ✅ **Fully Integrated**

The weighted credit scoring engine is now fully integrated into the loan application flow!

