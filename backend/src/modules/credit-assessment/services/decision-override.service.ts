import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditDecision, DecisionType, DecisionOutcome } from '../entities/credit-decision.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { OverrideDecisionDto } from '../dto/credit-decision.dto';
import { OverrideApprovalService } from './override-approval.service';
import { OverrideAuditService } from './override-audit.service';
import { OverrideApprovalStatus } from '../entities/override-approval.entity';

/**
 * Service for credit decision override
 * UC-008: Credit Decision Override
 */
@Injectable()
export class DecisionOverrideService {
  private readonly logger = new Logger(DecisionOverrideService.name);

  constructor(
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    private readonly overrideApprovalService: OverrideApprovalService,
    private readonly overrideAuditService: OverrideAuditService,
  ) {}

  /**
   * Override a declined application decision
   * Only senior underwriters can override
   */
  async overrideDecision(
    applicationId: string,
    overrideDto: OverrideDecisionDto,
    userId: string,
    userRoles: string[],
  ): Promise<{ decision: CreditDecision; application: LoanApplication; requiresDualApproval?: boolean; approvalStatus?: OverrideApprovalStatus }> {
    // Check if user has override authority
    if (!this.hasOverrideAuthority(userRoles)) {
      throw new ForbiddenException('You do not have authority to override credit decisions');
    }

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Check if application is declined
    if (application.status !== ApplicationStatus.REJECTED) {
      throw new BadRequestException('Can only override declined applications');
    }

    // Get the original decision
    const originalDecision = await this.creditDecisionRepository.findOne({
      where: { applicationId },
      order: { decisionDate: 'DESC' },
    });

    if (!originalDecision) {
      throw new NotFoundException('No credit decision found for this application');
    }

    if (originalDecision.outcome === DecisionOutcome.APPROVED) {
      throw new BadRequestException('Cannot override an approved decision');
    }

    // Check override limits based on amount
    const overrideLimit = this.getOverrideLimit(userRoles);
    if (overrideDto.approvedAmount > overrideLimit) {
      throw new BadRequestException(
        `Override amount (${overrideDto.approvedAmount}) exceeds your limit (${overrideLimit})`,
      );
    }

    // Create override decision
    const overrideDecision = this.creditDecisionRepository.create({
      applicationId: application.id,
      decisionType: DecisionType.OVERRIDE,
      outcome: overrideDto.conditions
        ? DecisionOutcome.CONDITIONALLY_APPROVED
        : DecisionOutcome.APPROVED,
      creditScore: originalDecision.creditScore, // Keep original score
      debtToIncomeRatio: originalDecision.debtToIncomeRatio,
      approvedAmount: overrideDto.approvedAmount,
      approvedInterestRate: overrideDto.approvedInterestRate,
      approvedTerm: overrideDto.approvedTerm,
      decisionRationale: `Override: ${overrideDto.overrideJustification}`,
      riskFactors: originalDecision.riskFactors,
      scoringFactors: originalDecision.scoringFactors,
      decisionDate: new Date(),
      decisionBy: userId,
      conditions: overrideDto.conditions,
      isOverride: true,
      overrideJustification: overrideDto.overrideJustification,
    });

    const savedDecision = await this.creditDecisionRepository.save(overrideDecision);

    // Create audit record (application already fetched above)
    const companyId = application.companyId || '';

    await this.overrideAuditService.createAuditRecord(
      savedDecision.id,
      companyId,
      originalDecision,
      savedDecision,
    );

    // Check if dual approval is required
    const dualApprovalThreshold = this.getDualApprovalThreshold(userRoles);
    const requiresDualApproval = overrideDto.approvedAmount >= dualApprovalThreshold;

    if (requiresDualApproval) {
      // Create approval workflow - application stays in REJECTED until both approvals
      await this.overrideApprovalService.createOverrideApproval(
        savedDecision.id,
        overrideDto.approvedAmount,
        userId,
        '', // Would need to fetch user name
        userRoles[0] || '',
        companyId,
        dualApprovalThreshold,
      );

      this.logger.log(
        `Override decision created for application ${application.applicationNumber} - awaiting dual approval`,
      );

      return {
        decision: savedDecision,
        application: application,
        requiresDualApproval: true,
        approvalStatus: OverrideApprovalStatus.PENDING_FIRST,
      };
    } else {
      // Single approval - update application status immediately
      application.status = overrideDto.conditions
        ? ApplicationStatus.UNDER_REVIEW
        : ApplicationStatus.APPROVED;
      application.approvalDate = new Date();
      application.approvedBy = userId;
      application.approvedAmount = overrideDto.approvedAmount;

      const savedApplication = await this.applicationRepository.save(application);

      this.logger.log(
        `Decision override performed for application ${application.applicationNumber} by user ${userId}`,
      );

      // Log override for compliance tracking
      await this.logOverrideForCompliance(savedDecision, originalDecision, userId);

      return { decision: savedDecision, application: savedApplication, requiresDualApproval: false };
    }
  }

  /**
   * Check if user has override authority
   */
  private hasOverrideAuthority(userRoles: string[]): boolean {
    const authorizedRoles = ['Senior Underwriter', 'Credit Manager', 'Chief Credit Officer', 'Admin'];
    return userRoles.some((role) => authorizedRoles.includes(role));
  }

  /**
   * Get override limit based on user role
   */
  private getOverrideLimit(userRoles: string[]): number {
    if (userRoles.includes('Chief Credit Officer') || userRoles.includes('Admin')) {
      return 1000000; // $1M
    }
    if (userRoles.includes('Credit Manager')) {
      return 500000; // $500K
    }
    if (userRoles.includes('Senior Underwriter')) {
      return 250000; // $250K
    }
    return 0;
  }

  /**
   * Get dual approval threshold based on user role
   */
  private getDualApprovalThreshold(userRoles: string[]): number {
    if (userRoles.includes('Chief Credit Officer') || userRoles.includes('Admin')) {
      return 1000000; // $1M requires dual approval
    }
    if (userRoles.includes('Credit Manager')) {
      return 500000; // $500K requires dual approval
    }
    if (userRoles.includes('Senior Underwriter')) {
      return 250000; // $250K requires dual approval
    }
    return 500000; // Default threshold
  }

  /**
   * Log override for compliance tracking
   */
  private async logOverrideForCompliance(
    overrideDecision: CreditDecision,
    originalDecision: CreditDecision,
    userId: string,
  ): Promise<void> {
    // In production, this would log to a compliance/audit system
    this.logger.warn(
      `OVERRIDE LOG: Application ${overrideDecision.applicationId} - ` +
        `Original: ${originalDecision.outcome} (Score: ${originalDecision.creditScore}) -> ` +
        `Override: ${overrideDecision.outcome} (Amount: ${overrideDecision.approvedAmount}) ` +
        `by User: ${userId} - Justification: ${overrideDecision.overrideJustification}`,
    );
  }

  /**
   * Get override history for an application
   */
  async getOverrideHistory(applicationId: string): Promise<CreditDecision[]> {
    return await this.creditDecisionRepository.find({
      where: { applicationId, isOverride: true },
      order: { decisionDate: 'DESC' },
    });
  }

  /**
   * Get all overrides (for reporting/compliance)
   */
  async getAllOverrides(): Promise<CreditDecision[]> {
    return await this.creditDecisionRepository.find({
      where: { isOverride: true },
      order: { decisionDate: 'DESC' },
      relations: ['application'],
    });
  }
}

