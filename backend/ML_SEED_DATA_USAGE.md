# ML Training Data Seed - Usage Guide

## Overview

The ML Training Data Seed script generates realistic historical training data for ML model training. It can generate thousands of samples with different risk profiles and optionally train models automatically.

## Quick Start

### Generate Training Data Only

```bash
npm run seed:ml-training-data -- --count=10000 --output=./data/training-data.json
```

### Generate and Train Model

```bash
npm run seed:ml-training-data -- --count=5000 --train
```

### Generate, Train, and Auto-Activate

```bash
npm run seed:ml-training-data -- --count=10000 --train --activate --traffic=10
```

## Command Line Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--count=N` | Number of samples to generate | 10000 | `--count=5000` |
| `--output=PATH` | Save data to JSON file | None (API only) | `--output=./data/training.json` |
| `--train` | Train model after generation | false | `--train` |
| `--activate` | Auto-activate trained model | false | `--activate` |
| `--traffic=N` | Traffic percentage for A/B testing | 0 | `--traffic=10` |
| `--model-type=TYPE` | Model type to train | `credit_score` | `--model-type=credit_score` |

## Examples

### 1. Generate 50,000 samples for large dataset

```bash
npm run seed:ml-training-data -- --count=50000 --output=./data/large-dataset.json
```

### 2. Quick model training with 5,000 samples

```bash
npm run seed:ml-training-data -- --count=5000 --train
```

### 3. Production-ready model with A/B testing

```bash
npm run seed:ml-training-data -- --count=20000 --train --activate --traffic=5
```

This will:
- Generate 20,000 training samples
- Train a new model
- Activate it with 5% traffic for A/B testing

### 4. Generate data for analysis

```bash
npm run seed:ml-training-data -- --count=1000 --output=./analysis/sample-data.json
```

## Generated Data Structure

Each sample includes:

### Features
- **Traditional Bureau**: Credit score, payment history, credit limits, public records
- **Alternative Financial**: Income, savings, debt, transaction history, utility/rent payments
- **Behavioral**: Application completeness, time to complete, device consistency, digital footprint
- **Employment**: Employment history with duration and stability
- **Risk Indicators**: Bankruptcy, foreclosure, collections, late payments, high debt flags

### Target
- Credit score (300-850 range) calculated based on feature correlations

## Risk Distribution

Default distribution:
- **High Risk**: 20% (credit scores 300-580)
- **Medium Risk**: 40% (credit scores 580-700)
- **Low Risk**: 40% (credit scores 700-850)

## Model Training

When using `--train`, the script will:
1. Generate training data
2. Train a model with default hyperparameters:
   - `maxDepth`: 6
   - `learningRate`: 0.1
   - `nEstimators`: 100
3. Display training metrics (MAE, RMSE, R², Accuracy)
4. Optionally activate the model for A/B testing

## Output

### Console Output
```
🌱 Starting ML Training Data Generation...
📊 Sample Count: 10,000
📁 Output: ./data/training-data.json
🤖 Train Model: Yes
🚀 Auto-Activate: Yes
📈 Traffic Percentage: 10%

📦 Generating training samples...
✅ Generated 10,000 samples in 2.45s
📋 Features: 18 features
💾 Saved to: /path/to/data/training-data.json
📏 File size: 15.23 MB

🤖 Training ML model...
✅ Model trained: credit_score-1.0.1
⏱️  Training time: 1.23s
📊 Metrics:
   - MAE: 22.5
   - RMSE: 28.3
   - R²: 0.82
   - Accuracy: 87.0%

🚀 Activating model with 10% traffic...
✅ Model activated: credit_score-1.0.1

✅ Seed data generation completed successfully!
```

### JSON File Structure
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
  "featureNames": [
    "creditScore",
    "monthlyIncome",
    ...
  ]
}
```

## API Alternative

You can also use the API endpoints directly:

### Generate Seed Data
```bash
POST /api/credit-scoring-engine/ml-models/generate-seed-data
{
  "sampleCount": 10000,
  "riskDistribution": {
    "high": 0.2,
    "medium": 0.4,
    "low": 0.4
  }
}
```

### Generate and Train
```bash
POST /api/credit-scoring-engine/ml-models/generate-and-train
{
  "sampleCount": 5000,
  "modelType": "credit_score",
  "autoActivate": true,
  "trafficPercentage": 10
}
```

## Performance

- **Generation Speed**: ~4,000 samples/second
- **Memory Usage**: ~1.5 MB per 1,000 samples
- **File Size**: ~1.5 MB per 1,000 samples (JSON)

## Best Practices

1. **Start Small**: Test with 1,000-5,000 samples first
2. **Scale Up**: Use 10,000-50,000 for production models
3. **Save Data**: Always use `--output` for large datasets
4. **A/B Testing**: Start with 5-10% traffic when activating
5. **Monitor Metrics**: Check MAE, RMSE, and R² after training

## Troubleshooting

### Out of Memory
- Reduce `--count` value
- Generate in batches and combine later

### Slow Generation
- Normal for large datasets (>50k samples)
- Consider generating in background

### Model Training Fails
- Ensure sufficient samples (minimum 1,000 recommended)
- Check that risk distribution is balanced

