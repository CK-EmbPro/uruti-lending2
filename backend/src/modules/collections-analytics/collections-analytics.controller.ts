import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CollectionsAnalyticsService } from './services/collections-analytics.service';
import {
  GetCollectionAnalyticsDto,
} from './dto/collections-analytics.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('collections-analytics')
@ApiBearerAuth('JWT-auth')
@Controller('collections-analytics')
@UseGuards(CompanyGuard)
export class CollectionsAnalyticsController {
  constructor(
    private readonly analyticsService: CollectionsAnalyticsService,
  ) {}

  @Post('predict/:loanId')
  @ApiOperation({
    summary: 'Predict payment probability',
    description: 'Predicts payment probability for a delinquent loan using ML-like algorithms. Returns optimal contact time, channel, strategy, and risk factors.',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment probability predicted successfully',
  })
  async predictPaymentProbability(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.predictPaymentProbability(loanId, companyId);
  }

  @Get('effectiveness')
  @ApiOperation({
    summary: 'Get collection effectiveness analysis',
    description: 'Returns comprehensive collection effectiveness analysis including channel effectiveness, time effectiveness, strategy effectiveness, and collector performance.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'stage', required: false, enum: ['EARLY_STAGE', 'MODERATE_STAGE', 'SERIOUS_STAGE', 'SEVERE_STAGE', 'LEGAL'] })
  @ApiResponse({
    status: 200,
    description: 'Collection effectiveness analysis retrieved successfully',
  })
  async getCollectionEffectiveness(
    @Query() query: GetCollectionAnalyticsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.getCollectionEffectiveness(query, companyId);
  }

  @Get('recommendations/:loanId')
  @ApiOperation({
    summary: 'Get optimization recommendations',
    description: 'Returns AI-powered optimization recommendations for a specific loan including recommended action, time, channel, and expected outcomes.',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Optimization recommendations retrieved successfully',
  })
  async getOptimizationRecommendations(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.getOptimizationRecommendations(loanId, companyId);
  }

  @Post('settlement-offer/:loanId')
  @ApiOperation({
    summary: 'Generate settlement offer',
    description: 'Generates an AI-powered settlement offer based on payment probability. Calculates optimal discount, payment terms, and acceptance probability.',
  })
  @ApiParam({ name: 'loanId', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Settlement offer generated successfully',
  })
  async generateSettlementOffer(
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.generateSettlementOffer(loanId, companyId);
  }
}

