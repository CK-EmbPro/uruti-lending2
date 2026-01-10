/**
 * ML Scoring Engine - Usage Examples
 * 
 * This file contains example code showing how to use the ML scoring engine
 * in your application services.
 */

import { WeightedCreditScoringService } from '../services/weighted-credit-scoring.service';
import { MLModelTrainingService } from '../services/ml-model-training.service';
import { MLScoringService } from '../services/ml-scoring.service';
import { ModelType } from '../dto/ml-model.dto';

/**
 * Example 1: Calculate credit score with ML enhancement
 */
export async function exampleCalculateScore(
  weightedScoringService: WeightedCreditScoringService,
  applicantId: string,
  companyId: string,
) {
  const request = {
    applicantId,
    creditBureauData: {
      creditScore: 720,
      paymentHistory: [
        { date: new Date('2024-01-01'), status: 'ON_TIME' },
        { date: new Date('2023-12-01'), status: 'ON_TIME' },
        { date: new Date('2023-11-01'), status: 'ON_TIME' },
      ],
      totalCreditLimit: 50000,
      totalCreditUsed: 15000,
      publicRecords: [],
    },
    bankAccountData: {
      transactions: [
        { date: '2024-01-15', amount: 5000, category: 'SALARY' },
        { date: '2024-01-10', amount: -500, category: 'GROCERIES' },
        { date: '2024-01-05', amount: -200, category: 'UTILITIES' },
      ],
      averageMonthlyIncome: 5000,
      averageMonthlySavings: 1000,
      totalDebt: 10000,
    },
    utilityTelecomData: {
      payments: [
        { date: '2024-01-05', amount: 100, daysLate: 0, utilityType: 'ELECTRICITY' },
        { date: '2023-12-05', amount: 95, daysLate: 0, utilityType: 'ELECTRICITY' },
      ],
      accounts: [
        { startDate: '2022-01-01', type: 'ELECTRICITY' },
      ],
    },
    behavioralData: {
      completionRate: 1.0,
      typingConsistency: 0.85,
      authentic: true,
      timeSpentSeconds: 600,
    },
    useML: true, // Enable ML scoring
  };

  const result = await weightedScoringService.calculateWeightedScore(
    request,
    companyId,
    true, // useML
  );

  console.log('Final Score:', result.finalScore);
  console.log('Risk Tier:', result.riskTier);
  console.log('Confidence:', result.confidence);
  
  if (result.mlScore) {
    console.log('ML Score:', result.mlScore.score);
    console.log('ML Confidence:', result.mlScore.confidence);
    console.log('Top Features:', 
      Object.entries(result.mlScore.featureImportance)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([key, value]) => `${key}: ${value.toFixed(2)}%`)
    );
    console.log('Risk Factors:', result.mlScore.riskFactors);
  }

  return result;
}

/**
 * Example 2: Train a new model
 */
export async function exampleTrainModel(
  modelTrainingService: MLModelTrainingService,
) {
  // Generate sample training data
  const trainingData = {
    samples: Array.from({ length: 1000 }, (_, i) => ({
      features: {
        creditScore: 300 + Math.random() * 550,
        monthlyIncome: 2000 + Math.random() * 8000,
        totalDebt: Math.random() * 50000,
        paymentHistory: Array.from({ length: 12 }, () => ({
          date: new Date(),
          onTime: Math.random() > 0.2,
        })),
      },
      target: 300 + Math.random() * 550, // Target credit score
    })),
    featureNames: ['creditScore', 'monthlyIncome', 'totalDebt', 'paymentHistory'],
  };

  const model = await modelTrainingService.trainModel(
    trainingData,
    ModelType.CREDIT_SCORE,
    {
      maxDepth: 6,
      learningRate: 0.1,
      nEstimators: 100,
    },
  );

  console.log('Model trained:', model.id);
  console.log('Version:', model.version);
  console.log('Metrics:', model.metrics);
  console.log('Is Active:', model.isActive);

  return model;
}

/**
 * Example 3: A/B Testing setup
 */
export async function exampleABTesting(
  modelTrainingService: MLModelTrainingService,
) {
  // Train new model
  const newModel = await exampleTrainModel(modelTrainingService);

  // Activate with 20% traffic (gradual rollout)
  modelTrainingService.setActiveModel(ModelType.CREDIT_SCORE, newModel.id, 20);

  console.log('A/B Testing activated:');
  console.log('- New model:', newModel.id);
  console.log('- Traffic percentage: 20%');
  console.log('- 20% of users will use new model');
  console.log('- 80% of users will use previous model');

  // Monitor performance
  setTimeout(async () => {
    const metrics = modelTrainingService.getModelMetrics(newModel.id);
    console.log('Model metrics after 100 predictions:', metrics);
  }, 10000);

  return newModel;
}

/**
 * Example 4: Compare models
 */
export async function exampleCompareModels(
  modelTrainingService: MLModelTrainingService,
  version1: string,
  version2: string,
) {
  const comparison = modelTrainingService.compareModels(version1, version2);

  console.log('Model Comparison:');
  console.log('Version 1:', comparison.version1.id);
  console.log('  - RMSE:', comparison.version1.metrics.rmse);
  console.log('  - R²:', comparison.version1.metrics.r2);
  console.log('  - Accuracy:', comparison.version1.metrics.accuracy);
  
  console.log('Version 2:', comparison.version2.id);
  console.log('  - RMSE:', comparison.version2.metrics.rmse);
  console.log('  - R²:', comparison.version2.metrics.r2);
  console.log('  - Accuracy:', comparison.version2.metrics.accuracy);
  
  console.log('Winner:', comparison.winner);
  console.log('Improvement:');
  console.log('  - RMSE:', comparison.improvement.rmseImprovement.toFixed(2) + '%');
  console.log('  - R²:', comparison.improvement.r2Improvement.toFixed(2) + '%');
  console.log('  - Accuracy:', comparison.improvement.accuracyImprovement.toFixed(2) + '%');
  console.log('  - Overall:', comparison.improvement.overallImprovement.toFixed(2) + '%');

  return comparison;
}

/**
 * Example 5: Direct ML scoring
 */
export async function exampleDirectMLScoring(
  mlScoringService: MLScoringService,
  userId: string,
) {
  const features = {
    creditScore: 720,
    monthlyIncome: 5000,
    monthlySavings: 1000,
    totalDebt: 10000,
    paymentHistory: [
      { date: new Date('2024-01-01'), onTime: true },
      { date: new Date('2023-12-01'), onTime: true },
      { date: new Date('2023-11-01'), onTime: true },
    ],
    incomeHistory: [
      { date: new Date('2024-01-01'), amount: 5000 },
      { date: new Date('2023-12-01'), amount: 5000 },
      { date: new Date('2023-11-01'), amount: 4800 },
    ],
    employmentHistory: [
      { company: 'Tech Corp', durationMonths: 24 },
    ],
    applicationCompleteness: 1.0,
    timeToComplete: 10,
  };

  const result = await mlScoringService.calculateMLScore(features, userId);

  console.log('ML Score:', result.score);
  console.log('Confidence:', result.confidence);
  console.log('Model Version:', result.modelVersion);
  console.log('Feature Importance:', result.featureImportance);
  console.log('Risk Factors:', result.riskFactors);

  return result;
}

/**
 * Example 6: Complete workflow
 */
export async function exampleCompleteWorkflow(
  weightedScoringService: WeightedCreditScoringService,
  modelTrainingService: MLModelTrainingService,
  applicantId: string,
  companyId: string,
) {
  console.log('=== Complete ML Scoring Workflow ===\n');

  // Step 1: Calculate initial score
  console.log('Step 1: Calculating initial score...');
  const initialScore = await exampleCalculateScore(
    weightedScoringService,
    applicantId,
    companyId,
  );
  console.log('Initial Score:', initialScore.finalScore);
  console.log('');

  // Step 2: Train new model (if needed)
  console.log('Step 2: Training new model...');
  const newModel = await exampleTrainModel(modelTrainingService);
  console.log('New Model ID:', newModel.id);
  console.log('');

  // Step 3: Activate model with A/B testing
  console.log('Step 3: Activating model with 50% traffic...');
  modelTrainingService.setActiveModel(ModelType.CREDIT_SCORE, newModel.id, 50);
  console.log('Model activated');
  console.log('');

  // Step 4: Recalculate score (will use A/B testing)
  console.log('Step 4: Recalculating score with A/B testing...');
  const newScore = await exampleCalculateScore(
    weightedScoringService,
    applicantId,
    companyId,
  );
  console.log('New Score:', newScore.finalScore);
  if (newScore.mlScore) {
    console.log('ML Model Used:', newScore.mlScore.modelVersion);
  }
  console.log('');

  // Step 5: Compare models
  const activeModel = modelTrainingService.getActiveModel(ModelType.CREDIT_SCORE);
  if (activeModel) {
    console.log('Step 5: Comparing models...');
    const comparison = await exampleCompareModels(
      modelTrainingService,
      'v1.0.0-default',
      activeModel.id,
    );
    console.log('');
  }

  console.log('=== Workflow Complete ===');
  
  return {
    initialScore,
    newScore,
    model: newModel,
  };
}

