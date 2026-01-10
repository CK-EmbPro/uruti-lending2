import {
  Controller,
  Post,
  Get,
  Patch,
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
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegulatoryReportingService } from './services/regulatory-reporting.service';
import {
  CreateRegulatoryReportDto,
  CreateReportScheduleDto,
} from './dto/regulatory-reporting.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('regulatory-reporting')
@ApiBearerAuth('JWT-auth')
@Controller('regulatory-reporting')
@UseGuards(CompanyGuard)
export class RegulatoryReportingController {
  constructor(
    private readonly reportingService: RegulatoryReportingService,
  ) {}

  @Post('reports')
  @ApiOperation({
    summary: 'Create regulatory report',
    description: 'Creates a new regulatory report with automated generation. Supports multiple report types and jurisdictions.',
  })
  @ApiBody({ type: CreateRegulatoryReportDto })
  @ApiResponse({
    status: 201,
    description: 'Regulatory report created successfully',
  })
  async createRegulatoryReport(
    @Body() dto: CreateRegulatoryReportDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.createRegulatoryReport(dto, companyId);
  }

  @Get('reports')
  @ApiOperation({
    summary: 'Get regulatory reports',
    description: 'Returns list of regulatory reports, optionally filtered by type and status.',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['ANNUAL_REPORT', 'QUARTERLY_REPORT', 'MONTHLY_REPORT', 'COMPLIANCE_REPORT', 'AUDIT_REPORT', 'RISK_REPORT', 'CAPITAL_REPORT', 'LIQUIDITY_REPORT', 'CUSTOM'] })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'GENERATING', 'COMPLETED', 'REVIEWED', 'APPROVED', 'SUBMITTED', 'FAILED'] })
  @ApiResponse({
    status: 200,
    description: 'Regulatory reports retrieved successfully',
  })
  async getRegulatoryReports(
    @Query('type') type: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getRegulatoryReports(
      companyId,
      type as any,
      status as any,
    );
  }

  @Patch('reports/:id/approve')
  @ApiOperation({
    summary: 'Approve report',
    description: 'Approves a regulatory report for submission. Report must be in COMPLETED or REVIEWED status.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report approved successfully',
  })
  async approveReport(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const approvedBy = req.user?.id || req.userId;
    await this.reportingService.approveReport(id, companyId, approvedBy);
    return { message: 'Report approved successfully' };
  }

  @Patch('reports/:id/submit')
  @ApiOperation({
    summary: 'Submit report',
    description: 'Submits a regulatory report to the regulatory authority. Report must be in APPROVED status.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        submissionReference: { type: 'string', example: 'REF-2024-001' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Report submitted successfully',
  })
  async submitReport(
    @Param('id') id: string,
    @Body() body: { submissionReference?: string },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.reportingService.submitReport(id, companyId, body.submissionReference);
    return { message: 'Report submitted successfully' };
  }

  @Post('schedules')
  @ApiOperation({
    summary: 'Create report schedule',
    description: 'Creates a scheduled regulatory report using cron expression. Supports automatic generation and submission.',
  })
  @ApiBody({ type: CreateReportScheduleDto })
  @ApiResponse({
    status: 201,
    description: 'Report schedule created successfully',
  })
  async createReportSchedule(
    @Body() dto: CreateReportScheduleDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.createReportSchedule(dto, companyId);
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'Get compliance calendar',
    description: 'Returns compliance calendar with upcoming reports, overdue reports, and recent submissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance calendar retrieved successfully',
  })
  async getComplianceCalendar(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getComplianceCalendar(companyId);
  }

  @Get('changes')
  @ApiOperation({
    summary: 'Get regulatory changes',
    description: 'Returns list of regulatory changes, optionally filtered by jurisdiction.',
  })
  @ApiQuery({ name: 'jurisdiction', required: false, enum: ['US_FEDERAL', 'US_STATE', 'EU', 'UK', 'INDIA', 'SINGAPORE', 'AUSTRALIA', 'CUSTOM'] })
  @ApiResponse({
    status: 200,
    description: 'Regulatory changes retrieved successfully',
  })
  async getRegulatoryChanges(
    @Query('jurisdiction') jurisdiction: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getRegulatoryChanges(companyId, jurisdiction as any);
  }
}

