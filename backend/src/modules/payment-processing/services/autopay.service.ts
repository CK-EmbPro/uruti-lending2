import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutopayEnrollment, AutopayStatus, AutopayAmountType } from '../entities/autopay-enrollment.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { CreateAutopayEnrollmentDto, UpdateAutopayEnrollmentDto, CancelAutopayDto } from '../dto/autopay.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service for autopay enrollment and processing
 * UC-015: Autopay Enrollment & Processing
 */
@Injectable()
export class AutopayService {
  private readonly logger = new Logger(AutopayService.name);

  constructor(
    @InjectRepository(AutopayEnrollment)
    private readonly autopayRepository: Repository<AutopayEnrollment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Enroll in autopay
   */
  async enroll(createDto: CreateAutopayEnrollmentDto, userId: string): Promise<AutopayEnrollment> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    // Check if already enrolled
    const existing = await this.autopayRepository.findOne({
      where: { loanId: createDto.loanId, status: AutopayStatus.ACTIVE },
    });

    if (existing) {
      throw new BadRequestException('Loan already has an active autopay enrollment');
    }

    // Validate fixed amount if applicable
    if (createDto.amountType === AutopayAmountType.FIXED_AMOUNT && !createDto.fixedAmount) {
      throw new BadRequestException('Fixed amount is required when amount type is FIXED_AMOUNT');
    }

    // In production, would verify bank account with micro-deposits
    const enrollment = this.autopayRepository.create({
      ...createDto,
      isVerified: false, // Would be set to true after verification
      nextPaymentDate: this.calculateNextPaymentDate(loan),
    });

    const savedEnrollment = await this.autopayRepository.save(enrollment);
    this.logger.log(`Autopay enrollment created: ${savedEnrollment.id} for loan ${loan.loanNumber}`);

    return savedEnrollment;
  }

  /**
   * Verify bank account
   */
  async verifyAccount(enrollmentId: string): Promise<AutopayEnrollment> {
    const enrollment = await this.autopayRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    enrollment.isVerified = true;
    enrollment.verifiedDate = new Date();

    return await this.autopayRepository.save(enrollment);
  }

  /**
   * Process autopay payment
   */
  async processAutopay(enrollmentId: string): Promise<{ success: boolean; repayment?: LoanRepayment; error?: string }> {
    const enrollment = await this.autopayRepository.findOne({
      where: { id: enrollmentId },
      relations: ['loan'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    if (enrollment.status !== AutopayStatus.ACTIVE) {
      throw new BadRequestException(`Autopay is not active. Current status: ${enrollment.status}`);
    }

    if (!enrollment.isVerified) {
      throw new BadRequestException('Bank account is not verified');
    }

    // Calculate payment amount based on type
    const paymentAmount = await this.calculatePaymentAmount(enrollment);

    // In production, would:
    // 1. Debit from bank account via payment processor
    // 2. Create repayment record
    // 3. Update loan balance
    // 4. Send confirmation

    try {
      // Mock payment processing
      const repayment = this.repaymentRepository.create({
        loanId: enrollment.loanId,
        postingDate: new Date(),
        amountPaid: paymentAmount,
        modeOfPayment: 'ACH',
        referenceNumber: `AUTOPAY-${Date.now()}`,
      });

      const savedRepayment = await this.repaymentRepository.save(repayment);

      // Update enrollment
      enrollment.successfulPayments += 1;
      enrollment.lastPaymentDate = new Date();
      enrollment.nextPaymentDate = this.calculateNextPaymentDate(enrollment.loan);
      await this.autopayRepository.save(enrollment);

      this.logger.log(`Autopay processed: ${enrollmentId}. Amount: ${paymentAmount}`);

      return { success: true, repayment: savedRepayment };
    } catch (error) {
      enrollment.failedPayments += 1;
      enrollment.lastFailureReason = error.message;
      if (enrollment.failedPayments >= 3) {
        enrollment.status = AutopayStatus.FAILED;
      }
      await this.autopayRepository.save(enrollment);

      this.logger.error(`Autopay failed: ${enrollmentId}. Error: ${error.message}`);

      return { success: false, error: error.message };
    }
  }

  /**
   * Scheduled job: Process autopay payments
   * Runs daily to process due autopay payments
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processScheduledAutopay(): Promise<void> {
    this.logger.log('Processing scheduled autopay payments...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrollments = await this.autopayRepository.find({
      where: { status: AutopayStatus.ACTIVE, isVerified: true },
      relations: ['loan'],
    });

    for (const enrollment of enrollments) {
      if (enrollment.nextPaymentDate && enrollment.nextPaymentDate <= today) {
        try {
          await this.processAutopay(enrollment.id);
        } catch (error) {
          this.logger.error(`Failed to process autopay ${enrollment.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Processed autopay payments for ${enrollments.length} enrollments`);
  }

  /**
   * Cancel autopay
   */
  async cancel(enrollmentId: string, cancelDto: CancelAutopayDto, userId: string): Promise<AutopayEnrollment> {
    const enrollment = await this.autopayRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    enrollment.status = AutopayStatus.CANCELLED;
    enrollment.cancellationReason = cancelDto.cancellationReason;
    enrollment.cancelledDate = new Date();

    return await this.autopayRepository.save(enrollment);
  }

  /**
   * Get enrollment for loan
   */
  async getEnrollmentForLoan(loanId: string): Promise<AutopayEnrollment | null> {
    return await this.autopayRepository.findOne({
      where: { loanId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Calculate payment amount based on enrollment type
   */
  private async calculatePaymentAmount(enrollment: AutopayEnrollment): Promise<number> {
    const loan = enrollment.loan;

    switch (enrollment.amountType) {
      case AutopayAmountType.FIXED_AMOUNT:
        return enrollment.fixedAmount || 0;
      case AutopayAmountType.MINIMUM_PAYMENT:
        // Calculate minimum payment (would come from repayment schedule)
        return 0; // Placeholder
      case AutopayAmountType.FULL_BALANCE:
        // Calculate full balance
        return loan.loanAmount - (loan.totalPrincipalPaid || 0);
      default:
        return 0;
    }
  }

  /**
   * Calculate next payment date
   */
  private calculateNextPaymentDate(loan: Loan): Date {
    // Would calculate based on repayment schedule
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }
}

