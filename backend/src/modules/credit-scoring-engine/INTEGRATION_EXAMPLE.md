# Credit Scoring Engine - Integration Example

## Quick Start

### 1. Using the API Endpoint

```bash
POST /credit-scoring-engine/calculate-weighted-score
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicantId": "uuid-of-applicant",
  "applicationId": "uuid-of-application",
  "bankAccountData": {
    "transactions": [
      {
        "date": "2024-01-15",
        "amount": 1500,
        "category": "SALARY",
        "description": "Monthly salary deposit"
      },
      {
        "date": "2024-01-10",
        "amount": -500,
        "category": "GROCERIES",
        "description": "Grocery store purchase"
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
      },
      {
        "date": "2023-12-05",
        "amount": 95,
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
      },
      {
        "date": "2023-12-01",
        "amount": 1200,
        "daysLate": 0
      }
    ],
    "verified": true
  },
  "behavioralData": {
    "completionRate": 1.0,
    "typingConsistency": 0.85,
    "typingSpeed": 0.7,
    "authentic": true,
    "timeSpentSeconds": 600
  },
  "digitalFootprintData": {
    "consent": true,
    "professionalStrength": 0.8,
    "presenceStability": 0.75,
    "educationVerified": true
  },
  "transactionalData": {
    "transactions": [
      {
        "merchantCategory": "GROCERIES",
        "timeOfDay": "14:30",
        "location": "New York, NY"
      }
    ],
    "timeConsistency": 0.8,
    "geographicConsistency": 0.9
  }
}
```

### 2. Using in a Service

```typescript
import { Injectable } from '@nestjs/common';
import { WeightedCreditScoringService } from '../credit-scoring-engine/services/weighted-credit-scoring.service';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';

@Injectable()
export class LoanApplicationService {
  constructor(
    private readonly weightedScoring: WeightedCreditScoringService,
    // ... other dependencies
  ) {}

  async processApplication(applicationId: string, companyId: string) {
    // Get application
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, companyId },
    });

    // Collect data for scoring
    const scoringRequest = {
      applicantId: application.applicantId,
      applicationId: application.id,
      bankAccountData: await this.collectBankAccountData(application),
      utilityTelecomData: await this.collectUtilityData(application),
      rentPaymentData: await this.collectRentData(application),
      behavioralData: await this.collectBehavioralData(application),
      digitalFootprintData: await this.collectDigitalFootprint(application),
      transactionalData: await this.collectTransactionalData(application),
    };

    // Calculate weighted score
    const scoringResult = await this.weightedScoring.calculateWeightedScore(
      scoringRequest,
      companyId,
    );

    // Use the score for decision making
    if (scoringResult.finalScore >= 700) {
      // Approve
      application.status = ApplicationStatus.APPROVED;
    } else if (scoringResult.finalScore >= 600) {
      // Conditional approval
      application.status = ApplicationStatus.CONDITIONAL_APPROVAL;
    } else {
      // Refer for manual review
      application.status = ApplicationStatus.UNDER_REVIEW;
    }

    // Store scoring result
    application.creditScore = scoringResult.finalScore;
    application.scoringDetails = scoringResult;

    await this.applicationRepository.save(application);

    return {
      application,
      scoringResult,
    };
  }

  private async collectBankAccountData(application: LoanApplication) {
    // TODO: Integrate with bank account API or database
    return {
      transactions: [], // Fetch from bank API or database
    };
  }

  private async collectUtilityData(application: LoanApplication) {
    // TODO: Integrate with utility payment data
    return {
      payments: [],
      accounts: [],
    };
  }

  // ... other data collection methods
}
```

### 3. Integration with Credit Assessment Module

```typescript
// In credit-assessment.service.ts
import { WeightedCreditScoringService } from '../credit-scoring-engine/services/weighted-credit-scoring.service';

@Injectable()
export class CreditAssessmentService {
  constructor(
    private readonly weightedScoring: WeightedCreditScoringService,
    // ... other dependencies
  ) {}

  async performCreditDecision(applicationId: string) {
    const application = await this.getApplication(applicationId);

    // Use weighted scoring instead of basic scoring
    const scoringRequest = {
      applicantId: application.applicantId,
      applicationId: application.id,
      // ... collect all data sources
    };

    const scoringResult = await this.weightedScoring.calculateWeightedScore(
      scoringRequest,
      application.companyId,
    );

    // Create credit decision based on weighted score
    const decision = this.createDecision(application, scoringResult);

    return decision;
  }
}
```

---

## Response Format

```typescript
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
      "creditReport": {
        "creditScore": 680,
        "provider": "EXPERIAN"
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
            "cashFlowPatterns": {
              "stability": 0.85,
              "savingsRate": 0.25,
              "incomeTrend": 0.05,
              "expenseTrend": -0.02
            },
            "incomeStability": {
              "score": 0.88,
              "prediction": "STABLE",
              "confidence": 0.9
            },
            "spendingBehavior": {
              "riskLevel": "LOW",
              "categories": { "GROCERIES": 500 },
              "totalExpense": 1500
            }
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

## Testing

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WeightedCreditScoringService } from './weighted-credit-scoring.service';

describe('WeightedCreditScoringService', () => {
  let service: WeightedCreditScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightedCreditScoringService,
        // Mock dependencies
      ],
    }).compile();

    service = module.get<WeightedCreditScoringService>(WeightedCreditScoringService);
  });

  it('should calculate weighted score', async () => {
    const request = {
      applicantId: 'test-id',
      bankAccountData: {
        transactions: [
          { date: '2024-01-15', amount: 1500, category: 'SALARY' },
        ],
      },
    };

    const result = await service.calculateWeightedScore(request, 'company-id');

    expect(result.finalScore).toBeGreaterThanOrEqual(300);
    expect(result.finalScore).toBeLessThanOrEqual(850);
    expect(result.scoreBreakdown.traditional).toBeDefined();
    expect(result.scoreBreakdown.alternative).toBeDefined();
    expect(result.scoreBreakdown.behavioral).toBeDefined();
  });
});
```

---

## Next Steps

1. **Integrate Data Sources**: Connect to actual bank APIs, utility providers, etc.
2. **Enhance AI Models**: Replace rule-based logic with actual ML models
3. **Add Caching**: Implement Redis caching for performance
4. **Add Monitoring**: Track scoring performance and accuracy
5. **A/B Testing**: Test different weight configurations

---

**Ready to use!** The weighted credit scoring engine is fully integrated and ready for testing.

