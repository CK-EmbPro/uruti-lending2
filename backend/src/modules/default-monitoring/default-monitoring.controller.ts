import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PredictiveDefaultMonitoringService } from './services/predictive-default-monitoring.service';
import { CollectionsDashboardService } from './services/collections-dashboard.service';
import { DefaultPerformanceMetricsService } from './services/default-performance-metrics.service';
import {
  DefaultRiskScoreDto,
  PredictiveDefaultCheckResultDto,
  CollectionsDashboardDto,
} from './dto/predictive-default.dto';

@ApiTags('Default Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/default-monitoring')
export class DefaultMonitoringController {
  constructor(
    private readonly monitoringService: PredictiveDefaultMonitoringService,
    private readonly dashboardService: CollectionsDashboardService,
    private readonly metricsService: DefaultPerformanceMetricsService,
  ) {}

  @Post('calculate-risk-score/:loanId')
  @ApiOperation({ summary: 'Calculate daily risk score for a loan' })
  @ApiResponse({
    status: 200,
    description: 'Risk score calculated successfully',
    type: DefaultRiskScoreDto,
  })
  async calculateRiskScore(@Param('loanId') loanId: string): Promise<DefaultRiskScoreDto> {
    return await this.monitoringService.calculateDailyRiskScore(loanId);
  }

  @Get('check/:loanId')
  @ApiOperation({ summary: 'Get predictive default check result for a loan' })
  @ApiResponse({
    status: 200,
    description: 'Predictive default check result',
    type: PredictiveDefaultCheckResultDto,
  })
  async getPredictiveDefaultCheck(@Param('loanId') loanId: string): Promise<PredictiveDefaultCheckResultDto> {
    const currentScore = await this.monitoringService.calculateDailyRiskScore(loanId);
    
    // Get previous score
    const previousScore = await this.monitoringService.getPreviousRiskScore(loanId);

    return {
      loanId,
      currentScore,
      previousScore,
      actionsTaken: await this.monitoringService.getActionsForLoan(loanId),
      predictedDefaultDate: currentScore.predictedDefaultDate,
      daysUntilPredictedDefault: currentScore.daysUntilPredictedDefault,
    };
  }

  @Get('collections-dashboard')
  @ApiOperation({ summary: 'Get collections dashboard with prioritized accounts' })
  @ApiResponse({
    status: 200,
    description: 'Collections dashboard data',
    type: CollectionsDashboardDto,
  })
  async getCollectionsDashboard(): Promise<CollectionsDashboardDto> {
    return await this.dashboardService.getCollectionsDashboard();
  }

  @Get('prioritized-accounts')
  @ApiOperation({ summary: 'Get prioritized accounts for collections team' })
  @ApiResponse({
    status: 200,
    description: 'Prioritized accounts list',
    type: [DefaultRiskScoreDto],
  })
  async getPrioritizedAccounts(@Query('limit') limit?: number): Promise<DefaultRiskScoreDto[]> {
    return await this.dashboardService.getPrioritizedAccounts(limit ? parseInt(limit.toString()) : 50);
  }

  @Get('performance-metrics')
  @ApiOperation({ summary: 'Get performance metrics (accuracy, false alarm rate, intervention success)' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics',
  })
  async getPerformanceMetrics() {
    return await this.metricsService.getPerformanceMetrics();
  }

  @Get('prediction-accuracy')
  @ApiOperation({ summary: 'Get prediction accuracy metrics' })
  @ApiResponse({
    status: 200,
    description: 'Prediction accuracy data',
  })
  async getPredictionAccuracy() {
    return await this.metricsService.calculatePredictionAccuracy();
  }

  @Get('false-alarm-rate')
  @ApiOperation({ summary: 'Get false alarm rate metrics' })
  @ApiResponse({
    status: 200,
    description: 'False alarm rate data',
  })
  async getFalseAlarmRate() {
    return await this.metricsService.calculateFalseAlarmRate();
  }

  @Get('intervention-success-rate')
  @ApiOperation({ summary: 'Get intervention success rate metrics' })
  @ApiResponse({
    status: 200,
    description: 'Intervention success rate data',
  })
  async getInterventionSuccessRate() {
    return await this.metricsService.calculateInterventionSuccessRate();
  }
}

