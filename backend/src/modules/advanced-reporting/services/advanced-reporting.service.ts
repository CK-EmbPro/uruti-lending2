import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportType, ReportFormat, ReportStatus } from '../entities/report.entity';
import { ReportTemplate } from '../entities/report-template.entity';
import {
  CreateReportDto,
  ReportResult,
  ReportTemplate as ReportTemplateDto,
  CreateReportTemplateDto,
} from '../dto/advanced-reporting.dto';
import { JsReportService } from '../../jsreport/jsreport.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdvancedReportingService {
  private readonly logger = new Logger(AdvancedReportingService.name);
  private readonly reportDir = process.env.REPORT_DIR || './reports';

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportTemplate)
    private readonly templateRepository: Repository<ReportTemplate>,
    private readonly jsReportService: JsReportService,
  ) {
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Create report
   */
  async createReport(
    dto: CreateReportDto,
    companyId: string,
  ): Promise<ReportResult> {
    this.logger.log(`Creating report: ${dto.name} for company ${companyId}`);

    const report = this.reportRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      format: dto.format,
      status: ReportStatus.GENERATING,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      filters: dto.filters,
      customQuery: dto.customQuery,
      includeCharts: dto.includeCharts !== false,
      includeTables: dto.includeTables !== false,
    });

    const saved = await this.reportRepository.save(report);

    // Generate report asynchronously
    this.generateReport(saved).catch((error) => {
      this.logger.error(`Report generation failed: ${error.message}`, error.stack);
      saved.status = ReportStatus.FAILED;
      saved.errorMessage = error.message;
      this.reportRepository.save(saved);
    });

    return this.mapToResult(saved);
  }

  /**
   * Get reports
   */
  async getReports(companyId: string): Promise<ReportResult[]> {
    const reports = await this.reportRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return reports.map((r) => this.mapToResult(r));
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string, companyId: string): Promise<ReportResult> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, companyId },
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    return this.mapToResult(report);
  }

  /**
   * Create report template
   */
  async createReportTemplate(
    dto: CreateReportTemplateDto,
    companyId: string,
  ): Promise<ReportTemplateDto> {
    // If setting as default, unset other defaults of same type
    if (dto.isDefault) {
      await this.templateRepository.update(
        { companyId, type: dto.type, isDefault: true },
        { isDefault: false },
      );
    }

    const template = this.templateRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      configuration: dto.configuration,
      isDefault: dto.isDefault || false,
    });

    const saved = await this.templateRepository.save(template);

    return this.mapTemplateToDto(saved);
  }

  /**
   * Get report templates
   */
  async getReportTemplates(companyId: string, type?: ReportType): Promise<ReportTemplateDto[]> {
    const where: any = { companyId };
    if (type) {
      where.type = type;
    }

    const templates = await this.templateRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return templates.map((t) => this.mapTemplateToDto(t));
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string, companyId: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, companyId },
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Delete report file
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await this.reportRepository.remove(report);
  }

  // Private helper methods

  private async generateReport(report: Report): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = this.getFileExtension(report.format);
      const fileName = `report-${report.companyId}-${timestamp}.${extension}`;
      const filePath = path.join(this.reportDir, fileName);

      // Generate report data based on type
      const reportData = await this.generateReportData(report);

      // Get template if available
      const template = await this.getTemplateForReport(report);

      // Generate report using jsReport
      let reportBuffer: Buffer;
      const templateContent = template
        ? this.buildTemplateFromConfig(template.configuration, reportData)
        : this.buildDefaultTemplate(report, reportData);

      const templateData = {
        report: reportData,
        metadata: {
          name: report.name,
          type: report.type,
          generatedAt: new Date().toISOString(),
        },
      };

      switch (report.format) {
        case ReportFormat.PDF:
          reportBuffer = await this.jsReportService.renderPdf(
            templateContent,
            templateData,
            {
              format: 'A4',
              orientation: 'portrait',
              margin: '1cm',
            },
          );
          break;

        case ReportFormat.EXCEL:
          reportBuffer = await this.jsReportService.renderExcel(
            templateContent,
            templateData,
          );
          break;

        case ReportFormat.HTML:
          const htmlContent = await this.jsReportService.renderHtml(
            templateContent,
            templateData,
          );
          reportBuffer = Buffer.from(htmlContent, 'utf-8');
          break;

        default:
          // Fallback to JSON for unsupported formats
          const reportContent = {
            name: report.name,
            type: report.type,
            format: report.format,
            data: reportData,
            generatedAt: new Date().toISOString(),
          };
          reportBuffer = Buffer.from(JSON.stringify(reportContent, null, 2), 'utf-8');
      }

      // Write report file
      fs.writeFileSync(filePath, reportBuffer);

      const stats = fs.statSync(filePath);

      report.status = ReportStatus.COMPLETED;
      report.filePath = filePath;
      report.fileSize = stats.size;
      report.completedAt = new Date();
      report.previewData = this.generatePreviewData(reportData);

      await this.reportRepository.save(report);

      this.logger.log(`Report generated: ${report.name} (${filePath})`);
    } catch (error: any) {
      report.status = ReportStatus.FAILED;
      report.errorMessage = error.message;
      await this.reportRepository.save(report);
      throw error;
    }
  }

  private async getTemplateForReport(report: Report): Promise<ReportTemplate | null> {
    // Try to find a template for this report type
    const template = await this.templateRepository.findOne({
      where: {
        companyId: report.companyId,
        type: report.type,
        isDefault: true,
      },
    });

    return template;
  }

  private buildTemplateFromConfig(
    config: Record<string, any>,
    data: Record<string, any>,
  ): string {
    // If config contains template content, use it
    if (config.templateContent) {
      // Sanitize malformed template syntax that might come from database
      let template = config.templateContent;
      // Fix common malformed syntax: {{ report, : .summary.totalAmount }} -> {{report.summary.totalAmount}}
      template = template.replace(/\{\{\s*report\s*,\s*:\s*\.summary\.(\w+)\s*\}\}/g, '{{report.summary.$1}}');
      // Fix other common malformed patterns
      template = template.replace(/\{\{\s*report\s*,\s*:\s*\./g, '{{report.');
      return template;
    }

    // Otherwise build from configuration
    return this.buildDefaultTemplate(null, data);
  }

  private buildDefaultTemplate(
    report: Report | null,
    data: Record<string, any>,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>{{metadata.name}}</h1>
  <p><strong>Type:</strong> {{metadata.type}}</p>
  <p><strong>Generated:</strong> {{generatedAt}}</p>
  
  {{#if report.summary}}
  <h2>Summary</h2>
  <ul>
    <li>Total Loans: {{report.summary.totalLoans}}</li>
    <li>Total Amount: ${'$'}{{report.summary.totalAmount}}</li>
    <li>Active Loans: {{report.summary.activeLoans}}</li>
    <li>Overdue Loans: {{report.summary.overdueLoans}}</li>
  </ul>
  {{/if}}
  
  {{#if report.tables}}
  {{#each report.tables}}
  <h2>Table {{@index}}</h2>
  <table>
    <thead>
      <tr>
        {{#each headers}}
        <th>{{this}}</th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each rows}}
      <tr>
        {{#each this}}
        <td>{{this}}</td>
        {{/each}}
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/each}}
  {{/if}}
</body>
</html>
    `.trim();
  }

  private async generateReportData(report: Report): Promise<Record<string, any>> {
    // In production, would query actual data based on report type
    const mockData: Record<string, any> = {
      summary: {
        totalLoans: 150,
        totalAmount: 5000000,
        activeLoans: 120,
        overdueLoans: 5,
      },
      charts: report.includeCharts ? [
        { type: 'bar', data: [10, 20, 30, 40, 50] },
        { type: 'line', data: [5, 15, 25, 35, 45] },
      ] : [],
      tables: report.includeTables ? [
        { headers: ['Loan ID', 'Customer', 'Amount', 'Status'], rows: [] },
      ] : [],
    };

    return mockData;
  }

  private generatePreviewData(data: Record<string, any>): Record<string, any> {
    return {
      summary: data.summary,
      chartCount: data.charts?.length || 0,
      tableCount: data.tables?.length || 0,
    };
  }

  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'pdf';
      case ReportFormat.EXCEL:
        return 'xlsx';
      case ReportFormat.CSV:
        return 'csv';
      case ReportFormat.JSON:
        return 'json';
      case ReportFormat.HTML:
        return 'html';
      default:
        return 'txt';
    }
  }

  private mapToResult(report: Report): ReportResult {
    return {
      id: report.id,
      name: report.name,
      type: report.type,
      format: report.format,
      status: report.status,
      filePath: report.filePath,
      fileSize: report.fileSize,
      createdAt: report.createdAt.toISOString(),
      completedAt: report.completedAt?.toISOString(),
      errorMessage: report.errorMessage,
      previewData: report.previewData,
    };
  }

  private mapTemplateToDto(template: ReportTemplate): ReportTemplateDto {
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      configuration: template.configuration,
      isDefault: template.isDefault,
      createdAt: template.createdAt.toISOString(),
    };
  }
}

