import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OverrideAudit, OverrideOutcome } from '../entities/override-audit.entity';
import { CreditDecision, DecisionOutcome } from '../entities/credit-decision.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

/**
 * Service for tracking override outcomes and linking to loan performance
 */
@Injectable()
export class OverrideAuditService {
  private readonly logger = new Logger(OverrideAuditService.name);

  constructor(
    @InjectRepository(OverrideAudit)
    private readonly auditRepository: Repository<OverrideAudit>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Create audit record when override is performed
   */
  async createAuditRecord(
    overrideDecisionId: string,
    companyId: string,
    originalDecision: CreditDecision,
    overrideDecision: CreditDecision,
  ): Promise<OverrideAudit> {
    const application = await this.applicationRepository.findOne({
      where: { id: overrideDecision.applicationId },
    });

    if (!application) {
      throw new Error(`Application not found for override decision ${overrideDecisionId}`);
    }

    const audit = this.auditRepository.create({
      companyId,
      overrideDecisionId,
      applicationId: application.id,
      originalDecision: {
        outcome: originalDecision.outcome,
        creditScore: originalDecision.creditScore,
        approvedAmount: originalDecision.approvedAmount,
        decisionRationale: originalDecision.decisionRationale,
      },
      overrideDecisionData: {
        outcome: overrideDecision.outcome,
        approvedAmount: overrideDecision.approvedAmount,
        approvedInterestRate: overrideDecision.approvedInterestRate,
        approvedTerm: overrideDecision.approvedTerm,
        overrideJustification: overrideDecision.overrideJustification || '',
        decisionBy: overrideDecision.decisionBy || '',
        decisionDate: overrideDecision.decisionDate,
      },
    });

    return await this.auditRepository.save(audit);
  }

  /**
   * Update audit record when loan is created
   */
  async linkLoanToOverride(overrideDecisionId: string, loanId: string): Promise<OverrideAudit> {
    const audit = await this.auditRepository.findOne({
      where: { overrideDecisionId },
    });

    if (!audit) {
      throw new Error(`Audit record not found for override decision ${overrideDecisionId}`);
    }

    audit.loanId = loanId;
    return await this.auditRepository.save(audit);
  }

  /**
   * Update audit record with loan outcome
   * Should be called periodically or when loan status changes
   */
  async updateOutcome(overrideDecisionId: string): Promise<OverrideAudit> {
    const audit = await this.auditRepository.findOne({
      where: { overrideDecisionId },
      relations: ['loan'],
    });

    if (!audit) {
      throw new Error(`Audit record not found for override decision ${overrideDecisionId}`);
    }

    if (!audit.loanId) {
      // Loan not yet created, outcome is CANCELLED
      audit.outcome = OverrideOutcome.CANCELLED;
      audit.outcomeDate = new Date();
      audit.wasSuccessful = false;
      return await this.auditRepository.save(audit);
    }

    const loan = await this.loanRepository.findOne({
      where: { id: audit.loanId },
    });

    if (!loan) {
      this.logger.warn(`Loan ${audit.loanId} not found for override audit ${overrideDecisionId}`);
      return audit;
    }

    // Determine outcome based on loan status
    let outcome: OverrideOutcome;
    let wasSuccessful = false;
    let wasDefaulted = false;

    switch (loan.status) {
      case LoanStatus.CLOSED:
      case LoanStatus.SETTLED:
        outcome = OverrideOutcome.SUCCESS;
        wasSuccessful = true;
        break;
      case LoanStatus.WRITTEN_OFF:
        outcome = OverrideOutcome.DEFAULT;
        wasDefaulted = true;
        break;
      case LoanStatus.ACTIVE:
      case LoanStatus.DISBURSED:
      case LoanStatus.PARTIALLY_DISBURSED:
        outcome = OverrideOutcome.ACTIVE;
        break;
      default:
        outcome = OverrideOutcome.ACTIVE;
    }

    // Calculate performance metrics
    // Note: Loan entity doesn't have totalRepaid or totalOutstanding - using totalAmountPaid instead
    const totalRepaid = loan.totalAmountPaid || 0;
    // Calculate outstanding as loanAmount - totalAmountPaid
    const totalOutstanding = (loan.loanAmount || 0) - (loan.totalAmountPaid || 0);
    const totalDefaulted = totalOutstanding > 0 && wasDefaulted ? totalOutstanding : 0;

    // Calculate days to default/repayment
    let daysToDefault: number | null = null;
    let daysToRepayment: number | null = null;

    if (loan.disbursementDate) {
      // Note: Loan entity doesn't have defaultDate - using closureDate for written off loans
      if (wasDefaulted && loan.closureDate) {
        daysToDefault = Math.floor(
          (loan.closureDate.getTime() - loan.disbursementDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
      if (wasSuccessful && loan.closureDate) {
        daysToRepayment = Math.floor(
          (loan.closureDate.getTime() - loan.disbursementDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
    }

    audit.outcome = outcome;
    audit.outcomeDate = new Date();
    audit.totalRepaid = totalRepaid;
    audit.totalDefaulted = totalDefaulted;
    audit.daysToDefault = daysToDefault;
    audit.daysToRepayment = daysToRepayment;
    audit.wasSuccessful = wasSuccessful;
    audit.wasDefaulted = wasDefaulted;

    return await this.auditRepository.save(audit);
  }

  /**
   * Get audit record for override decision
   */
  async getAuditRecord(overrideDecisionId: string): Promise<OverrideAudit | null> {
    return await this.auditRepository.findOne({
      where: { overrideDecisionId },
      relations: ['loan', 'overrideDecision'],
    });
  }

  /**
   * Get all audit records for an application
   */
  async getAuditRecordsForApplication(applicationId: string): Promise<OverrideAudit[]> {
    return await this.auditRepository.find({
      where: { applicationId },
      relations: ['loan', 'overrideDecision'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get audit records by outcome
   */
  async getAuditRecordsByOutcome(outcome: OverrideOutcome): Promise<OverrideAudit[]> {
    return await this.auditRepository.find({
      where: { outcome },
      relations: ['loan', 'overrideDecision'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Batch update outcomes for all pending audits
   */
  async batchUpdateOutcomes(): Promise<number> {
    const pendingAudits = await this.auditRepository.find({
      where: { outcome: null },
      relations: ['loan'],
    });

    let updated = 0;
    for (const audit of pendingAudits) {
      try {
        await this.updateOutcome(audit.overrideDecisionId);
        updated++;
      } catch (error) {
        this.logger.error(`Error updating outcome for audit ${audit.id}: ${error.message}`);
      }
    }

    this.logger.log(`Batch updated ${updated} override audit outcomes`);
    return updated;
  }
}

