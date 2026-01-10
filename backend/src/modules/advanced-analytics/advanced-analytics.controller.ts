import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';
import {
  CohortAnalysisDto,
  FunnelAnalysisDto,
} from './dto/advanced-analytics.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('advanced-analytics')
@ApiBearerAuth('JWT-auth')
@Controller('advanced-analytics')
@UseGuards(CompanyGuard)
export class AdvancedAnalyticsController {
  constructor(private readonly analyticsService: AdvancedAnalyticsService) {}

  @Post('cohort-analysis')
  @ApiOperation({
    summary: 'Perform cohort analysis',
    description: 'Analyzes customer cohorts over time to understand retention, revenue, and lifetime value trends. Supports daily, weekly, monthly, and quarterly cohorts.',
  })
  @ApiBody({ type: CohortAnalysisDto })
  @ApiResponse({
    status: 200,
    description: 'Cohort analysis completed successfully',
  })
  async performCohortAnalysis(
    @Body() dto: CohortAnalysisDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.performCohortAnalysis(dto, companyId);
  }

  @Post('funnel-analysis')
  @ApiOperation({
    summary: 'Perform funnel analysis',
    description: 'Analyzes conversion funnel to identify bottlenecks and drop-off points. Provides recommendations for optimization.',
  })
  @ApiBody({ type: FunnelAnalysisDto })
  @ApiResponse({
    status: 200,
    description: 'Funnel analysis completed successfully',
  })
  async performFunnelAnalysis(
    @Body() dto: FunnelAnalysisDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.performFunnelAnalysis(dto, companyId);
  }

  @Get('customer-segmentation')
  @ApiOperation({
    summary: 'Perform customer segmentation',
    description: 'Segments customers into groups based on value, behavior, and characteristics. Helps identify high-value customers and target marketing efforts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer segmentation completed successfully',
  })
  async performCustomerSegmentation(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.performCustomerSegmentation(companyId);
  }
}

