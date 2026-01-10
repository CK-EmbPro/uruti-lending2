import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIModel } from '../entities/ai-model.entity';
import { AIPrediction } from '../entities/ai-prediction.entity';
import {
  CreateAIModelDto,
  PredictDto,
  AIModelPrediction,
  AISentimentAnalysis,
  AIModelType,
  PredictionType,
} from '../dto/advanced-ai.dto';
import { ModelStatus } from '../../risk-modeling/dto/risk-modeling.dto';

@Injectable()
export class AdvancedAIService {
  private readonly logger = new Logger(AdvancedAIService.name);

  constructor(
    @InjectRepository(AIModel)
    private modelRepository: Repository<AIModel>,
    @InjectRepository(AIPrediction)
    private predictionRepository: Repository<AIPrediction>,
  ) {}

  async createModel(createDto: CreateAIModelDto): Promise<AIModel> {
    const model = this.modelRepository.create({
      ...createDto,
      status: ModelStatus.TRAINING,
    });

    return this.modelRepository.save(model);
  }

  async findAllModels(modelType?: AIModelType, status?: ModelStatus): Promise<AIModel[]> {
    const where: any = {};
    if (modelType) where.modelType = modelType;
    if (status) where.status = status;

    return this.modelRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneModel(id: string): Promise<AIModel> {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`AI model with ID ${id} not found`);
    }
    return model;
  }

  async predict(predictDto: PredictDto): Promise<AIModelPrediction> {
    const model = await this.findOneModel(predictDto.modelId);

    if (model.status !== ModelStatus.ACTIVE) {
      throw new NotFoundException('Model is not active');
    }

    // TODO: Integrate with actual ML model inference
    // This is a placeholder that simulates prediction
    const prediction = await this.simulatePrediction(model, predictDto.features);
    const confidence = this.calculateConfidence(prediction);

    const aiPrediction = this.predictionRepository.create({
      modelId: model.id,
      entityId: predictDto.entityId,
      predictionType: this.determinePredictionType(model.modelType),
      prediction,
      confidence,
      inputFeatures: predictDto.features,
    });

    const saved = await this.predictionRepository.save(aiPrediction);

    // Update model prediction count
    model.predictionCount += 1;
    await this.modelRepository.save(model);

    return {
      id: saved.id,
      modelId: saved.modelId,
      prediction: Number(saved.prediction),
      confidence: Number(saved.confidence),
      predictionType: saved.predictionType,
      inputFeatures: saved.inputFeatures,
      createdAt: saved.createdAt,
    };
  }

  private async simulatePrediction(model: AIModel, features: Record<string, any>): Promise<number> {
    // Simulate ML model prediction
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simple heuristic-based scoring (replace with actual ML model)
    let score = 0.5;

    if (features.creditScore) {
      score += (800 - features.creditScore) / 800 * 0.3;
    }
    if (features.debtToIncomeRatio) {
      score += Math.min(features.debtToIncomeRatio / 100, 0.3);
    }
    if (features.employmentLength) {
      score -= Math.min(features.employmentLength / 60, 0.2);
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateConfidence(prediction: number): number {
    // Higher confidence when prediction is closer to extremes
    if (prediction <= 0.1 || prediction >= 0.9) return 0.95;
    if (prediction <= 0.2 || prediction >= 0.8) return 0.85;
    return 0.75;
  }

  private determinePredictionType(modelType: AIModelType): PredictionType {
    const typeMap = {
      [AIModelType.PREDICTIVE]: PredictionType.DEFAULT_PROBABILITY,
      [AIModelType.CLASSIFICATION]: PredictionType.FRAUD_PROBABILITY,
    };
    return typeMap[modelType] || PredictionType.DEFAULT_PROBABILITY;
  }

  async analyzeSentiment(text: string): Promise<AISentimentAnalysis> {
    // TODO: Integrate with actual NLP service (e.g., AWS Comprehend, Google NLP)
    // This is a placeholder

    // Simple sentiment analysis (replace with actual NLP)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'poor'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    let sentiment = 'NEUTRAL';
    let score = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = 'POSITIVE';
      score = 0.5 + (positiveCount - negativeCount) * 0.1;
    } else if (negativeCount > positiveCount) {
      sentiment = 'NEGATIVE';
      score = 0.5 - (negativeCount - positiveCount) * 0.1;
    }

    score = Math.max(0, Math.min(1, score));

    // Extract key phrases (simplified)
    const words = text.split(/\s+/).filter(w => w.length > 4);
    const keyPhrases = words.slice(0, 5);

    return {
      sentiment,
      score,
      keyPhrases,
      entities: [],
    };
  }

  async getPredictions(
    modelId?: string,
    entityId?: string,
    limit: number = 100,
  ): Promise<AIPrediction[]> {
    const where: any = {};
    if (modelId) where.modelId = modelId;
    if (entityId) where.entityId = entityId;

    return this.predictionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getModelPerformance(modelId: string): Promise<Record<string, any>> {
    const model = await this.findOneModel(modelId);
    return model.performanceMetrics || {};
  }
}

