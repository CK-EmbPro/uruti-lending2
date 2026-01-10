import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { RiskModel } from '../entities/risk-model.entity';
import { RiskPrediction } from '../entities/risk-prediction.entity';
import { ModelType, ModelStatus, RiskLevel } from '../dto/risk-modeling.dto';
import { EarlyWarningIndicator } from '../entities/early-warning-indicator.entity';
import {
  CreateRiskModelDto,
  TrainModelDto,
  PredictRiskDto,
  RiskScore,
  ModelPerformance,
  EarlyWarningIndicator as EarlyWarningIndicatorDto,
} from '../dto/risk-modeling.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class RiskModelingService {
  private readonly logger = new Logger(RiskModelingService.name);

  constructor(
    @InjectRepository(RiskModel)
    private riskModelRepository: Repository<RiskModel>,
    @InjectRepository(RiskPrediction)
    private riskPredictionRepository: Repository<RiskPrediction>,
    @InjectRepository(EarlyWarningIndicator)
    private earlyWarningRepository: Repository<EarlyWarningIndicator>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private repaymentRepository: Repository<LoanRepayment>,
  ) {}

  async createModel(createDto: CreateRiskModelDto, userId: string): Promise<RiskModel> {
    const model = this.riskModelRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.riskModelRepository.save(model);
  }

  async findAllModels(modelType?: ModelType, status?: ModelStatus): Promise<RiskModel[]> {
    const where: any = {};
    if (modelType) where.modelType = modelType;
    if (status) where.status = status;

    return this.riskModelRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneModel(id: string): Promise<RiskModel> {
    const model = await this.riskModelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Risk model with ID ${id} not found`);
    }
    return model;
  }

  async getActiveModel(modelType: ModelType): Promise<RiskModel> {
    const model = await this.riskModelRepository.findOne({
      where: {
        modelType,
        status: ModelStatus.ACTIVE,
      },
      order: { activatedAt: 'DESC' },
    });

    if (!model) {
      throw new NotFoundException(`No active model found for type ${modelType}`);
    }

    return model;
  }

  async trainModel(trainDto: TrainModelDto, userId: string): Promise<RiskModel> {
    const model = await this.findOneModel(trainDto.modelId);

    if (model.status === ModelStatus.ACTIVE) {
      throw new BadRequestException('Cannot train an active model. Create a new version instead.');
    }

    model.status = ModelStatus.TRAINING;
    await this.riskModelRepository.save(model);

    try {
      // TODO: Integrate with actual ML training pipeline
      // This is a placeholder that simulates model training
      this.logger.log(`Training model ${model.id}...`);

      // Simulate training process
      await this.simulateModelTraining(model, trainDto);

      // Calculate performance metrics
      const performance = await this.calculateModelPerformance(model.id);

      model.status = ModelStatus.ACTIVE;
      model.lastTrainedAt = new Date();
      model.activatedAt = new Date();
      model.performanceMetrics = performance;
      model.updatedBy = userId;

      return this.riskModelRepository.save(model);
    } catch (error) {
      model.status = ModelStatus.DEPRECATED;
      await this.riskModelRepository.save(model);
      throw error;
    }
  }

  private async simulateModelTraining(model: RiskModel, trainDto: TrainModelDto): Promise<void> {
    // Simulate training delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would:
    // 1. Fetch training data from database
    // 2. Preprocess features
    // 3. Train ML model (scikit-learn, TensorFlow, etc.)
    // 4. Save model to storage
    // 5. Evaluate on test set

    this.logger.log(`Model ${model.id} training completed`);
  }

  private async calculateModelPerformance(modelId: string): Promise<ModelPerformance> {
    // TODO: Calculate actual performance from test set predictions
    // This is a placeholder
    return {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.91,
      f1Score: 0.90,
      aucRoc: 0.94,
      confusionMatrix: {
        truePositive: 850,
        trueNegative: 920,
        falsePositive: 100,
        falseNegative: 80,
      },
    };
  }

  async predictRisk(predictDto: PredictRiskDto): Promise<RiskScore> {
    const model = await this.findOneModel(predictDto.modelId);

    if (model.status !== ModelStatus.ACTIVE) {
      throw new BadRequestException('Model is not active. Cannot make predictions.');
    }

    // TODO: Integrate with actual ML model inference
    // This is a placeholder that simulates prediction
    const riskScore = await this.simulatePrediction(model, predictDto.features);
    const riskLevel = this.determineRiskLevel(riskScore);
    const confidence = this.calculateConfidence(riskScore);
    const riskFactors = this.identifyRiskFactors(predictDto.features);
    const recommendations = this.generateRecommendations(riskLevel, riskFactors);

    // Save prediction
    const prediction = this.riskPredictionRepository.create({
      modelId: model.id,
      loanId: predictDto.loanId,
      customerId: predictDto.customerId,
      riskScore,
      riskLevel,
      confidence,
      inputFeatures: predictDto.features,
      riskFactors,
      recommendations,
      predictionDate: new Date(),
    });

    await this.riskPredictionRepository.save(prediction);

    // Update model prediction count
    model.predictionCount += 1;
    await this.riskModelRepository.save(model);

    return {
      riskScore,
      riskLevel,
      confidence,
      riskFactors,
      recommendations,
    };
  }

  private async simulatePrediction(model: RiskModel, features: Record<string, any>): Promise<number> {
    // Simulate ML model prediction
    // In production, this would load the model and run inference
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simple heuristic-based scoring (replace with actual ML model)
    let score = 0.5; // Base score

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

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 0.75) return RiskLevel.CRITICAL;
    if (riskScore >= 0.50) return RiskLevel.HIGH;
    if (riskScore >= 0.25) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private calculateConfidence(riskScore: number): number {
    // Higher confidence when score is closer to extremes
    if (riskScore <= 0.1 || riskScore >= 0.9) return 0.95;
    if (riskScore <= 0.2 || riskScore >= 0.8) return 0.85;
    return 0.75;
  }

  private identifyRiskFactors(features: Record<string, any>): Array<{ factor: string; impact: number; description: string }> {
    const factors: Array<{ factor: string; impact: number; description: string }> = [];

    if (features.creditScore && features.creditScore < 650) {
      factors.push({
        factor: 'Low Credit Score',
        impact: 0.3,
        description: `Credit score of ${features.creditScore} is below recommended threshold`,
      });
    }

    if (features.debtToIncomeRatio && features.debtToIncomeRatio > 40) {
      factors.push({
        factor: 'High Debt-to-Income Ratio',
        impact: 0.25,
        description: `DTI ratio of ${features.debtToIncomeRatio}% exceeds recommended limit`,
      });
    }

    if (features.employmentLength && features.employmentLength < 12) {
      factors.push({
        factor: 'Short Employment History',
        impact: 0.2,
        description: `Employment length of ${features.employmentLength} months is relatively short`,
      });
    }

    return factors;
  }

  private generateRecommendations(riskLevel: RiskLevel, riskFactors: Array<any>): string[] {
    const recommendations: string[] = [];

    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      recommendations.push('Consider requiring additional collateral');
      recommendations.push('Request additional documentation');
      recommendations.push('Implement stricter monitoring');
    }

    if (riskFactors.some(f => f.factor === 'Low Credit Score')) {
      recommendations.push('Consider credit improvement program');
    }

    if (riskFactors.some(f => f.factor === 'High Debt-to-Income Ratio')) {
      recommendations.push('Recommend debt consolidation options');
    }

    return recommendations;
  }

  async getPredictions(loanId?: string, customerId?: string, limit: number = 100): Promise<RiskPrediction[]> {
    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;

    return this.riskPredictionRepository.find({
      where,
      order: { predictionDate: 'DESC' },
      take: limit,
    });
  }

  async detectEarlyWarnings(loanId: string): Promise<EarlyWarningIndicator[]> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const indicators: EarlyWarningIndicator[] = [];

    // Check payment pattern
    const recentRepayments = await this.repaymentRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
      take: 6,
    });

    if (recentRepayments.length >= 3) {
      // Simplified late payment check - in production, compare with schedule
      const latePayments = recentRepayments.filter(r => {
        // Check if payment was made after due date (simplified)
        return r.postingDate && new Date(r.postingDate) > new Date();
      }).length;

      if (latePayments >= 2) {
        indicators.push(
          this.earlyWarningRepository.create({
            loanId,
            indicatorName: 'Payment Pattern Deterioration',
            severity: RiskLevel.HIGH,
            description: `${latePayments} out of last ${recentRepayments.length} payments were late`,
            indicatorData: { latePayments, totalPayments: recentRepayments.length },
            triggeredDate: new Date(),
          }),
        );
      }
    }

    // Check outstanding amount vs original
    const outstandingAmount = Number(loan.loanAmount) - Number(loan.totalAmountPaid || 0);
    const outstandingRatio = outstandingAmount / Number(loan.loanAmount);
    if (outstandingRatio > 0.8 && loan.status === LoanStatus.ACTIVE) {
      const monthsActive = this.calculateMonthsActive(loan);
      if (monthsActive > 6) {
        indicators.push(
          this.earlyWarningRepository.create({
            loanId,
            indicatorName: 'Slow Principal Reduction',
            severity: RiskLevel.MEDIUM,
            description: `Outstanding balance is ${(outstandingRatio * 100).toFixed(1)}% of original after ${monthsActive} months`,
            indicatorData: { outstandingRatio, monthsActive },
            triggeredDate: new Date(),
          }),
        );
      }
    }

    // Save indicators
    if (indicators.length > 0) {
      return this.earlyWarningRepository.save(indicators);
    }

    return [];
  }

  private calculateMonthsActive(loan: Loan): number {
    const today = new Date();
    const startDate = loan.postingDate || loan.createdAt;
    const months = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.floor(months);
  }

  async getEarlyWarnings(loanId?: string, isResolved?: boolean): Promise<EarlyWarningIndicator[]> {
    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (isResolved !== undefined) where.isResolved = isResolved;

    return this.earlyWarningRepository.find({
      where,
      order: { triggeredDate: 'DESC' },
    });
  }

  async resolveEarlyWarning(indicatorId: string, resolvedBy: string, notes?: string): Promise<EarlyWarningIndicator> {
    const indicator = await this.earlyWarningRepository.findOne({ where: { id: indicatorId } });
    if (!indicator) {
      throw new NotFoundException(`Early warning indicator with ID ${indicatorId} not found`);
    }

    indicator.isResolved = true;
    indicator.resolvedDate = new Date();
    indicator.resolvedBy = resolvedBy;
    indicator.resolutionNotes = notes;

    return this.earlyWarningRepository.save(indicator);
  }

  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    const model = await this.findOneModel(modelId);
    return model.performanceMetrics as ModelPerformance;
  }
}

