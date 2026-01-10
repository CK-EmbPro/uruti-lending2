import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PortfolioAnalyticsService } from './services/portfolio-analytics.service';
import { PortfolioAnalyticsDto } from './dto/portfolio-analytics.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('portfolio-analytics')
@ApiBearerAuth('JWT-auth')
@Controller('portfolio-analytics')
@UseGuards(CompanyGuard)
export class PortfolioAnalyticsController {
  constructor(private readonly analyticsService: PortfolioAnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get portfolio analytics overview',
    description: 'Comprehensive portfolio analytics including totals, risk metrics, time-series data, and breakdowns',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @ApiQuery({ name: 'loanProductId', required: false, description: 'Filter by loan product' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by loan status' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio analytics retrieved successfully',
  })
  async getPortfolioAnalytics(
    @Query() query: PortfolioAnalyticsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.analyticsService.getPortfolioAnalytics(query, companyId);
  }
}

