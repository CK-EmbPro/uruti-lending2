import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomReport } from '../entities/custom-report.entity';
import { AdvancedDashboard } from '../entities/advanced-dashboard.entity';
import { DataVisualization } from '../entities/data-visualization.entity';
import { DataInsight } from '../entities/data-insight.entity';
import {
  CreateCustomReportDto,
  CreateDashboardDto,
  CreateVisualizationDto,
  CustomReport as CustomReportDto,
  Dashboard as DashboardDto,
  DataInsight as DataInsightDto,
  ReportType,
  ReportStatus,
  ChartType,
} from '../dto/advanced-analytics-bi.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

@Injectable()
export class AdvancedAnalyticsBIService {
  private readonly logger = new Logger(AdvancedAnalyticsBIService.name);

  constructor(
    @InjectRepository(CustomReport)
    private reportRepository: Repository<CustomReport>,
    @InjectRepository(AdvancedDashboard)
    private dashboardRepository: Repository<AdvancedDashboard>,
    @InjectRepository(DataVisualization)
    private visualizationRepository: Repository<DataVisualization>,
    @InjectRepository(DataInsight)
    private insightRepository: Repository<DataInsight>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private repaymentRepository: Repository<LoanRepayment>,
  ) {}

  async createCustomReport(createDto: CreateCustomReportDto, userId: string): Promise<CustomReport> {
    const report = this.reportRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.reportRepository.save(report);
  }

  async findAllReports(reportType?: ReportType, status?: ReportStatus): Promise<CustomReport[]> {
    const where: any = {};
    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    return this.reportRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneReport(id: string): Promise<CustomReport> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Custom report with ID ${id} not found`);
    }
    return report;
  }

  async executeReport(reportId: string, parameters?: Record<string, any>): Promise<Record<string, any>> {
    const report = await this.findOneReport(reportId);

    // TODO: Execute SQL query or data source
    // This is a placeholder that simulates report execution
    this.logger.log(`Executing report ${reportId} with parameters: ${JSON.stringify(parameters)}`);

    // Simulate query execution
    const result = await this.simulateReportExecution(report, parameters);

    // Update report
    report.executionCount += 1;
    report.lastExecutedAt = new Date();
    report.lastResult = result;
    await this.reportRepository.save(report);

    return result;
  }

  private async simulateReportExecution(
    report: CustomReport,
    parameters?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // In production, this would:
    // 1. Parse SQL query or data source
    // 2. Replace parameters
    // 3. Execute query
    // 4. Format results

    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      rows: [],
      rowCount: 0,
      columns: [],
      executionTime: 125,
    };
  }

  async createDashboard(createDto: CreateDashboardDto, userId: string): Promise<AdvancedDashboard> {
    const dashboard = this.dashboardRepository.create({
      ...createDto,
      widgetCount: createDto.widgets?.length || 0,
      widgets: createDto.widgets || [],
      createdBy: userId,
    });

    return this.dashboardRepository.save(dashboard);
  }

  async findAllDashboards(isPublic?: boolean, userId?: string): Promise<AdvancedDashboard[]> {
    const where: any = {};
    if (isPublic !== undefined) where.isPublic = isPublic;
    if (userId && !isPublic) where.createdBy = userId;

    return this.dashboardRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneDashboard(id: string): Promise<AdvancedDashboard> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    // Increment view count
    dashboard.viewCount += 1;
    await this.dashboardRepository.save(dashboard);

    return dashboard;
  }

  async createVisualization(
    createDto: CreateVisualizationDto,
    userId: string,
  ): Promise<DataVisualization> {
    const visualization = this.visualizationRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.visualizationRepository.save(visualization);
  }

  async findAllVisualizations(): Promise<DataVisualization[]> {
    return this.visualizationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async generateInsights(): Promise<DataInsight[]> {
    const insights: DataInsight[] = [];

    // Analyze portfolio growth trend
    const portfolioTrend = await this.analyzePortfolioTrend();
    if (portfolioTrend) {
      insights.push(portfolioTrend);
    }

    // Detect anomalies
    const anomalies = await this.detectAnomalies();
    insights.push(...anomalies);

    // Generate predictions
    const predictions = await this.generatePredictions();
    insights.push(...predictions);

    // Save insights
    if (insights.length > 0) {
      return this.insightRepository.save(insights);
    }

    return [];
  }

  private async analyzePortfolioTrend(): Promise<DataInsight | null> {
    // TODO: Analyze portfolio growth trends
    // This is a placeholder
    const insight = this.insightRepository.create({
      insightType: 'TREND',
      title: 'Portfolio Growth Trend',
      description: 'Portfolio has shown consistent growth over the past 6 months',
      confidence: 0.85,
      recommendations: [
        'Continue current growth strategy',
        'Monitor portfolio quality metrics',
      ],
      dataPoints: {
        growthRate: 15.5,
        period: '6 months',
      },
      generatedAt: new Date(),
    });

    return insight;
  }

  private async detectAnomalies(): Promise<DataInsight[]> {
    // TODO: Detect anomalies in data
    // This is a placeholder
    return [];
  }

  private async generatePredictions(): Promise<DataInsight[]> {
    // TODO: Generate predictive insights
    // This is a placeholder
    return [];
  }

  async getInsights(insightType?: string, limit: number = 50): Promise<DataInsight[]> {
    const where: any = {};
    if (insightType) where.insightType = insightType;

    return this.insightRepository.find({
      where,
      order: { generatedAt: 'DESC' },
      take: limit,
    });
  }

  async getAnalyticsSummary(): Promise<Record<string, any>> {
    const totalLoans = await this.loanRepository.count();
    const totalApplications = await this.applicationRepository.count();
    const totalRepayments = await this.repaymentRepository.count();

    // Calculate approval rate
    const approvedApplications = await this.applicationRepository.count({
      where: { status: 'APPROVED' as any },
    });
    const approvalRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;

    return {
      totalLoans,
      totalApplications,
      totalRepayments,
      approvalRate,
      activeReports: await this.reportRepository.count({ where: { status: ReportStatus.PUBLISHED } }),
      activeDashboards: await this.dashboardRepository.count(),
      totalInsights: await this.insightRepository.count(),
    };
  }
}

