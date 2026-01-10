import { Controller, Post, Body, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WeightedCreditScoringService } from './services/weighted-credit-scoring.service';
import { ScoringHistoryService } from './services/scoring-history.service';
import { RiskTierService } from './services/risk-tier.service';
import { MLModelTrainingService } from './services/ml-model-training.service';
import { MLSeedDataGeneratorService } from './services/ml-seed-data-generator.service';
import { ScoringQueueService } from './services/scoring-queue.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { ExplainabilityService } from './services/explainability.service';
import { RiskTier } from './entities/risk-tier-config.entity';
import {
  WeightedScoringRequestDto,
  WeightedScoringResultDto,
} from './dto/weighted-scoring.dto';
import {
  TrainModelDto,
  ActivateModelDto,
  ModelVersionDto,
  ModelMetricsDto,
  ModelComparisonDto,
  ModelType,
  TrainingSampleDto,
} from './dto/ml-model.dto';
import {
  GenerateSeedDataDto,
  GenerateAndTrainDto,
} from './dto/seed-data.dto';

@ApiTags('Credit Scoring Engine')
@Controller('credit-scoring-engine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditScoringEngineController {
  constructor(
    private readonly weightedScoringService: WeightedCreditScoringService,
    private readonly scoringHistoryService: ScoringHistoryService,
    private readonly riskTierService: RiskTierService,
    private readonly modelTrainingService: MLModelTrainingService,
    private readonly seedDataGenerator: MLSeedDataGeneratorService,
    private readonly scoringQueueService: ScoringQueueService,
    private readonly performanceMonitorService: PerformanceMonitorService,
    private readonly explainabilityService: ExplainabilityService,
  ) {}

  @Post('calculate-weighted-score')
  @ApiOperation({
    summary: 'Calculate weighted credit score',
    description: `
      Calculates a comprehensive credit score using a three-tier weighted model:
      - Traditional Bureau Data (30% weight)
      - Alternative Financial Data (40% weight) - AI-powered
      - Behavioral & Digital Data (30% weight)
      
      ML-enhanced scoring is automatically applied when sufficient data is available.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Credit score calculated successfully',
    type: WeightedScoringResultDto,
  })
  async calculateWeightedScore(
    @Body() dto: WeightedScoringRequestDto,
    @Request() req: any,
  ): Promise<WeightedScoringResultDto> {
    const companyId = req.user?.companyId || req.companyId;
    return await this.weightedScoringService.calculateWeightedScore(
      dto,
      companyId,
      dto.useML !== false, // Default to true if not specified
      dto.segment, // Pass segment parameter
    );
  }

  @Post('ml-models/train')
  @ApiOperation({
    summary: 'Train a new ML model',
    description: 'Trains a new ML model version on provided training data. Minimum 10 samples recommended, 100+ for best results.',
  })
  @ApiResponse({
    status: 201,
    description: 'Model trained successfully',
    type: ModelVersionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid training data',
  })
  async trainModel(
    @Body() dto: TrainModelDto,
    @Request() req: any,
  ): Promise<ModelVersionDto> {
    const model = await this.modelTrainingService.trainModel(
      {
        samples: dto.samples.map(s => ({
          features: s.features,
          target: s.target,
        })),
        featureNames: dto.featureNames,
      },
      dto.modelType || ModelType.CREDIT_SCORE,
      dto.hyperparameters,
    );
    
    return {
      id: model.id,
      modelType: model.modelType,
      version: model.version,
      metrics: model.metrics,
      hyperparameters: model.hyperparameters,
      isActive: model.isActive,
      trafficPercentage: model.trafficPercentage,
      createdAt: model.createdAt,
      activatedAt: model.activatedAt,
      predictionCount: model.predictionCount,
      lastUpdated: model.lastUpdated,
    };
  }

  @Post('ml-models/activate')
  @ApiOperation({
    summary: 'Activate a model version',
    description: 'Activates a model version for use in scoring (supports A/B testing with traffic percentage). Traffic percentage must be 0-100.',
  })
  @ApiResponse({
    status: 200,
    description: 'Model activated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid model version or traffic percentage',
  })
  async activateModel(@Body() dto: ActivateModelDto): Promise<{ message: string; versionId: string }> {
    this.modelTrainingService.setActiveModel(
      ModelType.CREDIT_SCORE,
      dto.versionId,
      dto.trafficPercentage || 100,
    );
    
    return {
      message: 'Model activated successfully',
      versionId: dto.versionId,
    };
  }

  @Get('ml-models/active')
  @ApiOperation({
    summary: 'Get active model',
    description: 'Returns the currently active model version',
  })
  @ApiQuery({ name: 'modelType', enum: ModelType, required: false, description: 'Model type' })
  @ApiResponse({
    status: 200,
    description: 'Active model information',
    type: ModelVersionDto,
  })
  async getActiveModel(
    @Query('modelType') modelType?: ModelType,
  ): Promise<ModelVersionDto | null> {
    const model = this.modelTrainingService.getActiveModel(modelType || ModelType.CREDIT_SCORE);
    
    if (!model) return null;
    
    return {
      id: model.id,
      modelType: model.modelType,
      version: model.version,
      metrics: model.metrics,
      hyperparameters: model.hyperparameters,
      isActive: model.isActive,
      trafficPercentage: model.trafficPercentage,
      createdAt: model.createdAt,
      activatedAt: model.activatedAt,
      predictionCount: model.predictionCount,
      lastUpdated: model.lastUpdated,
    };
  }

  @Get('ml-models/:versionId/metrics')
  @ApiOperation({
    summary: 'Get model metrics',
    description: 'Returns performance metrics for a specific model version',
  })
  @ApiParam({ name: 'versionId', description: 'Model version ID' })
  @ApiResponse({
    status: 200,
    description: 'Model metrics',
    type: ModelMetricsDto,
  })
  async getModelMetrics(@Param('versionId') versionId: string): Promise<ModelMetricsDto | null> {
    return this.modelTrainingService.getModelMetrics(versionId);
  }

  @Get('ml-models/compare')
  @ApiOperation({
    summary: 'Compare two model versions',
    description: 'Compares performance metrics between two model versions',
  })
  @ApiQuery({ name: 'version1', description: 'First model version ID' })
  @ApiQuery({ name: 'version2', description: 'Second model version ID' })
  @ApiResponse({
    status: 200,
    description: 'Model comparison',
    type: ModelComparisonDto,
  })
  async compareModels(
    @Query('version1') version1: string,
    @Query('version2') version2: string,
  ): Promise<ModelComparisonDto> {
    const comparison = this.modelTrainingService.compareModels(version1, version2);
    
    return {
      version1: {
        id: comparison.version1.id,
        metrics: comparison.version1.metrics,
        predictionCount: comparison.version1.predictionCount,
      },
      version2: {
        id: comparison.version2.id,
        metrics: comparison.version2.metrics,
        predictionCount: comparison.version2.predictionCount,
      },
      winner: comparison.winner,
      improvement: comparison.improvement,
    };
  }

  @Post('ml-models/generate-seed-data')
  @ApiOperation({
    summary: 'Generate seed training data',
    description: 'Generates realistic historical training data for ML model training. Can generate thousands of samples with different risk profiles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data generated successfully',
  })
  async generateSeedData(
    @Body() dto: GenerateSeedDataDto,
  ): Promise<{ samples: TrainingSampleDto[]; count: number; featureNames: string[] }> {
    const dateRange = dto.dateRange
      ? {
          start: new Date(dto.dateRange.start),
          end: new Date(dto.dateRange.end),
        }
      : undefined;

    const trainingData = await this.seedDataGenerator.generateBulkTrainingData(
      dto.sampleCount,
      {
        dateRange,
        riskDistribution: dto.riskDistribution,
      },
    );

    return {
      samples: trainingData.samples.map(s => ({
        features: s.features,
        target: s.target,
      })),
      count: trainingData.samples.length,
      featureNames: trainingData.featureNames || [],
    };
  }

  @Post('ml-models/generate-and-train')
  @ApiOperation({
    summary: 'Generate seed data and train model',
    description: 'Generates training data and immediately trains a model. Useful for quick model creation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Model trained successfully',
    type: ModelVersionDto,
  })
  async generateAndTrain(
    @Body() dto: GenerateAndTrainDto,
  ): Promise<ModelVersionDto> {
    // Generate training data
    const trainingData = await this.seedDataGenerator.generateBulkTrainingData(
      dto.sampleCount,
    );

    // Train model
    const model = await this.modelTrainingService.trainModel(
      trainingData,
      (dto.modelType as ModelType) || ModelType.CREDIT_SCORE,
      dto.hyperparameters,
    );

    // Auto-activate if requested
    if (dto.autoActivate) {
      this.modelTrainingService.setActiveModel(
        (dto.modelType as ModelType) || ModelType.CREDIT_SCORE,
        model.id,
        dto.trafficPercentage || 0,
      );
    }

    return {
      id: model.id,
      modelType: model.modelType,
      version: model.version,
      metrics: model.metrics,
      hyperparameters: model.hyperparameters,
      isActive: model.isActive,
      trafficPercentage: model.trafficPercentage,
      createdAt: model.createdAt,
      activatedAt: model.activatedAt,
      predictionCount: model.predictionCount,
      lastUpdated: model.lastUpdated,
    };
  }

  // Scoring History Endpoints

  @Get('history/applicant/:applicantId')
  @ApiOperation({
    summary: 'Get scoring history for an applicant',
    description: 'Retrieves complete scoring history with timestamps and triggers',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiQuery({ name: 'applicationId', required: false, description: 'Filter by application ID' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'trigger', required: false, description: 'Filter by trigger type' })
  @ApiResponse({ status: 200, description: 'Scoring history retrieved successfully' })
  async getScoringHistory(
    @Param('applicantId') applicantId: string,
    @Query('applicationId') applicationId?: string,
    @Query('loanId') loanId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('trigger') trigger?: string,
  ) {
    return await this.scoringHistoryService.getHistory(applicantId, {
      applicationId,
      loanId,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      trigger: trigger as any,
    });
  }

  @Get('history/applicant/:applicantId/statistics')
  @ApiOperation({
    summary: 'Get scoring statistics for an applicant',
    description: 'Returns statistics including current score, trends, and averages',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiQuery({ name: 'applicationId', required: false, description: 'Filter by application ID' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getScoringStatistics(
    @Param('applicantId') applicantId: string,
    @Query('applicationId') applicationId?: string,
    @Query('loanId') loanId?: string,
  ) {
    return await this.scoringHistoryService.getScoreStatistics(
      applicantId,
      applicationId,
      loanId,
    );
  }

  @Get('history/applicant/:applicantId/changes-by-trigger')
  @ApiOperation({
    summary: 'Get score changes grouped by trigger type',
    description: 'Analyzes score changes by what triggered the rescoring',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date' })
  @ApiResponse({ status: 200, description: 'Score changes by trigger retrieved successfully' })
  async getScoreChangesByTrigger(
    @Param('applicantId') applicantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return await this.scoringHistoryService.getScoreChangesByTrigger(
      applicantId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  // Risk Tier Endpoints

  @Get('tier/applicant/:applicantId')
  @ApiOperation({
    summary: 'Get risk tier for an applicant',
    description: 'Returns the current risk tier (Prime/Standard/Monitored/High-risk) for an applicant based on their latest credit score',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiResponse({ status: 200, description: 'Risk tier retrieved successfully' })
  async getApplicantRiskTier(
    @Param('applicantId') applicantId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    
    // Get latest score from history
    const latestScore = await this.scoringHistoryService.getLatestScore(applicantId);
    
    if (!latestScore) {
      return {
        tier: null,
        message: 'No credit score found for this applicant',
      };
    }

    const tier = latestScore.riskTier as RiskTier;
    const tierInfo = await this.riskTierService.getTierInfo(tier, companyId);

    return {
      tier: tierInfo.tier,
      displayName: tierInfo.displayName,
      description: tierInfo.description,
      badgeColor: tierInfo.badgeColor,
      iconUrl: tierInfo.iconUrl,
      benefits: tierInfo.benefits,
      limitations: tierInfo.limitations,
      scoreRange: tierInfo.scoreRange,
      currentScore: latestScore.finalScore,
      lastCalculatedAt: latestScore.calculatedAt,
    };
  }

  @Get('tier/info/:tier')
  @ApiOperation({
    summary: 'Get tier information',
    description: 'Returns detailed information about a specific risk tier including benefits, limitations, and approval rules',
  })
  @ApiParam({ name: 'tier', enum: RiskTier, description: 'Risk tier' })
  @ApiResponse({ status: 200, description: 'Tier information retrieved successfully' })
  async getTierInfo(
    @Param('tier') tier: RiskTier,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.riskTierService.getTierInfo(tier, companyId);
  }

  @Get('tier/configs')
  @ApiOperation({
    summary: 'Get all tier configurations',
    description: 'Returns all active tier configurations for the company',
  })
  @ApiResponse({ status: 200, description: 'Tier configurations retrieved successfully' })
  async getTierConfigs(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.riskTierService.getActiveTierConfigs(companyId);
  }

  // Queue Endpoints

  @Post('queue/score')
  @ApiOperation({
    summary: 'Queue scoring job (async)',
    description: 'Adds a scoring request to the queue for async processing. Returns job ID for status tracking.',
  })
  @ApiResponse({ status: 202, description: 'Scoring job queued successfully' })
  async queueScoringJob(
    @Body() dto: WeightedScoringRequestDto,
    @Request() req: any,
  ): Promise<{ jobId: string; status: string }> {
    const companyId = req.user?.companyId || req.companyId;
    return await this.scoringQueueService.queueScoringJob(
      dto,
      companyId,
      dto.useML !== false,
      dto.segment,
    );
  }

  @Get('queue/job/:jobId')
  @ApiOperation({
    summary: 'Get scoring job status',
    description: 'Returns the status and result of a queued scoring job',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return await this.scoringQueueService.getJobStatus(jobId);
  }

  @Get('queue/stats')
  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Returns queue statistics including waiting, active, completed, and failed jobs',
  })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStats() {
    return await this.scoringQueueService.getQueueStats();
  }

  // Performance Monitoring Endpoints

  @Get('performance/metrics')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Returns current latency percentiles (p50, p95, p99) and performance summary',
  })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Filter by endpoint' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics(@Query('endpoint') endpoint?: string) {
    if (endpoint) {
      return await this.performanceMonitorService.getPerformanceSummary(endpoint);
    }
    return this.performanceMonitorService.getLatencyPercentiles();
  }

  @Get('performance/sla')
  @ApiOperation({
    summary: 'Check SLA compliance',
    description: 'Checks if performance meets SLA (p95 < 2s)',
  })
  @ApiResponse({ status: 200, description: 'SLA status retrieved successfully' })
  async checkSLA() {
    const percentiles = this.performanceMonitorService.getLatencyPercentiles();
    const meetsSLA = this.performanceMonitorService.isPerformanceWithinSLA();
    return {
      meetsSLA,
      p95: percentiles.p95,
      target: 2000,
      status: meetsSLA ? 'PASS' : 'FAIL',
    };
  }

  // Explainability Endpoints

  @Get('explainability/:applicantId')
  @ApiOperation({
    summary: 'Get explainability report',
    description: 'Returns comprehensive explainability report including SHAP values, LIME explanation, and feature importance for regulatory compliance',
  })
  @ApiParam({ name: 'applicantId', description: 'Applicant ID' })
  @ApiQuery({ name: 'applicationId', required: false, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Explainability report retrieved successfully' })
  async getExplainabilityReport(
    @Request() req: any,
    @Param('applicantId') applicantId: string,
    @Query('applicationId') applicationId?: string,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    
    // Get latest score from history
    const latestScore = await this.scoringHistoryService.getLatestScore(applicantId);
    
    if (!latestScore || !latestScore.mlScore) {
      return {
        message: 'No ML score found for explainability analysis',
        applicantId,
      };
    }

    const mlScore = latestScore.mlScore;
    const featureImportance = mlScore.featureImportance || {};
    
    // Calculate SHAP values
    const baselineScore = 650;
    const shapValues = this.explainabilityService.calculateSHAPValues(
      featureImportance,
      featureImportance,
      baselineScore,
    );

    // Calculate LIME explanation
    const limeResult = this.explainabilityService.calculateLIME(
      featureImportance,
      featureImportance,
      latestScore.finalScore,
    );

    // Get comprehensive compliance explanation
    const complianceExplanation = this.explainabilityService.getComplianceExplanation(
      latestScore.finalScore,
      featureImportance,
      shapValues,
      limeResult.explanation,
      mlScore.riskFactors || [],
    );

    return {
      applicantId,
      applicationId,
      score: latestScore.finalScore,
      explanation: complianceExplanation,
      shapValues,
      limeExplanation: limeResult,
      featureImportance: this.explainabilityService.getFeatureImportanceRanking(featureImportance),
      complianceFormat: this.explainabilityService.exportComplianceFormat(complianceExplanation),
    };
  }
}

