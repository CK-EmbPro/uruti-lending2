import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartialPayment, PartialPaymentStatus } from '../entities/partial-payment.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CreatePartialPaymentDto, ApplyPartialPaymentDto } from '../dto/partial-payment.dto';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

/**
 * Service for partial payment handling
 * UC-018: Partial Payment Handling
 */
@Injectable()
export class PartialPaymentService {
  private readonly logger = new Logger(PartialPaymentService.name);

  constructor(
    @InjectRepository(PartialPayment)
    private readonly partialPaymentRepository: Repository<PartialPayment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Create partial payment (hold in suspense)
   */
  async createPartialPayment(createDto: CreatePartialPaymentDto): Promise<PartialPayment> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    if (createDto.amount >= createDto.requiredAmount) {
      throw new BadRequestException('Payment amount must be less than required amount for partial payment');
    }

    // Calculate accumulated amount
    const existingPartialPayments = await this.partialPaymentRepository.find({
      where: { loanId: createDto.loanId, status: PartialPaymentStatus.IN_SUSPENSE },
    });

    const accumulatedAmount = existingPartialPayments.reduce(
      (sum, pp) => sum + Number(pp.amount),
      0,
    ) + Number(createDto.amount);

    // Calculate late fee if applicable
    const lateFeeAmount = createDto.assessLateFee ? this.calculateLateFee(createDto.requiredAmount) : 0;

    const partialPayment = this.partialPaymentRepository.create({
      ...createDto,
      paymentDate: new Date(createDto.paymentDate),
      accumulatedAmount,
      lateFeeAmount,
      lateFeeAssessed: createDto.assessLateFee || false,
      status: PartialPaymentStatus.IN_SUSPENSE,
    });

    const savedPayment = await this.partialPaymentRepository.save(partialPayment);

    // Check if accumulated amount is now sufficient
    if (accumulatedAmount >= createDto.requiredAmount) {
      // Auto-apply if sufficient
      await this.applyPartialPayment(savedPayment.id, { partialPaymentId: savedPayment.id, applyWithLateFee: createDto.assessLateFee || false });
    }

    this.logger.log(`Partial payment created: ${savedPayment.id} for loan ${loan.loanNumber}`);

    return savedPayment;
  }

  /**
   * Apply partial payment (when sufficient amount accumulated)
   */
  async applyPartialPayment(
    partialPaymentId: string,
    applyDto: ApplyPartialPaymentDto,
  ): Promise<{ partialPayment: PartialPayment; repayment?: LoanRepayment }> {
    const partialPayment = await this.partialPaymentRepository.findOne({
      where: { id: partialPaymentId },
      relations: ['loan'],
    });

    if (!partialPayment) {
      throw new NotFoundException(`Partial payment with ID ${partialPaymentId} not found`);
    }

    if (partialPayment.status !== PartialPaymentStatus.IN_SUSPENSE) {
      throw new BadRequestException(`Partial payment is not in suspense. Current status: ${partialPayment.status}`);
    }

    const loan = partialPayment.loan;

    // Get all partial payments in suspense for this loan
    const allPartialPayments = await this.partialPaymentRepository.find({
      where: { loanId: loan.id, status: PartialPaymentStatus.IN_SUSPENSE },
    });

    const totalAccumulated = allPartialPayments.reduce((sum, pp) => sum + Number(pp.accumulatedAmount), 0);

    if (totalAccumulated < partialPayment.requiredAmount && !applyDto.applyWithLateFee) {
      throw new BadRequestException(
        `Insufficient accumulated amount. Required: ${partialPayment.requiredAmount}, Available: ${totalAccumulated}`,
      );
    }

    // Calculate payment amount (with late fee if applicable)
    const paymentAmount = applyDto.applyWithLateFee
      ? totalAccumulated - partialPayment.lateFeeAmount
      : totalAccumulated;

    // Create repayment record
    const repayment = this.repaymentRepository.create({
      loanId: loan.id,
      postingDate: new Date(),
      amountPaid: paymentAmount,
      principalPaid: paymentAmount * 0.8, // Simplified allocation
      interestPaid: paymentAmount * 0.2,
      penaltyPaid: applyDto.applyWithLateFee ? partialPayment.lateFeeAmount : 0,
      modeOfPayment: partialPayment.modeOfPayment || 'Partial Payment',
      referenceNumber: partialPayment.referenceNumber,
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan balances
    loan.totalPrincipalPaid = (loan.totalPrincipalPaid || 0) + repayment.principalPaid;
    loan.totalInterestPaid = (loan.totalInterestPaid || 0) + repayment.interestPaid;
    loan.totalPenaltyPaid = (loan.totalPenaltyPaid || 0) + repayment.penaltyPaid;
    loan.totalAmountPaid = (loan.totalAmountPaid || 0) + repayment.amountPaid;
    await this.loanRepository.save(loan);

    // Update all partial payments to applied
    for (const pp of allPartialPayments) {
      pp.status = PartialPaymentStatus.APPLIED;
      pp.appliedDate = new Date();
      await this.partialPaymentRepository.save(pp);
    }

    this.logger.log(`Partial payment applied: ${partialPaymentId}. Amount: ${paymentAmount}`);

    return { partialPayment, repayment: savedRepayment };
  }

  /**
   * Get partial payments for loan
   */
  async getPartialPaymentsForLoan(loanId: string): Promise<PartialPayment[]> {
    return await this.partialPaymentRepository.find({
      where: { loanId },
      order: { paymentDate: 'DESC' },
    });
  }

  /**
   * Get partial payments in suspense
   */
  async getSuspensePayments(loanId: string): Promise<PartialPayment[]> {
    return await this.partialPaymentRepository.find({
      where: { loanId, status: PartialPaymentStatus.IN_SUSPENSE },
      order: { paymentDate: 'ASC' },
    });
  }

  /**
   * Calculate late fee
   */
  private calculateLateFee(requiredAmount: number): number {
    // Simple late fee calculation (5% of required amount, max $50)
    return Math.min(requiredAmount * 0.05, 50);
  }
}

