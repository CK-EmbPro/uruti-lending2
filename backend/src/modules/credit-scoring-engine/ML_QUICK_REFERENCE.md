# ML Scoring Engine - Quick Reference Guide

## Quick Start

### 1. Calculate Credit Score (with ML)

```bash
POST /api/credit-scoring-engine/calculate-weighted-score
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicantId": "user-123",
  "useML": true,  // Optional, defaults to true
  "creditBureauData": {
    "creditScore": 720,
    "paymentHistory": [...],
    "totalCreditLimit": 50000,
    "totalCreditUsed": 15000
  },
  "bankAccountData": {
    "transactions": [...],
    "averageMonthlyIncome": 5000,
    "averageMonthlySavings": 1000
  }
}
```

**Response includes:**
- `finalScore`: Final credit score (300-850)
- `mlScore`: ML-enhanced score details (if ML was used)
  - `score`: ML score
  - `confidence`: Confidence level
  - `featureImportance`: Feature importance percentages
  - `riskFactors`: Identified risk factors
  - `modelVersion`: Model version used

### 2. Train a New Model

```bash
POST /api/credit-scoring-engine/ml-models/train
Authorization: Bearer <token>
Content-Type: application/json

{
  "samples": [
    {
      "features": {
        "creditScore": 720,
        "monthlyIncome": 5000,
        "totalDebt": 10000,
        "paymentHistory": [...]
      },
      "target": 750
    },
    {
      "features": {
        "creditScore": 650,
        "monthlyIncome": 3000,
        "totalDebt": 15000,
        "paymentHistory": [...]
      },
      "target": 680
    }
  ],
  "modelType": "credit_score",
  "hyperparameters": {
    "maxDepth": 6,
    "learningRate": 0.1,
    "nEstimators": 100
  }
}
```

**Response:**
```json
{
  "id": "credit_score-1.0.1",
  "version": "1.0.1",
  "metrics": {
    "accuracy": 0.87,
    "mae": 22.5,
    "rmse": 28.3,
    "r2": 0.82
  },
  "isActive": false,
  "trafficPercentage": 0
}
```

### 3. Activate Model (A/B Testing)

```bash
POST /api/credit-scoring-engine/ml-models/activate
Authorization: Bearer <token>
Content-Type: application/json

{
  "versionId": "credit_score-1.0.1",
  "trafficPercentage": 50  // 50% of users will use new model
}
```

### 4. Get Active Model

```bash
GET /api/credit-scoring-engine/ml-models/active?modelType=credit_score
Authorization: Bearer <token>
```

### 5. Get Model Metrics

```bash
GET /api/credit-scoring-engine/ml-models/credit_score-1.0.1/metrics
Authorization: Bearer <token>
```

### 6. Compare Models

```bash
GET /api/credit-scoring-engine/ml-models/compare?version1=v1.0.0&version2=v1.0.1
Authorization: Bearer <token>
```

## Feature Engineering

The ML service automatically engineers these features:

1. **Debt-to-Income Ratio**: `totalDebt / (monthlyIncome * 12)`
2. **Savings Rate**: `monthlySavings / monthlyIncome`
3. **Credit Utilization**: `totalCreditUsed / totalCreditLimit`
4. **Payment Consistency**: Percentage of on-time payments
5. **Income Stability**: Coefficient of variation of income history
6. **Cash Flow Volatility**: Variance in monthly cash flows
7. **Employment Stability**: Based on job duration and changes
8. **Account Age**: Age of oldest account in months
9. **Application Quality**: Based on completeness and time spent
10. **Risk Indicators**: Count of risk factors

## ML Score Components

When ML scoring is used, the response includes:

```json
{
  "mlScore": {
    "score": 750,
    "confidence": 0.85,
    "featureImportance": {
      "creditScore": 25.3,
      "paymentHistory": 18.7,
      "incomeStability": 15.2,
      "debtToIncomeRatio": 12.1,
      ...
    },
    "riskFactors": [
      "High credit utilization",
      "Inconsistent payment history"
    ],
    "modelVersion": "1.0.1"
  }
}
```

## Hybrid Scoring

The system uses a hybrid approach:

- **If ML confidence > 0.7**: 70% ML score + 30% rule-based score
- **If ML confidence ≤ 0.7**: 100% rule-based score
- **If ML fails**: Automatic fallback to rule-based

## A/B Testing

Models can be activated with traffic percentage:

- **100%**: All users get new model
- **50%**: Half get new model, half get previous version
- **10%**: Gradual rollout for testing

Users are deterministically routed based on user ID hash.

## Model Versioning

Models are automatically versioned:
- Format: `{modelType}-{major}.{minor}.{patch}`
- Example: `credit_score-1.0.1`
- Semantic versioning for tracking

## Performance Metrics

Models track:
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Squared Error
- **R²**: R-squared (coefficient of determination)
- **Accuracy**: Prediction accuracy
- **Prediction Count**: Number of predictions made

## Best Practices

1. **Start with small traffic**: Activate new models with 10-20% traffic first
2. **Monitor metrics**: Check model performance regularly
3. **Compare before full rollout**: Use compare endpoint to verify improvements
4. **Keep previous version**: Don't delete old models until new one is proven
5. **Train on recent data**: Use recent historical data for training
6. **Feature quality**: Ensure input data quality for better ML predictions

## Troubleshooting

### ML scoring not being used?

1. Check if `useML: true` in request
2. Verify sufficient data is provided
3. Check ML confidence in response
4. Review logs for ML scoring errors

### Model training fails?

1. Ensure minimum 100 samples
2. Check feature data quality
3. Verify target values are in 300-850 range
4. Review hyperparameters

### A/B testing not working?

1. Verify model is activated
2. Check traffic percentage > 0
3. Ensure user ID is provided in scoring request
4. Check model registry for active model

## Example Integration

```typescript
// In your service
import { WeightedCreditScoringService } from './credit-scoring-engine/services/weighted-credit-scoring.service';

async calculateScore(applicationId: string) {
  const request = {
    applicantId: application.id,
    applicationId: application.id,
    creditBureauData: await this.getCreditReport(application),
    bankAccountData: await this.getBankData(application),
    useML: true, // Enable ML scoring
  };
  
  const result = await this.weightedScoringService.calculateWeightedScore(
    request,
    companyId,
  );
  
  // Check if ML was used
  if (result.mlScore) {
    console.log(`ML Score: ${result.mlScore.score}`);
    console.log(`Confidence: ${result.mlScore.confidence}`);
    console.log(`Top Features:`, 
      Object.entries(result.mlScore.featureImportance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    );
  }
  
  return result;
}
```

