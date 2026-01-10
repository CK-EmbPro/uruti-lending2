import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelType } from '../dto/ml-model.dto';

/**
 * ML Model Training Service
 * 
 * Handles:
 * - Model training on historical data
 * - Model versioning
 * - A/B testing
 * - Model performance monitoring
 */
@Injectable()
export class MLModelTrainingService {
  private readonly logger = new Logger(MLModelTrainingService.name);
  
  // Model registry
  private readonly modelRegistry = new Map<string, ModelVersion>();
  private readonly activeModels = new Map<string, string>(); // modelType -> versionId

  constructor(private readonly configService: ConfigService) {
    this.logger.log('ML Model Training Service initialized');
    this.initializeDefaultModels();
  }

  /**
   * Train a new model version
   */
  async trainModel(
    trainingData: TrainingData,
    modelType: ModelType = ModelType.CREDIT_SCORE,
    hyperparameters?: ModelHyperparameters,
  ): Promise<ModelVersion> {
    this.logger.log(`Training ${modelType} model with ${trainingData.samples.length} samples`);

    // Validate training data
    if (!trainingData.samples || trainingData.samples.length === 0) {
      throw new Error('Training data must contain at least one sample');
    }

    if (trainingData.samples.length < 10) {
      this.logger.warn(`Training with only ${trainingData.samples.length} samples. Recommended minimum: 100 samples`);
    }

    // Validate target values
    const invalidTargets = trainingData.samples.filter(
      s => !s.target || s.target < 300 || s.target > 850
    );
    if (invalidTargets.length > 0) {
      this.logger.warn(`${invalidTargets.length} samples have invalid target values (must be 300-850)`);
    }

    try {
      // 1. Data preprocessing
      const processedData = this.preprocessTrainingData(trainingData);
      
      // 2. Feature engineering
      const features = this.engineerTrainingFeatures(processedData);
      
      // 3. Train model (simulated - in production, use actual ML library)
      const model = await this.trainModelInternal(features, hyperparameters);
      
      // 4. Evaluate model
      const metrics = await this.evaluateModel(model, features);
      
      // 5. Create model version
      const version = this.createModelVersion(modelType, model, metrics, hyperparameters);
      
      // 6. Register model
      this.modelRegistry.set(version.id, version);
      
      this.logger.log(`Model ${version.id} trained successfully. Accuracy: ${metrics.accuracy.toFixed(3)}`);
      
      return version;
    } catch (error) {
      this.logger.error(`Model training failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get active model version for a model type
   */
  getActiveModel(modelType: ModelType): ModelVersion | null {
    const versionId = this.activeModels.get(modelType);
    if (!versionId) return null;
    
    return this.modelRegistry.get(versionId) || null;
  }

  /**
   * Set active model version (for A/B testing or model updates)
   */
  setActiveModel(modelType: ModelType, versionId: string, trafficPercentage: number = 100): void {
    // Validate traffic percentage
    if (trafficPercentage < 0 || trafficPercentage > 100) {
      throw new Error('Traffic percentage must be between 0 and 100');
    }

    const version = this.modelRegistry.get(versionId);
    if (!version) {
      throw new Error(`Model version ${versionId} not found`);
    }
    
    if (version.modelType !== modelType) {
      throw new Error(`Model version type mismatch: expected ${modelType}, got ${version.modelType}`);
    }

    // Deactivate previous model if activating with 100% traffic
    if (trafficPercentage === 100) {
      const previousActiveId = this.activeModels.get(modelType);
      if (previousActiveId && previousActiveId !== versionId) {
        const previousVersion = this.modelRegistry.get(previousActiveId);
        if (previousVersion) {
          previousVersion.isActive = false;
          previousVersion.trafficPercentage = 0;
          this.logger.log(`Deactivated previous model ${previousActiveId}`);
        }
      }
    }
    
    this.activeModels.set(modelType, versionId);
    version.trafficPercentage = trafficPercentage;
    version.isActive = true;
    version.activatedAt = new Date();
    
    this.logger.log(`Activated model ${versionId} for ${modelType} (${trafficPercentage}% traffic)`);
  }

  /**
   * Get model version for A/B testing
   */
  getModelForABTest(modelType: ModelType, userId?: string): ModelVersion | null {
    const activeVersionId = this.activeModels.get(modelType);
    if (!activeVersionId) return null;
    
    const activeVersion = this.modelRegistry.get(activeVersionId);
    if (!activeVersion) return null;
    
    // Simple A/B test: use user hash to determine which model
    if (userId && activeVersion.trafficPercentage < 100) {
      const userHash = this.hashUserId(userId);
      const useNewModel = (userHash % 100) < activeVersion.trafficPercentage;
      
      if (!useNewModel) {
        // Use previous version
        const previousVersion = this.getPreviousVersion(modelType, activeVersionId);
        return previousVersion || activeVersion;
      }
    }
    
    return activeVersion;
  }

  /**
   * Log prediction for model monitoring
   */
  async logPrediction(
    versionId: string,
    features: any,
    prediction: number,
    actual?: number,
  ): Promise<void> {
    const version = this.modelRegistry.get(versionId);
    if (!version) return;
    
    version.predictionCount++;
    
    if (actual !== undefined) {
      const error = Math.abs(prediction - actual);
      version.totalError += error;
      version.squaredError += error * error;
      
      // Update metrics
      version.metrics.mae = version.totalError / version.predictionCount;
      version.metrics.rmse = Math.sqrt(version.squaredError / version.predictionCount);
      
      // Update accuracy if binary classification
      if (version.metrics.accuracy !== undefined) {
        const correct = Math.abs(prediction - actual) < 50; // Within 50 points
        version.metrics.accuracy = 
          ((version.metrics.accuracy * (version.predictionCount - 1)) + (correct ? 1 : 0)) / version.predictionCount;
      }
    }
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(versionId: string): ModelMetrics | null {
    const version = this.modelRegistry.get(versionId);
    if (!version) return null;
    
    return {
      ...version.metrics,
      predictionCount: version.predictionCount,
      lastUpdated: version.lastUpdated,
    };
  }

  /**
   * Compare model versions
   */
  compareModels(versionId1: string, versionId2: string): ModelComparison {
    const v1 = this.modelRegistry.get(versionId1);
    const v2 = this.modelRegistry.get(versionId2);
    
    if (!v1 || !v2) {
      throw new Error('One or both model versions not found');
    }
    
    return {
      version1: {
        id: v1.id,
        metrics: v1.metrics,
        predictionCount: v1.predictionCount,
      },
      version2: {
        id: v2.id,
        metrics: v2.metrics,
        predictionCount: v2.predictionCount,
      },
      winner: this.determineWinner(v1, v2),
      improvement: this.calculateImprovement(v1, v2),
    };
  }

  // Private methods

  private initializeDefaultModels(): void {
    // Initialize with default model version
    const defaultVersion: ModelVersion = {
      id: 'v1.0.0-default',
      modelType: ModelType.CREDIT_SCORE,
      version: '1.0.0',
      model: null, // In production, this would be the actual model
      metrics: {
        accuracy: 0.85,
        mae: 25.5,
        rmse: 32.1,
        r2: 0.78,
      },
      hyperparameters: {},
      isActive: true,
      trafficPercentage: 100,
      createdAt: new Date(),
      activatedAt: new Date(),
      predictionCount: 0,
      totalError: 0,
      squaredError: 0,
      lastUpdated: new Date(),
    };
    
    this.modelRegistry.set(defaultVersion.id, defaultVersion);
    this.activeModels.set(ModelType.CREDIT_SCORE, defaultVersion.id);
  }

  private preprocessTrainingData(data: TrainingData): ProcessedTrainingData {
    // Remove outliers
    const cleanedSamples = data.samples.filter(sample => {
      const score = sample.target;
      return score >= 300 && score <= 850; // Valid credit score range
    });
    
    // Handle missing values
    const processed = cleanedSamples.map(sample => ({
      ...sample,
      features: this.fillMissingValues(sample.features),
    }));
    
    return {
      samples: processed,
      featureNames: data.featureNames || [],
    };
  }

  private engineerTrainingFeatures(data: ProcessedTrainingData): EngineeredTrainingData {
    // Apply same feature engineering as inference
    const engineered = data.samples.map(sample => ({
      ...sample,
      features: {
        ...sample.features,
        // Add derived features
        debtToIncomeRatio: this.calculateDebtToIncome(sample.features),
        savingsRate: this.calculateSavingsRate(sample.features),
        paymentConsistency: this.calculatePaymentConsistency(sample.features),
      },
    }));
    
    return {
      samples: engineered,
      featureNames: [...data.featureNames, 'debtToIncomeRatio', 'savingsRate', 'paymentConsistency'],
    };
  }

  private async trainModelInternal(
    data: EngineeredTrainingData,
    hyperparameters?: ModelHyperparameters,
  ): Promise<any> {
    // Simulate model training
    // In production, this would:
    // 1. Split data into train/validation/test sets
    // 2. Train XGBoost/LightGBM model
    // 3. Tune hyperparameters
    // 4. Return trained model
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate training time
    
    return {
      type: 'xgboost',
      hyperparameters: hyperparameters || {
        maxDepth: 6,
        learningRate: 0.1,
        nEstimators: 100,
      },
      featureImportance: this.calculateFeatureImportance(data),
    };
  }

  private async evaluateModel(model: any, data: EngineeredTrainingData): Promise<ModelMetrics> {
    // Simulate model evaluation
    // In production, this would:
    // 1. Run predictions on validation set
    // 2. Calculate metrics (MAE, RMSE, R2, Accuracy)
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulated metrics based on model quality
    return {
      accuracy: 0.85 + Math.random() * 0.1, // 0.85-0.95
      mae: 20 + Math.random() * 10, // 20-30
      rmse: 25 + Math.random() * 10, // 25-35
      r2: 0.75 + Math.random() * 0.15, // 0.75-0.90
    };
  }

  private createModelVersion(
    modelType: ModelType,
    model: any,
    metrics: ModelMetrics,
    hyperparameters?: ModelHyperparameters,
  ): ModelVersion {
    const version = this.getNextVersion(modelType);
    
    return {
      id: `${modelType}-${version}`,
      modelType,
      version,
      model,
      metrics,
      hyperparameters: hyperparameters || {},
      isActive: false,
      trafficPercentage: 0,
      createdAt: new Date(),
      predictionCount: 0,
      totalError: 0,
      squaredError: 0,
      lastUpdated: new Date(),
    };
  }

  private getNextVersion(modelType: ModelType): string {
    const versions = Array.from(this.modelRegistry.values())
      .filter(v => v.modelType === modelType)
      .map(v => v.version)
      .sort();
    
    if (versions.length === 0) return '1.0.0';
    
    const lastVersion = versions[versions.length - 1];
    const [major, minor, patch] = lastVersion.split('.').map(Number);
    
    // Increment patch version
    return `${major}.${minor}.${patch + 1}`;
  }

  private getPreviousVersion(modelType: ModelType, currentVersionId: string): ModelVersion | null {
    const currentVersion = this.modelRegistry.get(currentVersionId);
    if (!currentVersion) return null;
    
    const versions = Array.from(this.modelRegistry.values())
      .filter(v => v.modelType === modelType && v.id !== currentVersionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return versions.length > 0 ? versions[0] : null;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private determineWinner(v1: ModelVersion, v2: ModelVersion): string {
    // Compare based on RMSE (lower is better)
    if (v1.metrics.rmse < v2.metrics.rmse) return v1.id;
    if (v2.metrics.rmse < v1.metrics.rmse) return v2.id;
    
    // If RMSE is similar, compare R2 (higher is better)
    if (v1.metrics.r2 > v2.metrics.r2) return v1.id;
    if (v2.metrics.r2 > v1.metrics.r2) return v2.id;
    
    // If still tied, prefer version with more predictions
    return v1.predictionCount > v2.predictionCount ? v1.id : v2.id;
  }

  private calculateImprovement(v1: ModelVersion, v2: ModelVersion): ModelImprovement {
    const rmseImprovement = ((v2.metrics.rmse - v1.metrics.rmse) / v2.metrics.rmse) * 100;
    const r2Improvement = ((v1.metrics.r2 - v2.metrics.r2) / v2.metrics.r2) * 100;
    const accuracyImprovement = ((v1.metrics.accuracy - v2.metrics.accuracy) / v2.metrics.accuracy) * 100;
    
    return {
      rmseImprovement: -rmseImprovement, // Negative because lower RMSE is better
      r2Improvement,
      accuracyImprovement,
      overallImprovement: (r2Improvement + accuracyImprovement - rmseImprovement) / 3,
    };
  }

  private fillMissingValues(features: Record<string, any>): Record<string, any> {
    const filled = { ...features };
    
    // Fill missing numeric values with median/mean
    Object.keys(filled).forEach(key => {
      if (filled[key] === null || filled[key] === undefined) {
        // In production, use actual median/mean from training data
        filled[key] = 0.5; // Default normalized value
      }
    });
    
    return filled;
  }

  private calculateDebtToIncome(features: Record<string, any>): number {
    const debt = features.totalDebt || 0;
    const income = features.monthlyIncome || 0;
    return income > 0 ? debt / (income * 12) : 0;
  }

  private calculateSavingsRate(features: Record<string, any>): number {
    const savings = features.monthlySavings || 0;
    const income = features.monthlyIncome || 0;
    return income > 0 ? savings / income : 0;
  }

  private calculatePaymentConsistency(features: Record<string, any>): number {
    const payments = features.paymentHistory || [];
    if (payments.length === 0) return 0.5;
    
    const onTime = payments.filter((p: any) => p.onTime).length;
    return onTime / payments.length;
  }

  private calculateFeatureImportance(data: EngineeredTrainingData): Record<string, number> {
    // Simulate feature importance calculation
    // In production, this would come from the trained model
    const importance: Record<string, number> = {};
    
    data.featureNames.forEach(feature => {
      importance[feature] = Math.random() * 0.2; // 0-0.2
    });
    
    // Normalize to sum to 1
    const total = Object.values(importance).reduce((a, b) => a + b, 0);
    Object.keys(importance).forEach(key => {
      importance[key] = importance[key] / total;
    });
    
    return importance;
  }
}

// Type definitions

export interface TrainingData {
  samples: Array<{
    features: Record<string, any>;
    target: number; // Credit score (300-850)
  }>;
  featureNames?: string[];
}

export interface ProcessedTrainingData {
  samples: Array<{
    features: Record<string, any>;
    target: number;
  }>;
  featureNames: string[];
}

export interface EngineeredTrainingData {
  samples: Array<{
    features: Record<string, any>;
    target: number;
  }>;
  featureNames: string[];
}

export interface ModelHyperparameters {
  maxDepth?: number;
  learningRate?: number;
  nEstimators?: number;
  subsample?: number;
  colsampleByTree?: number;
  [key: string]: any;
}

export interface ModelMetrics {
  accuracy: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  r2: number; // R-squared
  precision?: number;
  recall?: number;
  f1Score?: number;
  predictionCount?: number; // Number of predictions made
  lastUpdated?: Date; // Last update timestamp
}

export interface ModelVersion {
  id: string;
  modelType: ModelType;
  version: string;
  model: any; // Trained model object
  metrics: ModelMetrics;
  hyperparameters: ModelHyperparameters;
  isActive: boolean;
  trafficPercentage: number; // 0-100
  createdAt: Date;
  activatedAt?: Date;
  predictionCount: number;
  totalError: number;
  squaredError: number;
  lastUpdated: Date;
}

export interface ModelComparison {
  version1: {
    id: string;
    metrics: ModelMetrics;
    predictionCount: number;
  };
  version2: {
    id: string;
    metrics: ModelMetrics;
    predictionCount: number;
  };
  winner: string;
  improvement: ModelImprovement;
}

export interface ModelImprovement {
  rmseImprovement: number; // Percentage
  r2Improvement: number; // Percentage
  accuracyImprovement: number; // Percentage
  overallImprovement: number; // Average
}

