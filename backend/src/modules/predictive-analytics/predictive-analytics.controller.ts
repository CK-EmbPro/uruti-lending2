import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import {
  PredictDefaultProbabilityDto,
  PredictCustomerLifetimeValueDto,
  PredictChurnRiskDto,
  PredictOptimalPricingDto,
  BatchPredictionDto,
} from './dto/predictive-analytics.dto';
import { PredictionType } from './entities/prediction-result.entity';

@ApiTags('Predictive Analytics')
@Controller('predictive-analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PredictiveAnalyticsController {
  constructor(private readonly predictiveAnalyticsService: PredictiveAnalyticsService) {}

  @Post('default-probability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict default probability for a loan or application' })
  @ApiResponse({ status: 200, description: 'Default probability predicted' })
  async predictDefaultProbability(@Body() dto: PredictDefaultProbabilityDto) {
    return await this.predictiveAnalyticsService.predictDefaultProbability(dto);
  }

  @Post('customer-lifetime-value')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict customer lifetime value' })
  @ApiResponse({ status: 200, description: 'Customer lifetime value predicted' })
  async predictCustomerLifetimeValue(@Body() dto: PredictCustomerLifetimeValueDto) {
    return await this.predictiveAnalyticsService.predictCustomerLifetimeValue(dto);
  }

  @Post('churn-risk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict churn risk for a customer' })
  @ApiResponse({ status: 200, description: 'Churn risk predicted' })
  async predictChurnRisk(@Body() dto: PredictChurnRiskDto) {
    return await this.predictiveAnalyticsService.predictChurnRisk(dto);
  }

  @Post('optimal-pricing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict optimal pricing for a loan application' })
  @ApiResponse({ status: 200, description: 'Optimal pricing predicted' })
  async predictOptimalPricing(@Body() dto: PredictOptimalPricingDto) {
    return await this.predictiveAnalyticsService.predictOptimalPricing(dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch predictions for multiple entities' })
  @ApiResponse({ status: 200, description: 'Batch predictions completed' })
  async batchPredict(@Body() dto: BatchPredictionDto) {
    return await this.predictiveAnalyticsService.batchPredict(dto);
  }

  @Get('predictions/:entityId')
  @ApiOperation({ summary: 'Get prediction results for an entity' })
  @ApiResponse({ status: 200, description: 'Prediction results retrieved' })
  async getPredictions(
    @Param('entityId') entityId: string,
    @Query('type') type?: PredictionType,
    @Query('entityType') entityType?: string,
  ) {
    // This would fetch predictions from the database
    // Implementation would go in service
    return { message: 'Get predictions endpoint', entityId, type, entityType };
  }
}

