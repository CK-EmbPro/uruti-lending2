import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { CollectionStage } from '../../../common/enums/collection-stage.enum';
import { CollectionNoticeType } from '../../../common/enums/collection-notice-type.enum';
import { CollectionChannel } from '../../../common/enums/collection-channel.enum';
import { CollectionActivityType } from '../../../common/enums/collection-activity-type.enum';
import { PaymentArrangementStatus } from '../../../common/enums/payment-arrangement-status.enum';
import { LegalActionStatus } from '../../../common/enums/legal-action-status.enum';
import { ThirdPartyPlacementStatus } from '../../../common/enums/third-party-placement-status.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { DelinquencyRecord } from '../entities/delinquency-record.entity';
import { LateFee } from '../entities/late-fee.entity';
import { CreditBureauUpdate } from '../entities/credit-bureau-update.entity';
import { CollectionNotice } from '../entities/collection-notice.entity';
import { CollectionWorkflow } from '../entities/collection-workflow.entity';
import { CollectionActivity } from '../entities/collection-activity.entity';
import { PromiseToPay } from '../entities/promise-to-pay.entity';
import { PaymentArrangement } from '../entities/payment-arrangement.entity';
import { ArrangementCompliance } from '../entities/arrangement-compliance.entity';
import { SkipTrace } from '../entities/skip-trace.entity';
import { LegalAction } from '../entities/legal-action.entity';
import { Lawsuit } from '../entities/lawsuit.entity';
import { Judgment } from '../entities/judgment.entity';
import { CollectionAgency } from '../entities/collection-agency.entity';
import { ThirdPartyPlacement } from '../entities/third-party-placement.entity';
import { DateUtils } from '../../../common/utils/date.utils';
import { CreatePaymentArrangementDto } from '../dto/create-payment-arrangement.dto';
import { CreateCollectionActivityDto } from '../dto/create-collection-activity.dto';
import { CreateSkipTraceDto } from '../dto/create-skip-trace.dto';
import { CreateLegalActionDto } from '../dto/create-legal-action.dto';
import { CreateThirdPartyPlacementDto } from '../dto/create-third-party-placement.dto';
import { CreatePromiseToPayDto } from '../dto/create-promise-to-pay.dto';
import { LoanNotificationHelperService } from '../../notification/services/loan-notification-helper.service';
import { CollectionsIntegrationService } from './collections-integration.service';

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(DelinquencyRecord)
    private readonly delinquencyRepository: Repository<DelinquencyRecord>,
    @InjectRepository(LateFee)
    private readonly lateFeeRepository: Repository<LateFee>,
    @InjectRepository(CreditBureauUpdate)
    private readonly creditBureauRepository: Repository<CreditBureauUpdate>,
    @InjectRepository(CollectionNotice)
    private readonly noticeRepository: Repository<CollectionNotice>,
    @InjectRepository(CollectionWorkflow)
    private readonly workflowRepository: Repository<CollectionWorkflow>,
    @InjectRepository(CollectionActivity)
    private readonly activityRepository: Repository<CollectionActivity>,
    @InjectRepository(PromiseToPay)
    private readonly promiseRepository: Repository<PromiseToPay>,
    @InjectRepository(PaymentArrangement)
    private readonly arrangementRepository: Repository<PaymentArrangement>,
    @InjectRepository(ArrangementCompliance)
    private readonly complianceRepository: Repository<ArrangementCompliance>,
    @InjectRepository(SkipTrace)
    private readonly skipTraceRepository: Repository<SkipTrace>,
    @InjectRepository(LegalAction)
    private readonly legalActionRepository: Repository<LegalAction>,
    @InjectRepository(Lawsuit)
    private readonly lawsuitRepository: Repository<Lawsuit>,
    @InjectRepository(Judgment)
    private readonly judgmentRepository: Repository<Judgment>,
    @InjectRepository(CollectionAgency)
    private readonly agencyRepository: Repository<CollectionAgency>,
    @InjectRepository(ThirdPartyPlacement)
    private readonly placementRepository: Repository<ThirdPartyPlacement>,
    private readonly notificationHelper: LoanNotificationHelperService,
    private readonly collectionsIntegrationService: CollectionsIntegrationService,
  ) {}

  /**
   * UC-024: Delinquency Detection & Classification
   * Detects missed payments, calculates DPD, assesses late fees, updates credit bureau, triggers collection workflow
   */
  async detectAndClassifyDelinquency(loanId?: string, postingDate?: Date): Promise<DelinquencyRecord[]> {
    const targetDate = postingDate || new Date();
    const records: DelinquencyRecord[] = [];

    const query = this.loanRepository.createQueryBuilder('loan');
    query.where('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
    });

    if (loanId) {
      query.andWhere('loan.id = :loanId', { loanId });
    }

    const loans = await query.getMany();

    for (const loan of loans) {
      // Check if payment is missed
      const unpaidSchedule = await this.scheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.loanId = :loanId', { loanId: loan.id })
        .andWhere('schedule.status != :status', { status: ScheduleEntryStatus.COMPLETED })
        .andWhere('schedule.paymentDate < :targetDate', { targetDate })
        .orderBy('schedule.paymentDate', 'ASC')
        .getOne();

      if (!unpaidSchedule) {
        continue; // No missed payment
      }

      const daysPastDue = DateUtils.daysBetween(unpaidSchedule.paymentDate, targetDate);

      if (daysPastDue <= 0) {
        continue; // Not yet delinquent
      }

      // Check grace period
      const loanProduct = await this.loanRepository.manager
        .getRepository('LoanProduct')
        .findOne({ where: { id: loan.loanProductId } });

      const gracePeriod = (loanProduct as any)?.gracePeriodInDays || 0;
      if (daysPastDue <= gracePeriod) {
        continue; // Still in grace period
      }

      // Determine collection stage
      const collectionStage = this.getCollectionStage(daysPastDue);

      // Calculate outstanding balance
      const outstandingBalance =
        Number(loan.loanAmount) - Number(loan.totalPrincipalPaid);

      // Assess late fee
      const lateFeeAmount = await this.assessLateFee(loan.id, daysPastDue, outstandingBalance);

      // Check if delinquency record already exists for this date
      const existingRecord = await this.delinquencyRepository.findOne({
        where: {
          loanId: loan.id,
          recordDate: targetDate,
        },
      });

      if (existingRecord) {
        // Update existing record
        existingRecord.daysPastDue = daysPastDue;
        existingRecord.collectionStage = collectionStage;
        existingRecord.outstandingBalance = outstandingBalance;
        existingRecord.lateFeeAssessed = lateFeeAmount;
        await this.delinquencyRepository.save(existingRecord);
        records.push(existingRecord);
      } else {
        // Create new delinquency record
        const record = this.delinquencyRepository.create({
          loanId: loan.id,
          recordDate: targetDate,
          daysPastDue,
          collectionStage,
          outstandingBalance,
          lateFeeAssessed: lateFeeAmount,
        });
        const savedRecord = await this.delinquencyRepository.save(record);
        records.push(savedRecord);
      }

      // Update credit bureau
      await this.updateCreditBureau(loan.id, daysPastDue, targetDate);

      // Trigger collection workflow if not already triggered
      if (!existingRecord?.collectionWorkflowTriggered) {
        await this.triggerCollectionWorkflow(loan.id, collectionStage, daysPastDue, targetDate);
      }
    }

    return records;
  }

  /**
   * Get collection stage based on days past due
   */
  private getCollectionStage(daysPastDue: number): CollectionStage {
    if (daysPastDue <= 30) {
      return CollectionStage.EARLY_DELINQUENCY;
    } else if (daysPastDue <= 60) {
      return CollectionStage.MODERATE_DELINQUENCY;
    } else if (daysPastDue <= 90) {
      return CollectionStage.SERIOUS_DELINQUENCY;
    } else if (daysPastDue <= 120) {
      return CollectionStage.SEVERE_DELINQUENCY;
    } else {
      return CollectionStage.CHARGE_OFF_ELIGIBLE;
    }
  }

  /**
   * Assess late fee based on DPD and outstanding balance
   */
  private async assessLateFee(loanId: string, daysPastDue: number, outstandingBalance: number): Promise<number> {
    // Simple late fee calculation: 5% of outstanding balance, max $50, minimum $10
    // In production, this would be configurable per loan product
    const feePercentage = 0.05;
    const maxFee = 50;
    const minFee = 10;

    let feeAmount = outstandingBalance * feePercentage;
    feeAmount = Math.max(minFee, Math.min(feeAmount, maxFee));

    // Check if late fee already assessed for this period
    const existingFee = await this.lateFeeRepository.findOne({
      where: {
        loanId,
        assessedDate: new Date(),
        paid: false,
      },
    });

    if (!existingFee) {
      const lateFee = this.lateFeeRepository.create({
        loanId,
        assessedDate: new Date(),
        feeAmount,
        daysPastDue,
        feeCalculationMethod: 'Percentage',
      });
      await this.lateFeeRepository.save(lateFee);
    }

    return feeAmount;
  }

  /**
   * Update credit bureau with delinquency status
   */
  private async updateCreditBureau(loanId: string, daysPastDue: number, updateDate: Date): Promise<void> {
    // Check if already updated today
    const existing = await this.creditBureauRepository.findOne({
      where: {
        loanId,
        updateDate,
      },
    });

    if (existing) {
      return;
    }

    const statusCode = this.getCreditBureauStatusCode(daysPastDue);

    const update = this.creditBureauRepository.create({
      loanId,
      updateDate,
      daysPastDue,
      creditBureau: 'All', // In production, would update each bureau separately
      statusCode,
      submitted: false,
    });

    await this.creditBureauRepository.save(update);

    // In production, would integrate with credit bureau API here
    this.logger.log(`Credit bureau update created for loan ${loanId}, DPD: ${daysPastDue}`);
  }

  /**
   * Get credit bureau status code based on DPD
   */
  private getCreditBureauStatusCode(daysPastDue: number): string {
    if (daysPastDue === 0) {
      return 'Current';
    } else if (daysPastDue <= 30) {
      return '30';
    } else if (daysPastDue <= 60) {
      return '60';
    } else if (daysPastDue <= 90) {
      return '90';
    } else if (daysPastDue <= 120) {
      return '120';
    } else {
      return 'Charge-Off';
    }
  }

  /**
   * UC-025: Trigger automated collection workflow
   */
  private async triggerCollectionWorkflow(
    loanId: string,
    stage: CollectionStage,
    daysPastDue: number,
    startDate: Date,
  ): Promise<CollectionWorkflow> {
    // Check if workflow already exists
    const existing = await this.workflowRepository.findOne({
      where: {
        loanId,
        active: true,
      },
    });

    if (existing) {
      // Update existing workflow
      existing.currentStage = stage;
      existing.daysPastDue = daysPastDue;
      await this.workflowRepository.save(existing);
      return existing;
    }

    // Create new workflow
    const workflow = this.workflowRepository.create({
      loanId,
      startDate,
      currentStage: stage,
      daysPastDue,
      active: true,
    });

    const savedWorkflow = await this.workflowRepository.save(workflow);

    // Send first notice
    await this.sendCollectionNotice(loanId, CollectionNoticeType.FIRST_NOTICE, daysPastDue, savedWorkflow.id);

    return savedWorkflow;
  }

  /**
   * Send collection notice
   * Now integrated with the new notification system
   */
  async sendCollectionNotice(
    loanId: string,
    noticeType: CollectionNoticeType,
    daysPastDue: number,
    workflowId?: string,
  ): Promise<CollectionNotice> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const outstandingBalance = Number(loan.loanAmount) - Number(loan.totalPrincipalPaid);

    // Determine channel based on stage
    const channel = this.getNoticeChannel(noticeType);

    const notice = this.noticeRepository.create({
      loanId,
      noticeType,
      channel,
      sentDate: new Date(),
      daysPastDue,
      outstandingBalance,
      workflowId,
    });

    const savedNotice = await this.noticeRepository.save(notice);

      // Map CollectionNoticeType to notification type
      let notificationNoticeType: 'Delinquency Notice' | 'Collection Notice' | 'Final Notice';
      switch (noticeType) {
        case CollectionNoticeType.FIRST_NOTICE:
          notificationNoticeType = 'Delinquency Notice';
          break;
        case CollectionNoticeType.SECOND_NOTICE:
          notificationNoticeType = 'Collection Notice';
          break;
        case CollectionNoticeType.FINAL_NOTICE:
        case CollectionNoticeType.PRE_LEGAL_NOTICE:
        case CollectionNoticeType.DEMAND_LETTER:
          notificationNoticeType = 'Final Notice';
          break;
        default:
          notificationNoticeType = 'Collection Notice';
      }

    // Send notification using the new notification system
    try {
      // Note: In production, you would fetch customer email/phone from Customer entity
      // For now, we use applicantId as recipientId
      await this.notificationHelper.notifyCollectionNotice(
        loan,
        notificationNoticeType,
        daysPastDue,
        outstandingBalance,
        loan.applicantId, // recipientId
        undefined, // recipientEmail - would be fetched from Customer entity
        undefined, // recipientPhone - would be fetched from Customer entity
      );
      this.logger.log(`Collection notice ${noticeType} sent via notification system for loan ${loanId}`);
    } catch (error) {
      // Log error but don't fail the notice creation
      this.logger.error(`Failed to send collection notice notification: ${error.message}`);
    }

    // Send collection notice with PDF and QR code (integration service)
    try {
      await this.collectionsIntegrationService.sendCollectionNoticeWithPDF(
        savedNotice.id,
        loanId,
        noticeType,
        daysPastDue,
        outstandingBalance,
      );
    } catch (error) {
      // Log error but don't fail the notice creation
      this.logger.error(`Failed to send collection notice with PDF: ${error.message}`);
    }

    return savedNotice;
  }

  /**
   * Get notice channel based on notice type
   */
  private getNoticeChannel(noticeType: CollectionNoticeType): CollectionChannel {
    switch (noticeType) {
      case CollectionNoticeType.FIRST_NOTICE:
        return CollectionChannel.EMAIL;
      case CollectionNoticeType.SECOND_NOTICE:
        return CollectionChannel.SMS;
      case CollectionNoticeType.FINAL_NOTICE:
      case CollectionNoticeType.PRE_LEGAL_NOTICE:
      case CollectionNoticeType.DEMAND_LETTER:
        return CollectionChannel.LETTER;
      default:
        return CollectionChannel.EMAIL;
    }
  }

  /**
   * UC-026: Create manual collection activity
   */
  async createCollectionActivity(dto: CreateCollectionActivityDto, userId: string, userName: string): Promise<CollectionActivity> {
    const activity = this.activityRepository.create({
      ...dto,
      loanId: dto.loanId,
      activityDate: new Date(dto.activityDate),
      performedById: userId,
      performedBy: userName,
    });

    return await this.activityRepository.save(activity);
  }

  /**
   * UC-027: Create payment arrangement
   */
  async createPaymentArrangement(dto: CreatePaymentArrangementDto, userId: string, userName: string): Promise<PaymentArrangement> {
    const arrangement = this.arrangementRepository.create({
      ...dto,
      loanId: dto.loanId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status: PaymentArrangementStatus.PENDING,
      createdById: userId,
      createdBy: userName,
      shortTerm: dto.numberOfPayments < 6,
      longTerm: dto.numberOfPayments >= 6,
    });

    const savedArrangement = await this.arrangementRepository.save(arrangement);

    // Generate compliance schedule
    await this.generateComplianceSchedule(savedArrangement.id, dto);

    return savedArrangement;
  }

  /**
   * Generate compliance schedule for payment arrangement
   */
  private async generateComplianceSchedule(arrangementId: string, dto: CreatePaymentArrangementDto): Promise<void> {
    const arrangement = await this.arrangementRepository.findOne({ where: { id: arrangementId } });
    if (!arrangement) {
      return;
    }

    const startDate = new Date(dto.startDate);
    const complianceRecords: ArrangementCompliance[] = [];

    for (let i = 0; i < dto.numberOfPayments; i++) {
      const dueDate = new Date(startDate);
      
      // Calculate next payment date based on frequency
      if (dto.paymentFrequency === 'Weekly') {
        dueDate.setDate(dueDate.getDate() + i * 7);
      } else if (dto.paymentFrequency === 'Bi-weekly') {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else if (dto.paymentFrequency === 'Monthly') {
        dueDate.setMonth(dueDate.getMonth() + i);
        if (dto.paymentDay) {
          dueDate.setDate(dto.paymentDay);
        }
      }

      const compliance = this.complianceRepository.create({
        arrangementId,
        dueDate,
        dueAmount: dto.paymentAmount,
      });

      complianceRecords.push(compliance);
    }

    await this.complianceRepository.save(complianceRecords);
  }

  /**
   * UC-028: Create skip trace
   */
  async createSkipTrace(dto: CreateSkipTraceDto, userId: string, userName: string): Promise<SkipTrace> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    const skipTrace = this.skipTraceRepository.create({
      ...dto,
      loanId: dto.loanId,
      initiatedDate: new Date(),
      initiatedById: userId,
      initiatedBy: userName,
      contactFound: false,
    });

    return await this.skipTraceRepository.save(skipTrace);
  }

  /**
   * UC-029: Create legal action
   */
  async createLegalAction(dto: CreateLegalActionDto, userId: string, userName: string): Promise<LegalAction> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    const legalAction = this.legalActionRepository.create({
      ...dto,
      loanId: dto.loanId,
      initiatedDate: new Date(),
      initiatedById: userId,
      initiatedBy: userName,
      status: LegalActionStatus.PENDING_APPROVAL,
      daysPastDue: loan.daysPastDue || 0,
      legalFees: dto.legalFees || 0,
      courtCosts: dto.courtCosts || 0,
    });

    return await this.legalActionRepository.save(legalAction);
  }

  /**
   * UC-030: Create third-party placement
   */
  async createThirdPartyPlacement(dto: CreateThirdPartyPlacementDto, userId: string, userName: string): Promise<ThirdPartyPlacement> {
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error(`Loan ${dto.loanId} not found`);
    }

    const agency = await this.agencyRepository.findOne({ where: { id: dto.agencyId } });
    if (!agency) {
      throw new Error(`Collection agency ${dto.agencyId} not found`);
    }

    const outstandingBalance = Number(loan.loanAmount) - Number(loan.totalPrincipalPaid);

    const placement = this.placementRepository.create({
      ...dto,
      loanId: dto.loanId,
      agencyId: dto.agencyId,
      placementDate: new Date(),
      placementAmount: outstandingBalance,
      daysPastDue: loan.daysPastDue || 0,
      status: ThirdPartyPlacementStatus.PLACED,
      placedById: userId,
      placedBy: userName,
    });

    return await this.placementRepository.save(placement);
  }

  /**
   * UC-031: Process charge-off
   */
  async processChargeOff(loanId: string, chargeOffDate: Date, userId: string, userName: string): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Check if loan meets charge-off criteria (typically 120-180 days)
    if (loan.daysPastDue < 120) {
      throw new Error(`Loan ${loanId} does not meet charge-off criteria (DPD: ${loan.daysPastDue})`);
    }

    // Update loan status
    loan.status = LoanStatus.WRITTEN_OFF;
    loan.writtenOffAmount = Number(loan.loanAmount) - Number(loan.totalPrincipalPaid);

    await this.loanRepository.save(loan);

    // Update credit bureau
    await this.updateCreditBureau(loanId, loan.daysPastDue, chargeOffDate);

    // In production, would create accounting entries here
    this.logger.log(`Loan ${loanId} charged off on ${chargeOffDate}`);

    return loan;
  }

  /**
   * Create promise to pay
   */
  async createPromiseToPay(dto: CreatePromiseToPayDto, userId: string, userName: string): Promise<PromiseToPay> {
    const promise = this.promiseRepository.create({
      ...dto,
      loanId: dto.loanId,
      promiseDate: new Date(dto.promiseDate),
      dueDate: new Date(dto.dueDate),
      createdById: userId,
      createdBy: userName,
    });

    return await this.promiseRepository.save(promise);
  }

  // Additional helper methods for querying
  async getDelinquentLoans(stage?: CollectionStage): Promise<Loan[]> {
    const query = this.loanRepository.createQueryBuilder('loan');
    query.where('loan.daysPastDue > 0');
    query.andWhere('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE],
    });

    if (stage) {
      // This would require joining with delinquency records
      // For now, filter by DPD ranges
      const ranges = this.getStageDPDRanges(stage);
      query.andWhere('loan.daysPastDue >= :minDPD', { minDPD: ranges.min });
      query.andWhere('loan.daysPastDue <= :maxDPD', { maxDPD: ranges.max });
    }

    return await query.getMany();
  }

  private getStageDPDRanges(stage: CollectionStage): { min: number; max: number } {
    switch (stage) {
      case CollectionStage.EARLY_DELINQUENCY:
        return { min: 1, max: 30 };
      case CollectionStage.MODERATE_DELINQUENCY:
        return { min: 31, max: 60 };
      case CollectionStage.SERIOUS_DELINQUENCY:
        return { min: 61, max: 90 };
      case CollectionStage.SEVERE_DELINQUENCY:
        return { min: 91, max: 120 };
      case CollectionStage.CHARGE_OFF_ELIGIBLE:
        return { min: 121, max: 9999 };
      default:
        return { min: 1, max: 9999 };
    }
  }
}

