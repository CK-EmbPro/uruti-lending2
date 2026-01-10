# Seed Data Generator - Guide

## Overview

The ML Seed Data Generator creates realistic historical training data for ML model training. It generates thousands of samples with different risk profiles, payment histories, and financial behaviors.

## API Endpoints

### 1. Generate Seed Data

```bash
POST /api/credit-scoring-engine/ml-models/generate-seed-data
Authorization: Bearer <token>
Content-Type: application/json

{
  "sampleCount": 10000,
  "includeHighRisk": true,
  "includeLowRisk": true,
  "includeMediumRisk": true,
  "dateRange": {
    "start": "2022-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "riskDistribution": {
    "high": 0.2,
    "medium": 0.4,
    "low": 0.4
  }
}
```

**Response:**
```json
{
  "samples": [
    {
      "features": {
        "creditScore": 720,
        "monthlyIncome": 5000,
        "paymentHistory": [...],
        ...
      },
      "target": 750
    },
    ...
  ],
  "count": 10000,
  "featureNames": ["creditScore", "monthlyIncome", ...]
}
```

### 2. Generate and Train (One-Step)

```bash
POST /api/credit-scoring-engine/ml-models/generate-and-train
Authorization: Bearer <token>
Content-Type: application/json

{
  "sampleCount": 5000,
  "modelType": "credit_score",
  "hyperparameters": {
    "maxDepth": 6,
    "learningRate": 0.1,
    "nEstimators": 100
  },
  "autoActivate": false,
  "trafficPercentage": 0
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
  "isActive": false
}
```

## Risk Profiles

### High-Risk Samples (20% default)
- Credit scores: 300-580
- Payment history: 40% on-time rate
- High debt-to-income ratio
- Low savings
- Multiple risk indicators
- Unstable employment
- Public records

### Low-Risk Samples (40% default)
- Credit scores: 700-850
- Payment history: 95%+ on-time rate
- Low debt-to-income ratio
- Good savings rate
- No risk indicators
- Stable employment
- No public records

### Medium-Risk Samples (40% default)
- Credit scores: 580-700
- Payment history: 75% on-time rate
- Moderate debt-to-income ratio
- Moderate savings
- Some risk indicators
- Mixed employment stability

## Generated Features

Each sample includes:

1. **Traditional Bureau Data:**
   - Credit score
   - Payment history (array of on-time/late payments)
   - Credit limits and utilization
   - Public records count

2. **Alternative Financial Data:**
   - Monthly income and savings
   - Total debt
   - Average account balance
   - Income history (time series)
   - Transaction history
   - Utility payment history
   - Rent payment history

3. **Behavioral Data:**
   - Application completeness
   - Time to complete
   - Device consistency
   - Digital footprint score

4. **Employment Data:**
   - Employment history with durations
   - Job stability indicators

5. **Risk Indicators:**
   - Recent bankruptcy
   - Recent foreclosure
   - Recent collections
   - Recent late payments
   - High debt flag

## Usage Examples

### Generate 10,000 Samples

```typescript
const seedData = await seedDataGenerator.generateBulkTrainingData(10000, {
  dateRange: {
    start: new Date('2022-01-01'),
    end: new Date('2024-12-31'),
  },
  riskDistribution: {
    high: 0.2,
    medium: 0.4,
    low: 0.4,
  },
});
```

### Generate and Train in One Step

```typescript
// Via API
POST /ml-models/generate-and-train
{
  "sampleCount": 5000,
  "autoActivate": true,
  "trafficPercentage": 10  // Start with 10% traffic
}
```

### Custom Risk Distribution

```typescript
// More high-risk samples for fraud detection training
const fraudData = await seedDataGenerator.generateBulkTrainingData(5000, {
  riskDistribution: {
    high: 0.5,    // 50% high-risk
    medium: 0.3,  // 30% medium-risk
    low: 0.2,     // 20% low-risk
  },
});
```

## Best Practices

1. **Sample Size:**
   - Minimum: 100 samples
   - Recommended: 1,000-10,000 samples
   - Large datasets: 10,000+ samples

2. **Risk Distribution:**
   - Balanced: 20% high, 40% medium, 40% low (default)
   - Adjust based on your portfolio
   - Match real-world distribution

3. **Date Range:**
   - Use 2-3 years of historical data
   - Include recent data for better predictions
   - Avoid very old data (>5 years)

4. **Training Workflow:**
   ```bash
   # 1. Generate seed data
   POST /ml-models/generate-seed-data
   
   # 2. Train model
   POST /ml-models/train
   
   # 3. Compare with existing model
   GET /ml-models/compare?version1=v1.0.0&version2=v1.0.1
   
   # 4. Activate if better
   POST /ml-models/activate
   ```

## Data Quality

The generator creates realistic data with:
- ✅ Correlated features (e.g., high income → high savings)
- ✅ Realistic time series (income trends, payment patterns)
- ✅ Proper date ranges and sequences
- ✅ Valid credit score ranges (300-850)
- ✅ Shuffled samples for better training

## Performance

- **Generation Speed:** ~100-1000 samples/second
- **Memory:** Minimal (streaming possible for large datasets)
- **Scalability:** Can generate millions of samples

## Example: Complete Training Workflow

```bash
# Step 1: Generate 10,000 training samples
curl -X POST http://localhost:3000/api/credit-scoring-engine/ml-models/generate-seed-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sampleCount": 10000,
    "riskDistribution": {
      "high": 0.2,
      "medium": 0.4,
      "low": 0.4
    }
  }'

# Step 2: Train model with generated data
curl -X POST http://localhost:3000/api/credit-scoring-engine/ml-models/train \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "samples": [...],  // From step 1
    "modelType": "credit_score",
    "hyperparameters": {
      "maxDepth": 6,
      "learningRate": 0.1
    }
  }'

# Step 3: Activate with 20% traffic (A/B test)
curl -X POST http://localhost:3000/api/credit-scoring-engine/ml-models/activate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "versionId": "credit_score-1.0.1",
    "trafficPercentage": 20
  }'
```

## Quick Start: One-Step Generation and Training

```bash
# Generate data and train model in one call
curl -X POST http://localhost:3000/api/credit-scoring-engine/ml-models/generate-and-train \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sampleCount": 5000,
    "autoActivate": true,
    "trafficPercentage": 10
  }'
```

This will:
1. Generate 5,000 training samples
2. Train a new model
3. Automatically activate it with 10% traffic

