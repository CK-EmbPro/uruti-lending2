import {
  Controller,
  Post,
  Get,
  Delete,
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
import { AdvancedReportingService } from './services/advanced-reporting.service';
import {
  CreateReportDto,
  CreateReportTemplateDto,
} from './dto/advanced-reporting.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('advanced-reporting')
@ApiBearerAuth('JWT-auth')
@Controller('advanced-reporting')
@UseGuards(CompanyGuard)
export class AdvancedReportingController {
  constructor(private readonly reportingService: AdvancedReportingService) {}

  @Post('reports')
  @ApiOperation({
    summary: 'Create report',
    description: 'Creates a new report with support for multiple formats (PDF, Excel, CSV, JSON, HTML). Supports custom queries, filters, and chart/table inclusion.',
  })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
  })
  async createReport(
    @Body() dto: CreateReportDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.createReport(dto, companyId);
  }

  @Get('reports')
  @ApiOperation({
    summary: 'Get reports',
    description: 'Returns list of all reports for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
  })
  async getReports(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getReports(companyId);
  }

  @Get('reports/:id')
  @ApiOperation({
    summary: 'Get report by ID',
    description: 'Returns a specific report with preview data.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
  })
  async getReportById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getReportById(id, companyId);
  }

  @Delete('reports/:id')
  @ApiOperation({
    summary: 'Delete report',
    description: 'Deletes a report and its associated file.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  async deleteReport(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.reportingService.deleteReport(id, companyId);
    return { message: 'Report deleted successfully' };
  }

  @Post('templates')
  @ApiOperation({
    summary: 'Create report template',
    description: 'Creates a reusable report template with predefined configuration.',
  })
  @ApiBody({ type: CreateReportTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Report template created successfully',
  })
  async createReportTemplate(
    @Body() dto: CreateReportTemplateDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.createReportTemplate(dto, companyId);
  }

  @Get('templates')
  @ApiOperation({
    summary: 'Get report templates',
    description: 'Returns list of all report templates for the company, optionally filtered by type.',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['LOAN_PORTFOLIO', 'CUSTOMER_ANALYTICS', 'FINANCIAL_SUMMARY', 'COLLECTION_REPORT', 'RISK_ANALYSIS', 'OPERATIONAL_METRICS', 'COMPLIANCE_REPORT', 'CUSTOM'] })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
  })
  async getReportTemplates(
    @Query('type') type: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.reportingService.getReportTemplates(companyId, type as any);
  }
}

