import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringObservabilityService } from './services/monitoring-observability.service';
import {
  CreateMetricDto,
  CreateAlertRuleDto,
  AlertSeverity,
} from './dto/monitoring-observability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Monitoring & Observability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitoring-observability')
export class MonitoringObservabilityController {
  constructor(private readonly monitoringService: MonitoringObservabilityService) {}

  @Post('metrics')
  @ApiOperation({ summary: 'Record metric' })
  @ApiResponse({ status: 201, description: 'Metric recorded successfully' })
  recordMetric(@Body() createDto: CreateMetricDto) {
    return this.monitoringService.recordMetric(createDto);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get metrics' })
  @ApiResponse({ status: 200, description: 'List of metrics' })
  getMetrics(
    @Query('name') name: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.monitoringService.getMetrics(
      name,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('alert-rules')
  @ApiOperation({ summary: 'Create alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  createAlertRule(@Body() createDto: CreateAlertRuleDto) {
    return this.monitoringService.createAlertRule(createDto);
  }

  @Get('alert-rules')
  @ApiOperation({ summary: 'Get all alert rules' })
  @ApiResponse({ status: 200, description: 'List of alert rules' })
  findAllAlertRules(@Query('isActive') isActive?: boolean) {
    return this.monitoringService.findAllAlertRules(
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  getAlerts(
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.monitoringService.getAlerts(severity, status, limit);
  }

  @Put('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  acknowledgeAlert(@Param('id') id: string) {
    return this.monitoringService.acknowledgeAlert(id);
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  resolveAlert(@Param('id') id: string) {
    return this.monitoringService.resolveAlert(id);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health' })
  @ApiResponse({ status: 200, description: 'System health status' })
  getSystemHealth() {
    return this.monitoringService.getSystemHealth();
  }
}

