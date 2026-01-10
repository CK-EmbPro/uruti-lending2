import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Res,
  Header,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { ReportingAnalyticsService } from './reporting-analytics.service';
import { ReportingExportService } from './reporting-export.service';
import { PortfolioReportDto } from './dto/portfolio-report.dto';
import { NpaReportDto } from './dto/npa-report.dto';
import { CollectionReportDto } from './dto/collection-report.dto';
import { PortfolioPerformanceDto } from './dto/portfolio-performance.dto';
import { GenerateRegulatoryReportDto, ReviewRegulatoryReportDto, SubmitRegulatoryReportDto } from './dto/regulatory-report.dto';
import { RollRateAnalysisDto } from './dto/roll-rate-analysis.dto';
import { FairLendingAnalysisDto, ReviewFairLendingAnalysisDto } from './dto/fair-lending-analysis.dto';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly analyticsService: ReportingAnalyticsService,
    private readonly exportService: ReportingExportService,
  ) {}

  @Get('portfolio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get portfolio report',
    description: 'Generates a comprehensive loan portfolio report with outstanding amounts and loan status breakdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio report generated successfully',
  })
  async getPortfolioReport(@Query() filters: PortfolioReportDto) {
    return this.reportingService.getPortfolioReport(filters);
  }

  @Get('npa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get NPA report',
    description: 'Generates a Non-Performing Assets report with classification details',
  })
  @ApiResponse({
    status: 200,
    description: 'NPA report generated successfully',
  })
  async getNpaReport(@Query() filters: NpaReportDto) {
    return this.reportingService.getNpaReport(filters);
  }

  @Get('collection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get collection report',
    description: 'Generates a collection report showing repayments for a specified period',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection report generated successfully',
  })
  async getCollectionReport(@Query() filters: CollectionReportDto) {
    return this.reportingService.getCollectionReport(filters);
  }

  @Get('disbursement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get disbursement report',
    description: 'Generates a disbursement report showing loan disbursements for a specified period',
  })
  @ApiQuery({ name: 'fromDate', required: false, description: 'From date (ISO 8601)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'To date (ISO 8601)' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Company ID' })
  @ApiQuery({ name: 'loanProductId', required: false, description: 'Loan Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Disbursement report generated successfully',
  })
  async getDisbursementReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('companyId') companyId?: string,
    @Query('loanProductId') loanProductId?: string,
  ) {
    return this.reportingService.getDisbursementReport({
      fromDate,
      toDate,
      companyId,
      loanProductId,
    });
  }

  @Get('overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get overdue report',
    description: 'Generates an overdue loans report showing loans past due with DPD ranges',
  })
  @ApiQuery({ name: 'asOnDate', required: false, description: 'As on date (ISO 8601)' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Company ID' })
  @ApiQuery({ name: 'loanProductId', required: false, description: 'Loan Product ID' })
  @ApiQuery({ name: 'minDaysPastDue', required: false, description: 'Minimum days past due', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Overdue report generated successfully',
  })
  async getOverdueReport(
    @Query('asOnDate') asOnDate?: string,
    @Query('companyId') companyId?: string,
    @Query('loanProductId') loanProductId?: string,
    @Query('minDaysPastDue') minDaysPastDue?: number,
  ) {
    return this.reportingService.getOverdueReport({
      asOnDate,
      companyId,
      loanProductId,
      minDaysPastDue: minDaysPastDue ? parseInt(String(minDaysPastDue), 10) : undefined,
    });
  }

  @Get('portfolio/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="portfolio-report.csv"')
  @ApiOperation({
    summary: 'Export portfolio report as CSV',
    description: 'Exports the portfolio report as a CSV file',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportPortfolioReport(
    @Query() filters: PortfolioReportDto,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportPortfolioReportAsCsv(filters);
    res.send(csv);
  }

  @Get('npa/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="npa-report.csv"')
  @ApiOperation({
    summary: 'Export NPA report as CSV',
    description: 'Exports the NPA report as a CSV file',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportNpaReport(
    @Query() filters: NpaReportDto,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportNpaReportAsCsv(filters);
    res.send(csv);
  }

  @Get('collection/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="collection-report.csv"')
  @ApiOperation({
    summary: 'Export collection report as CSV',
    description: 'Exports the collection report as a CSV file',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportCollectionReport(
    @Query() filters: CollectionReportDto,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportCollectionReportAsCsv(filters);
    res.send(csv);
  }

  @Get('overdue/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="overdue-report.csv"')
  @ApiOperation({
    summary: 'Export overdue report as CSV',
    description: 'Exports the overdue report as a CSV file',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportOverdueReport(
    @Res() res: Response,
    @Query('asOnDate') asOnDate?: string,
    @Query('companyId') companyId?: string,
    @Query('loanProductId') loanProductId?: string,
    @Query('minDaysPastDue') minDaysPastDue?: number,
  ) {
    const csv = await this.exportService.exportOverdueReportAsCsv({
      asOnDate,
      companyId,
      loanProductId,
      minDaysPastDue: minDaysPastDue ? parseInt(String(minDaysPastDue), 10) : undefined,
    });
    res.send(csv);
  }

  /**
   * UC-036: Portfolio Performance Dashboard
   */
  @Get('portfolio-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get portfolio performance dashboard',
    description: 'Generates comprehensive portfolio performance metrics with drill-down capabilities',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio performance data generated successfully',
  })
  async getPortfolioPerformance(@Query() filters: PortfolioPerformanceDto) {
    try {
      return await this.analyticsService.getPortfolioPerformance(filters);
    } catch (error) {
      console.error('Error in getPortfolioPerformance controller:', error);
      // Re-throw to let NestJS handle it with proper HTTP status
      throw error;
    }
  }

  /**
   * UC-037: Regulatory Report Generation
   */
  @Post('regulatory-reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate regulatory report',
    description: 'Generates regulatory reports (HMDA, CRA, Call Reports, Stress Tests)',
  })
  @ApiResponse({
    status: 201,
    description: 'Regulatory report generated successfully',
  })
  async generateRegulatoryReport(
    @Body() dto: GenerateRegulatoryReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.generateRegulatoryReport(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('regulatory-reports/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Review regulatory report',
    description: 'Marks a regulatory report as reviewed',
  })
  async reviewRegulatoryReport(
    @Param('id') id: string,
    @Body() dto: ReviewRegulatoryReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.reviewRegulatoryReport(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('regulatory-reports/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit regulatory report',
    description: 'Submits a regulatory report to the regulator',
  })
  async submitRegulatoryReport(
    @Param('id') id: string,
    @Body() dto: SubmitRegulatoryReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.submitRegulatoryReport(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-038: Delinquency Roll Rate Analysis
   */
  @Post('roll-rate-analysis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate roll rate analysis',
    description: 'Calculates movement between delinquency buckets and forecasts future losses',
  })
  @ApiResponse({
    status: 201,
    description: 'Roll rate analysis generated successfully',
  })
  async generateRollRateAnalysis(@Body() dto: RollRateAnalysisDto) {
    return this.analyticsService.generateRollRateAnalysis(dto);
  }

  /**
   * UC-039: Fair Lending Analysis
   */
  @Post('fair-lending-analysis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate fair lending analysis',
    description: 'Compares approval rates by protected class and identifies disparities',
  })
  @ApiResponse({
    status: 201,
    description: 'Fair lending analysis generated successfully',
  })
  async generateFairLendingAnalysis(@Body() dto: FairLendingAnalysisDto) {
    return this.analyticsService.generateFairLendingAnalysis(dto);
  }

  @Post('fair-lending-analysis/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Review fair lending analysis',
    description: 'Marks a fair lending analysis as reviewed and documents corrective action',
  })
  async reviewFairLendingAnalysis(
    @Param('id') id: string,
    @Body() dto: ReviewFairLendingAnalysisDto,
    @Request() req: any,
  ) {
    return this.analyticsService.reviewFairLendingAnalysis(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }
}

