import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CustomerJourney, JourneyStage, TouchpointType } from '../entities/customer-journey.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import {
  GetCustomerJourneyDto,
  CustomerJourneyResult,
  JourneyAnalytics,
} from '../dto/customer-journey.dto';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class CustomerJourneyService {
  private readonly logger = new Logger(CustomerJourneyService.name);

  constructor(
    @InjectRepository(CustomerJourney)
    private readonly journeyRepository: Repository<CustomerJourney>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Get customer journey
   */
  async getCustomerJourney(
    dto: GetCustomerJourneyDto,
    companyId: string,
  ): Promise<CustomerJourneyResult> {
    this.logger.log(`Getting customer journey for customer ${dto.customerId}`);

    // Get or create journey
    let journey = await this.journeyRepository.findOne({
      where: { customerId: dto.customerId, companyId },
    });

    if (!journey) {
      journey = this.journeyRepository.create({
        companyId,
        customerId: dto.customerId,
        currentStage: JourneyStage.AWARENESS,
        timeline: [],
        timeInStages: {},
        totalDuration: 0,
        conversionRate: 0,
        dropOffPoints: [],
        engagementScore: 0,
      });
    }

    // Build timeline from customer data
    const timeline = await this.buildTimeline(dto.customerId, companyId, dto.startDate, dto.endDate);

    // Calculate metrics
    const timeInStages = this.calculateTimeInStages(timeline);
    const totalDuration = this.calculateTotalDuration(timeline);
    const currentStage = await this.determineCurrentStage(dto.customerId, companyId);
    const conversionRate = this.calculateConversionRate(timeline);
    const dropOffPoints = this.identifyDropOffPoints(timeline);
    const engagementScore = this.calculateEngagementScore(timeline);
    const recommendedActions = this.generateRecommendedActions(currentStage, timeline);

    // Update journey
    journey.timeline = timeline;
    journey.currentStage = currentStage;
    journey.timeInStages = timeInStages;
    journey.totalDuration = totalDuration;
    journey.conversionRate = conversionRate;
    journey.dropOffPoints = dropOffPoints;
    journey.engagementScore = engagementScore;

    await this.journeyRepository.save(journey);

    return {
      customerId: dto.customerId,
      currentStage,
      timeline,
      timeInStages,
      totalDuration,
      conversionRate,
      dropOffPoints,
      engagementScore,
      recommendedActions,
    };
  }

  /**
   * Get journey analytics
   */
  async getJourneyAnalytics(
    companyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<JourneyAnalytics> {
    this.logger.log(`Getting journey analytics for company ${companyId}`);

    const journeys = await this.journeyRepository.find({
      where: { companyId },
    });

    // Calculate average time in stages
    const averageTimeInStages: Record<JourneyStage, number> = {} as any;
    for (const stage of Object.values(JourneyStage)) {
      const times = journeys
        .map((j) => j.timeInStages?.[stage] || 0)
        .filter((t) => t > 0);
      averageTimeInStages[stage] = times.length > 0
        ? times.reduce((sum, t) => sum + t, 0) / times.length
        : 0;
    }

    // Calculate stage conversion rates
    const stageConversionRates: Record<JourneyStage, number> = {} as any;
    const stages = Object.values(JourneyStage);
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      const reachedCurrent = journeys.filter((j) =>
        j.timeline.some((t) => t.stage === currentStage),
      ).length;
      const reachedNext = journeys.filter((j) =>
        j.timeline.some((t) => t.stage === nextStage),
      ).length;
      stageConversionRates[currentStage] = reachedCurrent > 0 ? reachedNext / reachedCurrent : 0;
    }

    // Drop-off analysis
    const dropOffReasons = new Map<JourneyStage, number>();
    journeys.forEach((j) => {
      j.dropOffPoints?.forEach((drop) => {
        dropOffReasons.set(drop.stage, (dropOffReasons.get(drop.stage) || 0) + 1);
      });
    });

    const highestDropOffStage = Array.from(dropOffReasons.entries()).reduce(
      (max, [stage, count]) => (count > max[1] ? [stage, count] : max),
      [JourneyStage.AWARENESS, 0] as [JourneyStage, number],
    )[0];

    const dropOffAnalysis = {
      highestDropOffStage,
      dropOffRate: journeys.length > 0
        ? journeys.filter((j) => j.dropOffPoints && j.dropOffPoints.length > 0).length / journeys.length
        : 0,
      reasons: Array.from(dropOffReasons.entries()).map(([stage, count]) => ({
        stage,
        count,
        percentage: (count / journeys.length) * 100,
      })),
    };

    // Touchpoint effectiveness
    const touchpointStats = new Map<TouchpointType, { count: number; conversions: number }>();
    journeys.forEach((j) => {
      j.timeline.forEach((event) => {
        const stats = touchpointStats.get(event.touchpoint) || { count: 0, conversions: 0 };
        stats.count++;
        if (event.stage === JourneyStage.DISBURSEMENT) {
          stats.conversions++;
        }
        touchpointStats.set(event.touchpoint, stats);
      });
    });

    const touchpointEffectiveness = Array.from(touchpointStats.entries()).map(([touchpoint, stats]) => ({
      touchpoint,
      count: stats.count,
      conversionRate: stats.count > 0 ? stats.conversions / stats.count : 0,
      averageTimeToNext: 0, // Would calculate from timeline
    }));

    // Journey paths
    const pathCounts = new Map<string, { count: number; durations: number[] }>();
    journeys.forEach((j) => {
      const path = j.timeline.map((t) => t.stage).join('->');
      const existing = pathCounts.get(path) || { count: 0, durations: [] };
      existing.count++;
      existing.durations.push(j.totalDuration || 0);
      pathCounts.set(path, existing);
    });

    const journeyPaths = Array.from(pathCounts.entries()).map(([path, data]) => ({
      path: path.split('->') as any, // Convert string array to JourneyStage array
      count: data.count,
      percentage: (data.count / journeys.length) * 100,
      averageDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length,
    }));

    return {
      averageTimeInStages: Object.fromEntries(
        Object.entries(averageTimeInStages).map(([k, v]) => [k, Math.round(v * 100) / 100]),
      ) as any,
      stageConversionRates: Object.fromEntries(
        Object.entries(stageConversionRates).map(([k, v]) => [k, Math.round(v * 100) / 100]),
      ) as any,
      dropOffAnalysis: {
        ...dropOffAnalysis,
        dropOffRate: Math.round(dropOffAnalysis.dropOffRate * 100) / 100,
        reasons: dropOffAnalysis.reasons.map((r) => ({
          ...r,
          percentage: Math.round(r.percentage * 100) / 100,
        })),
      },
      touchpointEffectiveness: touchpointEffectiveness.map((t) => ({
        ...t,
        conversionRate: Math.round(t.conversionRate * 100) / 100,
      })),
      journeyPaths: journeyPaths.map((p) => ({
        ...p,
        percentage: Math.round(p.percentage * 100) / 100,
        averageDuration: Math.round(p.averageDuration * 100) / 100,
      })),
    };
  }

  // Private helper methods

  private async buildTimeline(
    customerId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Array<{
    date: string;
    stage: JourneyStage;
    touchpoint: TouchpointType;
    description: string;
    metadata: Record<string, any>;
  }>> {
    const timeline: Array<{
      date: string;
      stage: JourneyStage;
      touchpoint: TouchpointType;
      description: string;
      metadata: Record<string, any>;
    }> = [];

    // Get applications
    const applications = await this.applicationRepository.find({
      where: { applicantId: customerId, companyId },
      order: { createdAt: 'ASC' },
    });

    // Get loans
    const loans = await this.loanRepository.find({
      where: { applicantId: customerId, companyId },
      order: { createdAt: 'ASC' },
    });

    // Add application events
    for (const app of applications) {
      timeline.push({
        date: app.createdAt.toISOString(),
        stage: JourneyStage.APPLICATION,
        touchpoint: TouchpointType.APPLICATION_START,
        description: `Application ${app.applicationNumber} started`,
        metadata: { applicationId: app.id },
      });

      if (app.status === ApplicationStatus.SUBMITTED) {
        timeline.push({
          date: app.updatedAt.toISOString(),
          stage: JourneyStage.APPLICATION,
          touchpoint: TouchpointType.APPLICATION_SUBMIT,
          description: `Application ${app.applicationNumber} submitted`,
          metadata: { applicationId: app.id },
        });
      }

      if (app.status === ApplicationStatus.APPROVED) {
        timeline.push({
          date: app.updatedAt.toISOString(),
          stage: JourneyStage.APPROVAL,
          touchpoint: TouchpointType.APPROVAL_NOTIFICATION,
          description: `Application ${app.applicationNumber} approved`,
          metadata: { applicationId: app.id, approvedAmount: app.approvedAmount },
        });
      }
    }

    // Add loan events
    for (const loan of loans) {
      if (loan.status === LoanStatus.DISBURSED) {
        timeline.push({
          date: loan.postingDate?.toISOString() || loan.createdAt.toISOString(),
          stage: JourneyStage.DISBURSEMENT,
          touchpoint: TouchpointType.LOAN_DISBURSEMENT,
          description: `Loan ${loan.loanNumber} disbursed`,
          metadata: { loanId: loan.id, amount: loan.disbursedAmount },
        });
      }

      if (loan.status === LoanStatus.ACTIVE) {
        timeline.push({
          date: loan.postingDate?.toISOString() || loan.createdAt.toISOString(),
          stage: JourneyStage.ACTIVE_LOAN,
          touchpoint: TouchpointType.PAYMENT,
          description: `Loan ${loan.loanNumber} active`,
          metadata: { loanId: loan.id },
        });
      }
    }

    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return timeline;
  }

  private calculateTimeInStages(
    timeline: Array<{ date: string; stage: JourneyStage }>,
  ): Record<JourneyStage, number> {
    const timeInStages: Record<JourneyStage, number> = {} as any;

    for (let i = 0; i < timeline.length - 1; i++) {
      const current = timeline[i];
      const next = timeline[i + 1];
      const days = (new Date(next.date).getTime() - new Date(current.date).getTime()) / (1000 * 60 * 60 * 24);
      timeInStages[current.stage] = (timeInStages[current.stage] || 0) + days;
    }

    return timeInStages;
  }

  private calculateTotalDuration(timeline: Array<{ date: string }>): number {
    if (timeline.length < 2) return 0;
    const first = new Date(timeline[0].date);
    const last = new Date(timeline[timeline.length - 1].date);
    return Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async determineCurrentStage(
    customerId: string,
    companyId: string,
  ): Promise<JourneyStage> {
    // Check for active loans
    const activeLoans = await this.loanRepository.find({
      where: { applicantId: customerId, companyId, status: LoanStatus.ACTIVE },
    });

    if (activeLoans.length > 0) {
      return JourneyStage.ACTIVE_LOAN;
    }

    // Check for pending applications
    const pendingApps = await this.applicationRepository.find({
      where: {
        applicantId: customerId,
        companyId,
        status: ApplicationStatus.UNDER_REVIEW,
      },
    });

    if (pendingApps.length > 0) {
      return JourneyStage.APPROVAL;
    }

    // Check for submitted applications
    const submittedApps = await this.applicationRepository.find({
      where: {
        applicantId: customerId,
        companyId,
        status: ApplicationStatus.SUBMITTED,
      },
    });

    if (submittedApps.length > 0) {
      return JourneyStage.APPLICATION;
    }

    return JourneyStage.CONSIDERATION;
  }

  private calculateConversionRate(
    timeline: Array<{ stage: JourneyStage }>,
  ): number {
    const hasApplication = timeline.some((t) => t.stage === JourneyStage.APPLICATION);
    const hasDisbursement = timeline.some((t) => t.stage === JourneyStage.DISBURSEMENT);

    if (!hasApplication) return 0;
    return hasDisbursement ? 1.0 : 0.5; // Simplified
  }

  private identifyDropOffPoints(
    timeline: Array<{ date: string; stage: JourneyStage }>,
  ): Array<{ stage: JourneyStage; date: string; reason: string }> {
    const dropOffs: Array<{ stage: JourneyStage; date: string; reason: string }> = [];

    // Check for gaps in timeline
    for (let i = 0; i < timeline.length - 1; i++) {
      const current = timeline[i];
      const next = timeline[i + 1];
      const daysBetween = (new Date(next.date).getTime() - new Date(current.date).getTime()) / (1000 * 60 * 60 * 24);

      if (daysBetween > 30) {
        dropOffs.push({
          stage: current.stage,
          date: current.date,
          reason: `Long gap (${Math.round(daysBetween)} days) between stages`,
        });
      }
    }

    return dropOffs;
  }

  private calculateEngagementScore(
    timeline: Array<{ touchpoint: TouchpointType }>,
  ): number {
    // Calculate based on number of touchpoints and types
    const touchpointWeights: Record<TouchpointType, number> = {
      [TouchpointType.WEBSITE_VISIT]: 5,
      [TouchpointType.CALCULATOR_USE]: 10,
      [TouchpointType.APPLICATION_START]: 20,
      [TouchpointType.APPLICATION_SUBMIT]: 30,
      [TouchpointType.DOCUMENT_UPLOAD]: 15,
      [TouchpointType.APPROVAL_NOTIFICATION]: 25,
      [TouchpointType.LOAN_DISBURSEMENT]: 40,
      [TouchpointType.PAYMENT]: 20,
      [TouchpointType.SUPPORT_CONTACT]: 10,
      [TouchpointType.PORTAL_LOGIN]: 15,
    };

    let score = 0;
    timeline.forEach((event) => {
      score += touchpointWeights[event.touchpoint] || 5;
    });

    return Math.min(100, score);
  }

  private generateRecommendedActions(
    currentStage: JourneyStage,
    timeline: Array<{ stage: JourneyStage; touchpoint: TouchpointType }>,
  ): string[] {
    const recommendations: string[] = [];

    switch (currentStage) {
      case JourneyStage.CONSIDERATION:
        recommendations.push('Complete loan application', 'Use loan calculator', 'Check eligibility');
        break;
      case JourneyStage.APPLICATION:
        recommendations.push('Upload required documents', 'Complete application form', 'Review application details');
        break;
      case JourneyStage.APPROVAL:
        recommendations.push('Wait for approval decision', 'Check application status', 'Contact support if needed');
        break;
      case JourneyStage.ACTIVE_LOAN:
        recommendations.push('Make regular payments', 'View loan details', 'Set up auto-pay');
        break;
      default:
        recommendations.push('Explore loan products', 'Check interest rates', 'Calculate loan amount');
    }

    return recommendations;
  }
}

