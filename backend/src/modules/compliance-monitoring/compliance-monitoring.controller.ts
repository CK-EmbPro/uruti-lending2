import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceMonitoringService } from './services/compliance-monitoring.service';
import { ComplianceMonitoringDto } from './dto/compliance-monitoring.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('compliance-monitoring')
@ApiBearerAuth('JWT-auth')
@Controller('compliance-monitoring')
@UseGuards(CompanyGuard)
export class ComplianceMonitoringController {
  constructor(private readonly monitoringService: ComplianceMonitoringService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get compliance monitoring dashboard',
    description: 'Comprehensive compliance monitoring dashboard with overall score, risk levels, breakdowns, and trend data',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'checkType', required: false, enum: ['KYC', 'AML', 'PRIVACY', 'DATA_RETENTION', 'REGULATORY', 'DOCUMENT', 'AUDIT'] })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiResponse({
    status: 200,
    description: 'Compliance monitoring dashboard retrieved successfully',
  })
  async getComplianceMonitoring(
    @Query() query: ComplianceMonitoringDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.getComplianceMonitoring(query, companyId);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Get compliance alerts',
    description: 'Returns real-time compliance alerts for failed checks, KYC matches, and other compliance issues',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of alerts to return', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Compliance alerts retrieved successfully',
  })
  async getComplianceAlerts(
    @Query('limit') limit: number,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.getComplianceAlerts(companyId, limit || 50);
  }

  @Get('entity-score/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get compliance score for entity',
    description: 'Calculates compliance score for a specific entity (loan, application, etc.)',
  })
  @ApiParam({ name: 'entityType', description: 'Entity type (loan, application, etc.)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity compliance score calculated successfully',
  })
  async getEntityComplianceScore(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.monitoringService.calculateEntityComplianceScore(entityId, entityType, companyId);
  }
}

