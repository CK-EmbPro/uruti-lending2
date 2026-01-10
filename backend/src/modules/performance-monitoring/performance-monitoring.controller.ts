import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';
import {
  GetPerformanceMetricsDto,
  CreateAlertRuleDto,
} from './dto/performance-monitoring.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('performance-monitoring')
@ApiBearerAuth('JWT-auth')
@Controller('performance-monitoring')
@UseGuards(CompanyGuard)
export class PerformanceMonitoringController {
  constructor(private readonly monitoringService: PerformanceMonitoringService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Returns performance metrics with summary statistics including average, min, max, p95, and p99 values.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'metricType', required: false, enum: ['API_RESPONSE_TIME', 'API_ERROR_RATE', 'DATABASE_QUERY_TIME', 'MEMORY_USAGE', 'CPU_USAGE', 'ACTIVE_CONNECTIONS', 'REQUEST_COUNT', 'CACHE_HIT_RATE'] })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Endpoint filter' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getPerformanceMetrics(
    @Query() query: GetPerformanceMetricsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.getPerformanceMetrics(query, companyId);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get system health',
    description: 'Returns overall system health status including component health, health score, and active alerts.',
  })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
  })
  async getSystemHealth(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.getSystemHealth(companyId);
  }

  @Post('alert-rules')
  @ApiOperation({
    summary: 'Create alert rule',
    description: 'Creates a new alert rule for monitoring performance metrics. Alerts trigger when thresholds are exceeded.',
  })
  @ApiBody({ type: CreateAlertRuleDto })
  @ApiResponse({
    status: 201,
    description: 'Alert rule created successfully',
  })
  async createAlertRule(
    @Body() dto: CreateAlertRuleDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.createAlertRule(dto, companyId);
  }
}

