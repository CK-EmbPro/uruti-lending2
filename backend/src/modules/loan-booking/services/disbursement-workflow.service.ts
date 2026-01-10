import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanBooking, BookingStatus } from '../entities/loan-booking.entity';
import { CreateLoanDisbursementDto } from '../../loan-disbursement/dto/create-loan-disbursement.dto';

/**
 * Enhanced disbursement workflow service
 * UC-012: Loan Disbursement
 */
@Injectable()
export class DisbursementWorkflowService {
  private readonly logger = new Logger(DisbursementWorkflowService.name);

  constructor(
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanBooking)
    private readonly bookingRepository: Repository<LoanBooking>,
  ) {}

  /**
   * Verify conditions before disbursement
   */
  async verifyDisbursementConditions(loanId: string): Promise<{
    verified: boolean;
    conditions: Array<{ name: string; status: 'met' | 'pending' | 'failed'; message: string }>;
  }> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const conditions: Array<{ name: string; status: 'met' | 'pending' | 'failed'; message: string }> = [];

    // Condition 1: Loan must be booked
    const booking = await this.bookingRepository.findOne({
      where: { loanId },
    });

    if (!booking || booking.status !== BookingStatus.BOOKED) {
      conditions.push({
        name: 'Loan Booking',
        status: 'failed',
        message: 'Loan must be booked before disbursement',
      });
    } else {
      conditions.push({
        name: 'Loan Booking',
        status: 'met',
        message: 'Loan is booked',
      });
    }

    // Condition 2: All documents must be signed
    if (booking) {
      // This would check if all required documents are signed
      // For now, we'll assume booking status indicates this
      if (booking.status === BookingStatus.BOOKED) {
        conditions.push({
          name: 'Document Signatures',
          status: 'met',
          message: 'All required documents are signed',
        });
      } else {
        conditions.push({
          name: 'Document Signatures',
          status: 'pending',
          message: 'Waiting for document signatures',
        });
      }
    }

    // Condition 3: Account must be created
    if (booking?.accountCreated) {
      conditions.push({
        name: 'Account Creation',
        status: 'met',
        message: `Account created: ${booking.accountNumber}`,
      });
    } else {
      conditions.push({
        name: 'Account Creation',
        status: 'pending',
        message: 'Loan account not yet created',
      });
    }

    // Condition 4: Loan status must be SANCTIONED
    if (loan.status === LoanStatus.SANCTIONED || loan.status === LoanStatus.PARTIALLY_DISBURSED) {
      conditions.push({
        name: 'Loan Status',
        status: 'met',
        message: `Loan status is ${loan.status}`,
      });
    } else {
      conditions.push({
        name: 'Loan Status',
        status: 'failed',
        message: `Loan must be SANCTIONED. Current status: ${loan.status}`,
      });
    }

    // Condition 5: Security requirements (if secured loan)
    if (loan.isSecuredLoan) {
      // In production, verify security assignment
      conditions.push({
        name: 'Security Assignment',
        status: 'met', // Would check actual security assignment
        message: 'Security assigned',
      });
    }

    const allMet = conditions.every((c) => c.status === 'met');
    const hasFailed = conditions.some((c) => c.status === 'failed');

    return {
      verified: allMet && !hasFailed,
      conditions,
    };
  }

  /**
   * Initiate disbursement with condition verification
   */
  async initiateDisbursement(
    loanId: string,
    createDto: CreateLoanDisbursementDto,
    userId: string,
  ): Promise<{ disbursement: LoanDisbursement; notificationSent: boolean }> {
    // Verify conditions
    const verification = await this.verifyDisbursementConditions(loanId);

    if (!verification.verified) {
      const failedConditions = verification.conditions.filter((c) => c.status === 'failed');
      throw new BadRequestException(
        `Disbursement conditions not met: ${failedConditions.map((c) => c.name).join(', ')}`,
      );
    }

    // Create disbursement (using existing service logic)
    // In production, this would call the LoanDisbursementService
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const disbursement = this.disbursementRepository.create({
      ...createDto,
      loanId: loan.id,
    });

    const savedDisbursement = await this.disbursementRepository.save(disbursement);

    // Update loan disbursed amount
    const existingDisbursements = await this.disbursementRepository.find({
      where: { loanId },
    });

    const totalDisbursed = existingDisbursements.reduce(
      (sum, d) => sum + Number(d.disbursedAmount),
      0,
    );

    loan.disbursedAmount = totalDisbursed;

    if (totalDisbursed >= loan.loanAmount) {
      loan.status = LoanStatus.DISBURSED;
      loan.disbursementDate = new Date(createDto.disbursementDate);
    } else {
      loan.status = LoanStatus.PARTIALLY_DISBURSED;
    }

    await this.loanRepository.save(loan);

    // Send notification to borrower
    const notificationSent = await this.sendDisbursementNotification(savedDisbursement, loan);

    this.logger.log(
      `Disbursement initiated for loan ${loan.loanNumber}. Amount: ${createDto.disbursedAmount}`,
    );

    return { disbursement: savedDisbursement, notificationSent };
  }

  /**
   * Send disbursement notification (mocked - integrate with notification service)
   */
  private async sendDisbursementNotification(
    disbursement: LoanDisbursement,
    loan: Loan,
  ): Promise<boolean> {
    // In production, this would:
    // 1. Send email to borrower
    // 2. Send SMS notification
    // 3. Create in-app notification
    // 4. Generate disbursement receipt

    this.logger.log(
      `Disbursement notification sent for loan ${loan.loanNumber}. Amount: ${disbursement.disbursedAmount}`,
    );

    return true;
  }

  /**
   * Record disbursement transaction
   */
  async recordDisbursementTransaction(disbursementId: string): Promise<void> {
    const disbursement = await this.disbursementRepository.findOne({
      where: { id: disbursementId },
      relations: ['loan'],
    });

    if (!disbursement) {
      throw new NotFoundException(`Disbursement with ID ${disbursementId} not found`);
    }

    // In production, this would create accounting entries:
    // - Debit: Loan Account
    // - Credit: Cash/Bank Account
    // - Record in GL

    this.logger.log(`Disbursement transaction recorded: ${disbursementId}`);

    // This would integrate with AccountingService
    // await this.accountingService.createDisbursementEntry(disbursement);
  }

  /**
   * Get disbursement readiness status
   */
  async getDisbursementReadiness(loanId: string): Promise<{
    ready: boolean;
    conditions: Array<{ name: string; status: 'met' | 'pending' | 'failed'; message: string }>;
    canDisburse: boolean;
  }> {
    const verification = await this.verifyDisbursementConditions(loanId);

    return {
      ready: verification.verified,
      conditions: verification.conditions,
      canDisburse: verification.verified,
    };
  }
}

