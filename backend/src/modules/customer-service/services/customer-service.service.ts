import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { ExtensionStatus } from '../../../common/enums/extension-status.enum';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { WaiverStatus } from '../../../common/enums/waiver-status.enum';
import { PaymentExtension } from '../entities/payment-extension.entity';
import { Dispute } from '../entities/dispute.entity';
import { DisputeResolution } from '../entities/dispute-resolution.entity';
import { AccountUpdate } from '../entities/account-update.entity';
import { FeeWaiver } from '../entities/fee-waiver.entity';
import { DateUtils } from '../../../common/utils/date.utils';
import { CreatePaymentExtensionDto } from '../dto/create-payment-extension.dto';
import { CreateDisputeDto } from '../dto/create-dispute.dto';
import { CreateAccountUpdateDto } from '../dto/create-account-update.dto';
import { CreateFeeWaiverDto } from '../dto/create-fee-waiver.dto';
import { ResolveDisputeDto } from '../dto/resolve-dispute.dto';

@Injectable()
export class CustomerServiceService {
  private readonly logger = new Logger(CustomerServiceService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(PaymentExtension)
    private readonly extensionRepository: Repository<PaymentExtension>,
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(DisputeResolution)
    private readonly resolutionRepository: Repository<DisputeResolution>,
    @InjectRepository(AccountUpdate)
    private readonly accountUpdateRepository: Repository<AccountUpdate>,
    @InjectRepository(FeeWaiver)
    private readonly waiverRepository: Repository<FeeWaiver>,
  ) {}

  /**
   * UC-032: Create Payment Extension Request
   */
  async createPaymentExtension(
    dto: CreatePaymentExtensionDto,
    userId: string,
    userName: string,
  ): Promise<PaymentExtension> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    // Calculate new due date
    const originalDueDate = new Date(dto.originalDueDate);
    const newDueDate = DateUtils.addDays(originalDueDate, dto.extensionDays);

    const extension = this.extensionRepository.create({
      ...dto,
      loanId: dto.loanId,
      requestDate: new Date(),
      originalDueDate,
      newDueDate,
      extensionDays: dto.extensionDays,
      status: ExtensionStatus.PENDING,
      processedById: userId,
      processedBy: userName,
    });

    return await this.extensionRepository.save(extension);
  }

  /**
   * Approve Payment Extension
   */
  async approvePaymentExtension(
    extensionId: string,
    userId: string,
    userName: string,
    remarks?: string,
  ): Promise<PaymentExtension> {
    const extension = await this.extensionRepository.findOne({ where: { id: extensionId } });
    if (!extension) {
      throw new Error(`Payment extension ${extensionId} not found`);
    }

    extension.status = ExtensionStatus.APPROVED;
    extension.approved = true;
    extension.approvedBy = userName;
    extension.approvedById = userId;
    extension.approvedDate = new Date();
    extension.approvalRemarks = remarks;

    // Update repayment schedule
    if (extension.newDueDate) {
      await this.updateRepaymentScheduleDueDate(
        extension.loanId,
        extension.originalDueDate,
        extension.newDueDate,
      );
    }

    // Notify borrower (in production, would integrate with notification service)
    extension.borrowerNotified = true;
    extension.borrowerNotifiedDate = new Date();

    return await this.extensionRepository.save(extension);
  }

  /**
   * Deny Payment Extension
   */
  async denyPaymentExtension(
    extensionId: string,
    userId: string,
    userName: string,
    denialReason: string,
  ): Promise<PaymentExtension> {
    const extension = await this.extensionRepository.findOne({ where: { id: extensionId } });
    if (!extension) {
      throw new Error(`Payment extension ${extensionId} not found`);
    }

    extension.status = ExtensionStatus.DENIED;
    extension.approved = false;
    extension.approvedBy = userName;
    extension.approvedById = userId;
    extension.approvedDate = new Date();
    extension.denialReason = denialReason;

    return await this.extensionRepository.save(extension);
  }

  /**
   * Update repayment schedule due date
   */
  private async updateRepaymentScheduleDueDate(
    loanId: string,
    originalDueDate: Date,
    newDueDate: Date,
  ): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        loanId,
        paymentDate: originalDueDate,
        status: ScheduleEntryStatus.PENDING,
      },
    });

    if (schedule) {
      schedule.paymentDate = newDueDate;
      await this.scheduleRepository.save(schedule);
    }
  }

  /**
   * UC-033: Create Dispute
   */
  async createDispute(
    dto: CreateDisputeDto,
    userId: string,
    userName: string,
  ): Promise<Dispute> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    const dispute = this.disputeRepository.create({
      ...dto,
      loanId: dto.loanId,
      disputeDate: new Date(),
      status: DisputeStatus.OPEN,
      assignedToId: userId,
      assignedTo: userName,
      investigationStartDate: new Date(),
    });

    return await this.disputeRepository.save(dispute);
  }

  /**
   * Resolve Dispute
   */
  async resolveDispute(
    disputeId: string,
    dto: ResolveDisputeDto,
    userId: string,
    userName: string,
  ): Promise<DisputeResolution> {
    const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    const resolution = this.resolutionRepository.create({
      disputeId,
      resolutionDate: new Date(),
      ...dto,
      resolvedById: userId,
      resolvedBy: userName,
    });

    const savedResolution = await this.resolutionRepository.save(resolution);

    // Update dispute status
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolutionDate = new Date();
    await this.disputeRepository.save(dispute);

    // Create adjustment if needed
    if (dto.adjustmentAmount && dto.adjustmentAmount !== 0 && dto.accountUpdated) {
      // In production, would create loan adjustment here
      this.logger.log(`Adjustment needed for dispute ${disputeId}: ${dto.adjustmentAmount}`);
    }

    // Notify borrower
    resolution.borrowerNotified = true;
    resolution.borrowerNotifiedDate = new Date();
    await this.resolutionRepository.save(resolution);

    return savedResolution;
  }

  /**
   * Escalate Dispute
   */
  async escalateDispute(
    disputeId: string,
    escalatedTo: string,
    reason: string,
    userId: string,
    userName: string,
  ): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    dispute.status = DisputeStatus.ESCALATED;
    dispute.escalated = true;
    dispute.escalatedTo = escalatedTo;
    dispute.escalatedDate = new Date();
    dispute.escalationReason = reason;

    return await this.disputeRepository.save(dispute);
  }

  /**
   * UC-034: Create Account Update Request
   */
  async createAccountUpdate(
    dto: CreateAccountUpdateDto,
    userId: string,
    userName: string,
  ): Promise<AccountUpdate> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    // Get current customer info (would come from customer service)
    // For now, we'll store the update request
    const update = this.accountUpdateRepository.create({
      ...dto,
      loanId: dto.loanId,
      updateDate: new Date(),
      processedById: userId,
      processedBy: userName,
      identityVerified: false, // To be verified by CSR
    });

    return await this.accountUpdateRepository.save(update);
  }

  /**
   * Verify Identity and Process Account Update
   */
  async verifyAndProcessAccountUpdate(
    updateId: string,
    verificationMethod: string,
    userId: string,
    userName: string,
  ): Promise<AccountUpdate> {
    const update = await this.accountUpdateRepository.findOne({ where: { id: updateId } });
    if (!update) {
      throw new Error(`Account update ${updateId} not found`);
    }

    update.identityVerified = true;
    update.verificationMethod = verificationMethod;
    update.verifiedBy = userName;
    update.verifiedById = userId;
    update.verifiedDate = new Date();

    // System validation (in production, would validate address, phone, etc.)
    update.systemValidated = true;
    update.systemValidatedDate = new Date();

    // Update customer record (in production, would update customer entity)
    this.logger.log(`Account update processed for loan ${update.loanId}`);

    return await this.accountUpdateRepository.save(update);
  }

  /**
   * UC-035: Create Fee Waiver Request
   */
  async createFeeWaiver(
    dto: CreateFeeWaiverDto,
    userId: string,
    userName: string,
  ): Promise<FeeWaiver> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    // Get account history (in production, would fetch from various sources)
    const accountHistory = this.getAccountHistorySummary(loan.id);

    const waiver = this.waiverRepository.create({
      ...dto,
      loanId: dto.loanId,
      requestDate: new Date(),
      status: WaiverStatus.PENDING,
      accountHistory,
      processedById: userId,
      processedBy: userName,
    });

    return await this.waiverRepository.save(waiver);
  }

  /**
   * Approve Fee Waiver
   */
  async approveFeeWaiver(
    waiverId: string,
    userId: string,
    userName: string,
    remarks?: string,
  ): Promise<FeeWaiver> {
    const waiver = await this.waiverRepository.findOne({ where: { id: waiverId } });
    if (!waiver) {
      throw new Error(`Fee waiver ${waiverId} not found`);
    }

    waiver.status = WaiverStatus.APPROVED;
    waiver.approved = true;
    waiver.approvedBy = userName;
    waiver.approvedById = userId;
    waiver.approvedDate = new Date();
    waiver.approvalRemarks = remarks;

    // Create loan adjustment (in production, would create adjustment entry)
    // For now, we'll just mark it as processed
    waiver.processed = true;
    waiver.processedDate = new Date();
    waiver.status = WaiverStatus.PROCESSED;

    this.logger.log(`Fee waiver approved: ${waiver.feeAmount} for loan ${waiver.loanId}`);

    return await this.waiverRepository.save(waiver);
  }

  /**
   * Deny Fee Waiver
   */
  async denyFeeWaiver(
    waiverId: string,
    userId: string,
    userName: string,
    denialReason: string,
  ): Promise<FeeWaiver> {
    const waiver = await this.waiverRepository.findOne({ where: { id: waiverId } });
    if (!waiver) {
      throw new Error(`Fee waiver ${waiverId} not found`);
    }

    waiver.status = WaiverStatus.DENIED;
    waiver.approved = false;
    waiver.approvedBy = userName;
    waiver.approvedById = userId;
    waiver.approvedDate = new Date();
    waiver.denialReason = denialReason;

    return await this.waiverRepository.save(waiver);
  }

  /**
   * Get account history summary for waiver evaluation
   */
  private getAccountHistorySummary(loanId: string): string {
    // In production, would fetch:
    // - Payment history
    // - Previous extensions
    // - Previous waivers
    // - Dispute history
    // - Communication history
    return JSON.stringify({
      paymentHistory: 'Good',
      previousExtensions: 0,
      previousWaivers: 0,
      disputes: 0,
    });
  }

  // Query methods
  async getLoanExtensions(loanId: string): Promise<PaymentExtension[]> {
    return await this.extensionRepository.find({
      where: { loanId },
      order: { requestDate: 'DESC' },
    });
  }

  async getLoanDisputes(loanId: string): Promise<Dispute[]> {
    return await this.disputeRepository.find({
      where: { loanId },
      order: { disputeDate: 'DESC' },
      relations: ['resolutions'],
    });
  }

  async getLoanAccountUpdates(loanId: string): Promise<AccountUpdate[]> {
    return await this.accountUpdateRepository.find({
      where: { loanId },
      order: { updateDate: 'DESC' },
    });
  }

  async getLoanFeeWaivers(loanId: string): Promise<FeeWaiver[]> {
    return await this.waiverRepository.find({
      where: { loanId },
      order: { requestDate: 'DESC' },
    });
  }
}

