import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRestructure } from '../entities/loan-restructure.entity';

/**
 * Restructure Fee Calculation Service
 * 
 * Calculates restructure fees based on business policy:
 * - Fee can be a percentage of outstanding principal
 * - Fee can be a fixed amount
 * - Fee can vary based on restructure count
 * - Fee can be waived for certain restructure types
 */
@Injectable()
export class RestructureFeeService {
  private readonly logger = new Logger(RestructureFeeService.name);

  // Fee policy constants
  private readonly DEFAULT_FEE_PERCENTAGE = 1.0; // 1% of outstanding principal
  private readonly DEFAULT_FIXED_FEE = 500; // $500 fixed fee
  private readonly FEE_TYPE = 'PERCENTAGE'; // 'PERCENTAGE' or 'FIXED'
  private readonly FIRST_RESTRUCTURE_FEE_MULTIPLIER = 1.0; // 100% of base fee
  private readonly SECOND_RESTRUCTURE_FEE_MULTIPLIER = 1.5; // 150% of base fee (higher for 2nd restructure)

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRestructure)
    private readonly restructureRepository: Repository<LoanRestructure>,
  ) {}

  /**
   * Calculate restructure fee based on policy
   * 
   * @param loanId - Loan ID
   * @param restructureCount - Current restructure count (1-based)
   * @returns Calculated fee amount
   */
  async calculateRestructureFee(
    loanId: string,
    restructureCount: number,
  ): Promise<number> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      this.logger.warn(`Loan ${loanId} not found, returning default fee`);
      return this.DEFAULT_FIXED_FEE;
    }

    // Calculate outstanding principal
    const outstandingPrincipal = this.calculateOutstandingPrincipal(loan);

    // Determine fee multiplier based on restructure count
    const feeMultiplier =
      restructureCount === 1
        ? this.FIRST_RESTRUCTURE_FEE_MULTIPLIER
        : this.SECOND_RESTRUCTURE_FEE_MULTIPLIER;

    // Calculate fee based on policy type
    let fee: number;
    if (this.FEE_TYPE === 'PERCENTAGE') {
      fee = (outstandingPrincipal * this.DEFAULT_FEE_PERCENTAGE) / 100;
    } else {
      fee = this.DEFAULT_FIXED_FEE;
    }

    // Apply multiplier for subsequent restructures
    fee = fee * feeMultiplier;

    // Round to 2 decimal places
    fee = Math.round(fee * 100) / 100;

    this.logger.log(
      `Calculated restructure fee for loan ${loanId}: ` +
      `Outstanding=${outstandingPrincipal}, ` +
      `RestructureCount=${restructureCount}, ` +
      `Fee=${fee}, ` +
      `Type=${this.FEE_TYPE}`,
    );

    return fee;
  }

  /**
   * Calculate outstanding principal amount
   */
  private calculateOutstandingPrincipal(loan: Loan): number {
    const disbursedAmount = Number(loan.disbursedAmount || 0);
    const totalPrincipalPaid = Number(loan.totalPrincipalPaid || 0);
    const outstanding = Math.max(0, disbursedAmount - totalPrincipalPaid);
    return outstanding;
  }

  /**
   * Get fee policy configuration
   */
  getFeePolicy(): {
    feeType: string;
    feePercentage: number;
    fixedFee: number;
    firstRestructureMultiplier: number;
    secondRestructureMultiplier: number;
  } {
    return {
      feeType: this.FEE_TYPE,
      feePercentage: this.DEFAULT_FEE_PERCENTAGE,
      fixedFee: this.DEFAULT_FIXED_FEE,
      firstRestructureMultiplier: this.FIRST_RESTRUCTURE_FEE_MULTIPLIER,
      secondRestructureMultiplier: this.SECOND_RESTRUCTURE_FEE_MULTIPLIER,
    };
  }

  /**
   * Check if fee should be waived for a restructure type
   * 
   * @param restructureType - Type of restructure
   * @returns True if fee should be waived
   */
  shouldWaiveFee(restructureType: string): boolean {
    // Fee can be waived for hardship restructures
    // Add more logic as needed based on business rules
    return restructureType === 'HARDSHIP_RESTRUCTURE';
  }
}

