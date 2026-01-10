import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAllocation, AllocationPreference } from '../entities/payment-allocation.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CreatePaymentAllocationDto } from '../dto/payment-allocation.dto';

/**
 * Service for payment allocation
 * UC-016: Early/Extra Payment - Allocation preferences
 */
@Injectable()
export class PaymentAllocationService {
  private readonly logger = new Logger(PaymentAllocationService.name);

  constructor(
    @InjectRepository(PaymentAllocation)
    private readonly allocationRepository: Repository<PaymentAllocation>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Allocate payment based on preference
   */
  async allocatePayment(createDto: CreatePaymentAllocationDto): Promise<PaymentAllocation> {
    const repayment = await this.repaymentRepository.findOne({
      where: { id: createDto.repaymentId },
      relations: ['loan'],
    });

    if (!repayment) {
      throw new NotFoundException(`Repayment with ID ${createDto.repaymentId} not found`);
    }

    const loan = repayment.loan;

    // Calculate allocation based on preference
    const allocation = this.calculateAllocation(
      createDto.totalAmount,
      createDto.allocationPreference,
      loan,
      repayment,
    );

    // Calculate prepayment penalty if applicable
    const prepaymentPenalty = createDto.isEarlyPayment || createDto.isExtraPayment
      ? this.calculatePrepaymentPenalty(loan, createDto.totalAmount)
      : 0;

    const paymentAllocation = this.allocationRepository.create({
      ...createDto,
      ...allocation,
      prepaymentPenalty,
    });

    const savedAllocation = await this.allocationRepository.save(paymentAllocation);

    // Update repayment with allocation
    repayment.principalPaid = allocation.principalAllocated;
    repayment.interestPaid = allocation.interestAllocated;
    repayment.penaltyPaid = allocation.penaltyAllocated + prepaymentPenalty;
    repayment.chargesPaid = allocation.chargesAllocated;
    repayment.excessAmount = allocation.excessAmount;
    await this.repaymentRepository.save(repayment);

    // Update loan balances
    loan.totalPrincipalPaid = (loan.totalPrincipalPaid || 0) + allocation.principalAllocated;
    loan.totalInterestPaid = (loan.totalInterestPaid || 0) + allocation.interestAllocated;
    loan.totalPenaltyPaid = (loan.totalPenaltyPaid || 0) + allocation.penaltyAllocated + prepaymentPenalty;
    loan.totalAmountPaid = (loan.totalAmountPaid || 0) + createDto.totalAmount;

    // Recalculate interest if early/extra payment
    if (createDto.isEarlyPayment || createDto.isExtraPayment) {
      // Would trigger interest recalculation
      // await this.interestService.recalculateInterest(loan.id);
    }

    await this.loanRepository.save(loan);

    this.logger.log(`Payment allocated: ${savedAllocation.id} for repayment ${repayment.id}`);

    return savedAllocation;
  }

  /**
   * Calculate allocation based on preference
   */
  private calculateAllocation(
    totalAmount: number,
    preference: AllocationPreference,
    loan: Loan,
    repayment: LoanRepayment,
  ): {
    principalAllocated: number;
    interestAllocated: number;
    penaltyAllocated: number;
    chargesAllocated: number;
    excessAmount: number;
  } {
    const outstandingPrincipal = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    const outstandingInterest = this.calculateOutstandingInterest(loan);
    const outstandingPenalty = repayment.penaltyPaid || 0;
    const outstandingCharges = repayment.chargesPaid || 0;

    const totalOutstanding = outstandingPrincipal + outstandingInterest + outstandingPenalty + outstandingCharges;

    let principalAllocated = 0;
    let interestAllocated = 0;
    let penaltyAllocated = 0;
    let chargesAllocated = 0;
    let excessAmount = 0;
    let remaining = 0;
    let remaining2 = 0;
    let remaining3 = 0;

    switch (preference) {
      case AllocationPreference.PRINCIPAL_ONLY:
        principalAllocated = Math.min(totalAmount, outstandingPrincipal);
        excessAmount = totalAmount - principalAllocated;
        break;

      case AllocationPreference.PRINCIPAL_FIRST:
        principalAllocated = Math.min(totalAmount, outstandingPrincipal);
        remaining = totalAmount - principalAllocated;
        interestAllocated = Math.min(remaining, outstandingInterest);
        remaining2 = remaining - interestAllocated;
        penaltyAllocated = Math.min(remaining2, outstandingPenalty);
        remaining3 = remaining2 - penaltyAllocated;
        chargesAllocated = Math.min(remaining3, outstandingCharges);
        excessAmount = remaining3 - chargesAllocated;
        break;

      case AllocationPreference.INTEREST_FIRST:
        interestAllocated = Math.min(totalAmount, outstandingInterest);
        remaining = totalAmount - interestAllocated;
        principalAllocated = Math.min(remaining, outstandingPrincipal);
        remaining2 = remaining - principalAllocated;
        penaltyAllocated = Math.min(remaining2, outstandingPenalty);
        remaining3 = remaining2 - penaltyAllocated;
        chargesAllocated = Math.min(remaining3, outstandingCharges);
        excessAmount = remaining3 - chargesAllocated;
        break;

      case AllocationPreference.PROPORTIONAL:
      default:
        if (totalOutstanding > 0) {
          const principalRatio = outstandingPrincipal / totalOutstanding;
          const interestRatio = outstandingInterest / totalOutstanding;
          const penaltyRatio = outstandingPenalty / totalOutstanding;
          const chargesRatio = outstandingCharges / totalOutstanding;

          principalAllocated = Math.min(totalAmount * principalRatio, outstandingPrincipal);
          interestAllocated = Math.min(totalAmount * interestRatio, outstandingInterest);
          penaltyAllocated = Math.min(totalAmount * penaltyRatio, outstandingPenalty);
          chargesAllocated = Math.min(totalAmount * chargesRatio, outstandingCharges);
          excessAmount = totalAmount - principalAllocated - interestAllocated - penaltyAllocated - chargesAllocated;
        } else {
          excessAmount = totalAmount;
        }
        break;
    }

    return {
      principalAllocated,
      interestAllocated,
      penaltyAllocated,
      chargesAllocated,
      excessAmount,
    };
  }

  /**
   * Calculate outstanding interest
   */
  private calculateOutstandingInterest(loan: Loan): number {
    // Simplified calculation - would use actual interest accrual
    return 0; // Placeholder
  }

  /**
   * Calculate prepayment penalty
   */
  private calculatePrepaymentPenalty(loan: Loan, amount: number): number {
    // Simplified calculation - would check loan product for penalty rules
    return 0; // Placeholder
  }

  /**
   * Get allocation for repayment
   */
  async getAllocationForRepayment(repaymentId: string): Promise<PaymentAllocation | null> {
    return await this.allocationRepository.findOne({
      where: { repaymentId },
    });
  }
}

