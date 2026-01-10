import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OverrideApproval, OverrideApprovalStatus } from '../entities/override-approval.entity';
import { CreditDecision } from '../entities/credit-decision.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';

/**
 * Service for managing dual authorization workflow for overrides
 */
@Injectable()
export class OverrideApprovalService {
  private readonly logger = new Logger(OverrideApprovalService.name);

  // Default dual approval threshold
  private readonly DEFAULT_DUAL_APPROVAL_THRESHOLD = 500000; // $500K

  constructor(
    @InjectRepository(OverrideApproval)
    private readonly approvalRepository: Repository<OverrideApproval>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Create override approval request
   * Determines if dual approval is required based on amount
   */
  async createOverrideApproval(
    overrideDecisionId: string,
    overrideAmount: number,
    firstApproverId: string,
    firstApproverName: string,
    firstApproverRole: string,
    companyId: string,
    dualApprovalThreshold?: number,
  ): Promise<OverrideApproval> {
    const threshold = dualApprovalThreshold || this.DEFAULT_DUAL_APPROVAL_THRESHOLD;
    const requiresDualApproval = overrideAmount >= threshold;

    const approval = this.approvalRepository.create({
      overrideDecisionId,
      overrideAmount,
      status: requiresDualApproval
        ? OverrideApprovalStatus.PENDING_FIRST
        : OverrideApprovalStatus.PENDING_SECOND, // If no dual approval needed, go straight to pending second (which will auto-approve)
      firstApproverId,
      firstApproverName,
      firstApproverRole,
      requiresDualApproval,
      dualApprovalThreshold: threshold,
    });

    return await this.approvalRepository.save(approval);
  }

  /**
   * First approver approves the override
   */
  async approveFirst(
    approvalId: string,
    approverId: string,
    comment?: string,
  ): Promise<OverrideApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
      relations: ['overrideDecision'],
    });

    if (!approval) {
      throw new NotFoundException(`Override approval ${approvalId} not found`);
    }

    if (approval.status !== OverrideApprovalStatus.PENDING_FIRST) {
      throw new BadRequestException(`Approval is not in PENDING_FIRST status`);
    }

    if (approval.firstApproverId !== approverId) {
      throw new ForbiddenException('Only the first approver can approve this step');
    }

    approval.status = approval.requiresDualApproval
      ? OverrideApprovalStatus.PENDING_SECOND
      : OverrideApprovalStatus.APPROVED;
    approval.firstApprovedAt = new Date();
    approval.firstApproverComment = comment;

    const saved = await this.approvalRepository.save(approval);

    // If no dual approval required, auto-approve
    if (!approval.requiresDualApproval) {
      await this.finalizeApproval(approvalId);
    }

    this.logger.log(`First approval completed for override ${approval.overrideDecisionId} by ${approverId}`);
    return saved;
  }

  /**
   * Second approver approves the override
   */
  async approveSecond(
    approvalId: string,
    approverId: string,
    approverName: string,
    approverRole: string,
    comment?: string,
  ): Promise<OverrideApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
      relations: ['overrideDecision'],
    });

    if (!approval) {
      throw new NotFoundException(`Override approval ${approvalId} not found`);
    }

    if (approval.status !== OverrideApprovalStatus.PENDING_SECOND) {
      throw new BadRequestException(`Approval is not in PENDING_SECOND status`);
    }

    if (approval.firstApproverId === approverId) {
      throw new BadRequestException('Second approver must be different from first approver');
    }

    approval.status = OverrideApprovalStatus.APPROVED;
    approval.secondApproverId = approverId;
    approval.secondApproverName = approverName;
    approval.secondApproverRole = approverRole;
    approval.secondApprovedAt = new Date();
    approval.secondApproverComment = comment;

    const saved = await this.approvalRepository.save(approval);

    // Finalize the approval
    await this.finalizeApproval(approvalId);

    this.logger.log(`Second approval completed for override ${approval.overrideDecisionId} by ${approverId}`);
    return saved;
  }

  /**
   * Reject override approval
   */
  async reject(
    approvalId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<OverrideApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new NotFoundException(`Override approval ${approvalId} not found`);
    }

    if (approval.status === OverrideApprovalStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an already approved override');
    }

    if (approval.status === OverrideApprovalStatus.REJECTED) {
      throw new BadRequestException('Override is already rejected');
    }

    approval.status = OverrideApprovalStatus.REJECTED;
    approval.rejectedBy = rejectedBy;
    approval.rejectedAt = new Date();
    approval.rejectionReason = reason;

    const saved = await this.approvalRepository.save(approval);

    this.logger.log(`Override approval ${approvalId} rejected by ${rejectedBy}: ${reason}`);
    return saved;
  }

  /**
   * Finalize approval - update application status
   */
  private async finalizeApproval(approvalId: string): Promise<void> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
      relations: ['overrideDecision', 'overrideDecision.application'],
    });

    if (!approval || !approval.overrideDecision) {
      throw new NotFoundException(`Override approval or decision not found`);
    }

    const decision = approval.overrideDecision;
    const application = await this.applicationRepository.findOne({
      where: { id: decision.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application not found`);
    }

    // Update application status based on override decision
    if (decision.outcome === 'Approved' || decision.outcome === 'Conditionally Approved') {
      application.status = ApplicationStatus.APPROVED;
      application.approvalDate = new Date();
      application.approvedBy = decision.decisionBy;
      application.approvedAmount = decision.approvedAmount;
    }

    await this.applicationRepository.save(application);
    this.logger.log(`Override approval finalized for application ${application.applicationNumber}`);
  }

  /**
   * Get approval by override decision ID
   */
  async getApprovalByDecisionId(overrideDecisionId: string): Promise<OverrideApproval | null> {
    return await this.approvalRepository.findOne({
      where: { overrideDecisionId },
      relations: ['overrideDecision'],
    });
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(userId: string): Promise<OverrideApproval[]> {
    return await this.approvalRepository.find({
      where: [
        { status: OverrideApprovalStatus.PENDING_FIRST, firstApproverId: userId },
        { status: OverrideApprovalStatus.PENDING_SECOND },
      ],
      relations: ['overrideDecision'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(overrideDecisionId: string): Promise<OverrideApproval | null> {
    return await this.approvalRepository.findOne({
      where: { overrideDecisionId },
      relations: ['overrideDecision'],
    });
  }
}

