import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExecutiveBIService } from './services/executive-bi.service';
import {
  GetExecutiveKPIsDto,
  CreateCustomReportDto,
  PredictiveMetricsDto,
} from './dto/executive-bi.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('executive-bi')
@ApiBearerAuth('JWT-auth')
@Controller('executive-bi')
@UseGuards(CompanyGuard)
export class ExecutiveBIController {
  constructor(private readonly biService: ExecutiveBIService) {}

  @Get('kpis')
  @ApiOperation({
    summary: 'Get executive KPIs',
    description: 'Returns comprehensive executive KPIs including revenue, portfolio, risk, operational, and customer metrics with trends and insights.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'period', required: false, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @ApiResponse({
    status: 200,
    description: 'Executive KPIs retrieved successfully',
  })
  async getExecutiveKPIs(
    @Query() query: GetExecutiveKPIsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.biService.getExecutiveKPIs(query, companyId);
  }

  @Post('custom-reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create custom report',
    description: 'Creates a custom report with specified metrics, filters, and time period. Supports scheduled report generation.',
  })
  @ApiBody({ type: CreateCustomReportDto })
  @ApiResponse({
    status: 201,
    description: 'Custom report created successfully',
  })
  async createCustomReport(
    @Body() dto: CreateCustomReportDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.biService.createCustomReport(dto, companyId);
  }

  @Get('predictive-metrics')
  @ApiOperation({
    summary: 'Get predictive metrics',
    description: 'Returns predictive forecasts for revenue, portfolio, risk, and customers with confidence intervals.',
  })
  @ApiQuery({ name: 'forecastMonths', required: false, description: 'Forecast period in months (1-24)', example: 12 })
  @ApiResponse({
    status: 200,
    description: 'Predictive metrics retrieved successfully',
  })
  async getPredictiveMetrics(
    @Query() query: PredictiveMetricsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.biService.getPredictiveMetrics(query, companyId);
  }
}

