import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import {
  CohortAnalysisDto,
  CohortAnalysisResult,
  FunnelAnalysisDto,
  FunnelAnalysisResult,
  CustomerSegmentationResult,
} from '../dto/advanced-analytics.dto';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class AdvancedAnalyticsService {
  private readonly logger = new Logger(AdvancedAnalyticsService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Perform cohort analysis
   */
  async performCohortAnalysis(
    dto: CohortAnalysisDto,
    companyId: string,
  ): Promise<CohortAnalysisResult> {
    this.logger.log(`Performing cohort analysis for company ${companyId}`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const cohortType = dto.cohortType || 'MONTHLY';

    // Get all applications/loans
    const applications = await this.applicationRepository.find({
      where: {
        companyId,
        createdAt: Between(startDate, endDate) as any,
      },
    });

    // Group by cohort
    const cohorts = this.groupByCohort(applications, cohortType);

    // Calculate retention and metrics for each cohort
    const cohortData = cohorts.map((cohort) => {
      const retention = this.calculateRetention(cohort.applications, cohortType);
      const revenue = this.calculateCohortRevenue(cohort.applications);
      const ltv = this.calculateLTV(cohort.applications);

      return {
        cohort: cohort.name,
        size: cohort.applications.length,
        retention,
        revenue,
        ltv: Math.round(ltv * 100) / 100,
      };
    });

    // Calculate averages
    const averageRetention = cohortData.reduce((sum, c) => {
      const avgRetention = c.retention.reduce((s, r) => s + r.percentage, 0) / c.retention.length;
      return sum + avgRetention;
    }, 0) / cohortData.length;

    const averageLTV = cohortData.reduce((sum, c) => sum + c.ltv, 0) / cohortData.length;

    return {
      cohorts: cohortData,
      averageRetention: Math.round(averageRetention * 100) / 100,
      averageLTV: Math.round(averageLTV * 100) / 100,
    };
  }

  /**
   * Perform funnel analysis
   */
  async performFunnelAnalysis(
    dto: FunnelAnalysisDto,
    companyId: string,
  ): Promise<FunnelAnalysisResult> {
    this.logger.log(`Performing funnel analysis for company ${companyId}`);

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Get data for each step
    const stepData: Array<{ step: string; count: number }> = [];

    for (const step of dto.steps) {
      let count = 0;

      switch (step.toUpperCase()) {
        case 'VISIT':
          // Would come from analytics
          count = 1000; // Mock data
          break;
        case 'APPLY':
          count = await this.applicationRepository.count({
            where: {
              companyId,
              createdAt: Between(startDate, endDate) as any,
            },
          });
          break;
        case 'APPROVE':
          count = await this.applicationRepository.count({
            where: {
              companyId,
              status: ApplicationStatus.APPROVED,
              createdAt: Between(startDate, endDate) as any,
            },
          });
          break;
        case 'DISBURSE':
          count = await this.loanRepository.count({
            where: {
              companyId,
              status: LoanStatus.DISBURSED,
              createdAt: Between(startDate, endDate) as any,
            },
          });
          break;
      }

      stepData.push({ step, count });
    }

    // Calculate percentages and drop-offs
    const steps = stepData.map((data, index) => {
      const previousCount = index > 0 ? stepData[index - 1].count : data.count;
      const percentage = previousCount > 0 ? (data.count / previousCount) * 100 : 100;
      const dropOff = previousCount > 0 ? previousCount - data.count : 0;

      return {
        step: data.step,
        count: data.count,
        percentage: Math.round(percentage * 100) / 100,
        dropOff,
      };
    });

    // Calculate overall conversion
    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];
    const conversionRate = firstStep.count > 0 ? (lastStep.count / firstStep.count) * 100 : 0;

    // Find bottleneck (step with highest drop-off)
    const bottleneckStep = steps.reduce((max, step) =>
      step.dropOff > max.dropOff ? step : max,
    ).step;

    // Generate recommendations
    const recommendations = this.generateFunnelRecommendations(steps, bottleneckStep);

    return {
      steps,
      conversionRate: Math.round(conversionRate * 100) / 100,
      bottleneckStep,
      recommendations,
    };
  }

  /**
   * Perform customer segmentation
   */
  async performCustomerSegmentation(
    companyId: string,
  ): Promise<CustomerSegmentationResult> {
    this.logger.log(`Performing customer segmentation for company ${companyId}`);

    const loans = await this.loanRepository.find({
      where: { companyId },
    });

    // Segment customers
    const segments = {
      highValue: { customers: new Set<string>(), totalValue: 0 },
      mediumValue: { customers: new Set<string>(), totalValue: 0 },
      lowValue: { customers: new Set<string>(), totalValue: 0 },
      new: { customers: new Set<string>(), totalValue: 0 },
    };

    const customerLoanCounts = new Map<string, number>();
    const customerTotalValue = new Map<string, number>();

    for (const loan of loans) {
      if (loan.applicantId) {
        customerLoanCounts.set(loan.applicantId, (customerLoanCounts.get(loan.applicantId) || 0) + 1);
        customerTotalValue.set(
          loan.applicantId,
          (customerTotalValue.get(loan.applicantId) || 0) + (loan.loanAmount || 0),
        );
      }
    }

    const allCustomers = new Set(customerLoanCounts.keys());
    const totalCustomers = allCustomers.size;

    for (const [customerId, value] of customerTotalValue.entries()) {
      const loanCount = customerLoanCounts.get(customerId) || 0;

      if (loanCount === 1) {
        segments.new.customers.add(customerId);
        segments.new.totalValue += value;
      } else if (value > 500000) {
        segments.highValue.customers.add(customerId);
        segments.highValue.totalValue += value;
      } else if (value > 100000) {
        segments.mediumValue.customers.add(customerId);
        segments.mediumValue.totalValue += value;
      } else {
        segments.lowValue.customers.add(customerId);
        segments.lowValue.totalValue += value;
      }
    }

    const segmentResults = [
      {
        segment: 'High Value',
        size: segments.highValue.customers.size,
        percentage: (segments.highValue.customers.size / totalCustomers) * 100,
        averageValue: segments.highValue.customers.size > 0
          ? segments.highValue.totalValue / segments.highValue.customers.size
          : 0,
        characteristics: {
          averageLoanValue: segments.highValue.customers.size > 0
            ? segments.highValue.totalValue / segments.highValue.customers.size
            : 0,
          multipleLoans: true,
        },
      },
      {
        segment: 'Medium Value',
        size: segments.mediumValue.customers.size,
        percentage: (segments.mediumValue.customers.size / totalCustomers) * 100,
        averageValue: segments.mediumValue.customers.size > 0
          ? segments.mediumValue.totalValue / segments.mediumValue.customers.size
          : 0,
        characteristics: {
          averageLoanValue: segments.mediumValue.customers.size > 0
            ? segments.mediumValue.totalValue / segments.mediumValue.customers.size
            : 0,
        },
      },
      {
        segment: 'Low Value',
        size: segments.lowValue.customers.size,
        percentage: (segments.lowValue.customers.size / totalCustomers) * 100,
        averageValue: segments.lowValue.customers.size > 0
          ? segments.lowValue.totalValue / segments.lowValue.customers.size
          : 0,
        characteristics: {
          averageLoanValue: segments.lowValue.customers.size > 0
            ? segments.lowValue.totalValue / segments.lowValue.customers.size
            : 0,
        },
      },
      {
        segment: 'New Customers',
        size: segments.new.customers.size,
        percentage: (segments.new.customers.size / totalCustomers) * 100,
        averageValue: segments.new.customers.size > 0
          ? segments.new.totalValue / segments.new.customers.size
          : 0,
        characteristics: {
          firstLoan: true,
        },
      },
    ];

    return {
      segments: segmentResults.map((s) => ({
        ...s,
        percentage: Math.round(s.percentage * 100) / 100,
        averageValue: Math.round(s.averageValue * 100) / 100,
      })),
      totalCustomers,
    };
  }

  // Private helper methods

  private groupByCohort(
    applications: LoanApplication[],
    cohortType: string,
  ): Array<{ name: string; applications: LoanApplication[] }> {
    const cohorts = new Map<string, LoanApplication[]>();

    for (const app of applications) {
      const cohortKey = this.getCohortKey(app.createdAt, cohortType);
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, []);
      }
      cohorts.get(cohortKey)!.push(app);
    }

    return Array.from(cohorts.entries()).map(([name, applications]) => ({
      name,
      applications,
    }));
  }

  private getCohortKey(date: Date, cohortType: string): string {
    if (cohortType === 'MONTHLY') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (cohortType === 'WEEKLY') {
      const week = Math.ceil(date.getDate() / 7);
      return `${date.getFullYear()}-W${week}`;
    } else if (cohortType === 'QUARTERLY') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    } else {
      return date.toISOString().split('T')[0];
    }
  }

  private calculateRetention(
    applications: LoanApplication[],
    cohortType: string,
  ): Array<{ period: string; value: number; percentage: number }> {
    // Simplified retention calculation
    const retention: Array<{ period: string; value: number; percentage: number }> = [];
    const initialSize = applications.length;

    // Calculate retention for each period
    for (let i = 1; i <= 12; i++) {
      const period = `Period ${i}`;
      const retained = Math.round(initialSize * Math.pow(0.95, i)); // 5% churn per period
      retention.push({
        period,
        value: retained,
        percentage: (retained / initialSize) * 100,
      });
    }

    return retention;
  }

  private calculateCohortRevenue(applications: LoanApplication[]): Array<{ period: string; value: number }> {
    const revenue: Array<{ period: string; value: number }> = [];
    const averageLoanAmount = applications.reduce((sum, app) => sum + (app.requestedAmount || 0), 0) / applications.length;

    for (let i = 1; i <= 12; i++) {
      revenue.push({
        period: `Period ${i}`,
        value: Math.round(averageLoanAmount * 0.1 * i), // Simplified revenue growth
      });
    }

    return revenue;
  }

  private calculateLTV(applications: LoanApplication[]): number {
    const averageLoanAmount = applications.reduce((sum, app) => sum + (app.requestedAmount || 0), 0) / applications.length;
    // Simplified LTV calculation
    return averageLoanAmount * 2.5; // Assume 2.5x LTV
  }

  private generateFunnelRecommendations(
    steps: Array<{ step: string; dropOff: number; percentage: number }>,
    bottleneckStep: string,
  ): string[] {
    const recommendations: string[] = [];

    const bottleneck = steps.find((s) => s.step === bottleneckStep);
    if (bottleneck && bottleneck.dropOff > 0) {
      recommendations.push(`High drop-off at ${bottleneckStep} step (${bottleneck.dropOff} users). Review and optimize this step.`);
    }

    const lowConversionSteps = steps.filter((s) => s.percentage < 50);
    if (lowConversionSteps.length > 0) {
      recommendations.push(`Multiple steps with low conversion rates. Consider A/B testing to improve conversion.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Funnel performance is good. Continue monitoring and optimizing.');
    }

    return recommendations;
  }
}

