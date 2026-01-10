import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentReversal, ReversalStatus, ReversalReason } from '../entities/payment-reversal.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { CreatePaymentReversalDto, UpdatePaymentReversalDto } from '../dto/payment-reversal.dto';

/**
 * Service for payment reversals
 * UC-017: Payment Reversal
 */
@Injectable()
export class PaymentReversalService {
  private readonly logger = new Logger(PaymentReversalService.name);

  constructor(
    @InjectRepository(PaymentReversal)
    private readonly reversalRepository: Repository<PaymentReversal>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Create payment reversal
   */
  async createReversal(createDto: CreatePaymentReversalDto, userId: string): Promise<PaymentReversal> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const repayment = await this.repaymentRepository.findOne({ where: { id: createDto.repaymentId } });
    if (!repayment) {
      throw new NotFoundException(`Repayment with ID ${createDto.repaymentId} not found`);
    }

    if (repayment.loanId !== createDto.loanId) {
      throw new BadRequestException('Repayment does not belong to the specified loan');
    }

    // Calculate NSF fee if applicable
    const nsfFee = createDto.reason === ReversalReason.NSF ? (createDto.nsfFee || 25.00) : 0;

    const reversal = this.reversalRepository.create({
      ...createDto,
      nsfFee,
      processedBy: userId,
      status: ReversalStatus.PENDING,
    });

    const savedReversal = await this.reversalRepository.save(reversal);

    // Process reversal
    await this.processReversal(savedReversal.id, userId, {
      notifyBorrower: createDto.notifyBorrower ?? true,
      initiateCollection: createDto.initiateCollection ?? false,
    });

    this.logger.log(`Payment reversal created: ${savedReversal.id} for repayment ${repayment.id}`);

    return savedReversal;
  }

  /**
   * Process payment reversal
   */
  async processReversal(
    reversalId: string,
    userId: string,
    options: { notifyBorrower?: boolean; initiateCollection?: boolean } = {},
  ): Promise<PaymentReversal> {
    const reversal = await this.reversalRepository.findOne({
      where: { id: reversalId },
      relations: ['repayment', 'loan'],
    });

    if (!reversal) {
      throw new NotFoundException(`Reversal with ID ${reversalId} not found`);
    }

    if (reversal.status !== ReversalStatus.PENDING) {
      throw new BadRequestException(`Reversal is not in PENDING status`);
    }

    try {
      // Reverse the payment allocation
      const repayment = reversal.repayment;
      const loan = reversal.loan;

      // Update loan balances (reverse the payment)
      loan.totalPrincipalPaid = Math.max(0, (loan.totalPrincipalPaid || 0) - repayment.principalPaid);
      loan.totalInterestPaid = Math.max(0, (loan.totalInterestPaid || 0) - repayment.interestPaid);
      loan.totalPenaltyPaid = Math.max(0, (loan.totalPenaltyPaid || 0) - repayment.penaltyPaid);
      loan.totalAmountPaid = Math.max(0, (loan.totalAmountPaid || 0) - repayment.amountPaid);

      // Add NSF fee if applicable
      if (reversal.nsfFee > 0) {
        loan.totalPenaltyPaid = (loan.totalPenaltyPaid || 0) + reversal.nsfFee;
      }

      await this.loanRepository.save(loan);

      // Update reversal status
      reversal.status = ReversalStatus.PROCESSED;
      reversal.processedAt = new Date();
      reversal.processedBy = userId;

      // Notify borrower
      if (options.notifyBorrower) {
        reversal.borrowerNotified = true;
        reversal.borrowerNotifiedAt = new Date();
        // await this.notificationService.sendReversalNotification(reversal);
      }

      // Initiate collection if requested
      if (options.initiateCollection && reversal.reason === ReversalReason.NSF) {
        reversal.collectionInitiated = true;
        reversal.collectionInitiatedAt = new Date();
        // await this.collectionService.initiateCollection(loan.id, reversal);
      }

      const savedReversal = await this.reversalRepository.save(reversal);

      this.logger.log(`Payment reversal processed: ${reversalId}`);

      return savedReversal;
    } catch (error) {
      reversal.status = ReversalStatus.FAILED;
      await this.reversalRepository.save(reversal);
      throw error;
    }
  }

  /**
   * Get reversals for loan
   */
  async getReversalsForLoan(loanId: string): Promise<PaymentReversal[]> {
    return await this.reversalRepository.find({
      where: { loanId },
      relations: ['repayment'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get reversal by ID
   */
  async getReversal(reversalId: string): Promise<PaymentReversal> {
    const reversal = await this.reversalRepository.findOne({
      where: { id: reversalId },
      relations: ['repayment', 'loan'],
    });

    if (!reversal) {
      throw new NotFoundException(`Reversal with ID ${reversalId} not found`);
    }

    return reversal;
  }
}

