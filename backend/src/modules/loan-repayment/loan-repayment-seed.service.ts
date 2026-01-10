import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { Loan } from '../loan/entities/loan.entity';
import { RepaymentType } from '../../common/enums/repayment-type.enum';
import { LoanStatus } from '../../common/enums/loan-status.enum';

@Injectable()
export class LoanRepaymentSeedService {
  private readonly logger = new Logger(LoanRepaymentSeedService.name);

  constructor(
    @InjectRepository(LoanRepayment)
    private readonly loanRepaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Seed repayments for existing loans
   */
  async seedRepayments(): Promise<void> {
    this.logger.log('Starting repayment seed...');

    try {
      // Check if repayments already exist
      const existingRepayments = await this.loanRepaymentRepository.count();
      if (existingRepayments > 0) {
        this.logger.log(
          `Found ${existingRepayments} existing repayments. Skipping seed.`,
        );
        return;
      }

      // Get all active/disbursed loans
      const loans = await this.loanRepository.find({
        where: [
          { status: LoanStatus.ACTIVE },
          { status: LoanStatus.DISBURSED },
        ],
        order: { createdAt: 'ASC' },
      });

      if (loans.length === 0) {
        this.logger.log('No active or disbursed loans found. Skipping repayment seed.');
        return;
      }

      this.logger.log(`Found ${loans.length} loans to create repayments for.`);

      let totalRepaymentsCreated = 0;

      for (const loan of loans) {
        try {
          const repaymentsCreated = await this.createRepaymentsForLoan(loan);
          totalRepaymentsCreated += repaymentsCreated;
        } catch (error) {
          this.logger.error(
            `Failed to create repayments for loan ${loan.loanNumber}: ${error.message}`,
            error.stack,
          );
          // Continue with next loan even if one fails
        }
      }

      this.logger.log(
        `Successfully created ${totalRepaymentsCreated} repayments for ${loans.length} loans.`,
      );
    } catch (error) {
      this.logger.error(`Error seeding repayments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create repayments for a specific loan
   */
  private async createRepaymentsForLoan(loan: Loan): Promise<number> {
    // Determine how many repayments to create (1-6 repayments, or up to repayment periods)
    const maxRepayments = Math.min(
      Math.floor(Math.random() * 6) + 1,
      loan.repaymentPeriods || 12,
    );

    // Calculate monthly payment amount
    const loanAmount = Number(loan.loanAmount) || 0;
    const repaymentPeriods = loan.repaymentPeriods || 12;
    const interestRate = Number(loan.rateOfInterest) || 0;
    
    // Simple calculation: monthly payment = (P * r * (1 + r)^n) / ((1 + r)^n - 1)
    // For simplicity, we'll use a basic calculation
    const monthlyPrincipal = loanAmount / repaymentPeriods;
    const monthlyInterest = (loanAmount * interestRate) / (100 * 12);
    const monthlyAmount = monthlyPrincipal + monthlyInterest;

    // Get repayment start date
    const repaymentStartDate = loan.repaymentStartDate
      ? new Date(loan.repaymentStartDate)
      : loan.postingDate
        ? new Date(loan.postingDate)
        : new Date();

    const repayments: LoanRepayment[] = [];
    let repaymentCounter = 1;

    for (let i = 0; i < maxRepayments; i++) {
      // Calculate repayment date (monthly intervals from repayment start date)
      const repaymentDate = new Date(repaymentStartDate);
      repaymentDate.setMonth(repaymentDate.getMonth() + i);

      // Skip if repayment date is in the future
      if (repaymentDate > new Date()) {
        continue;
      }

      // Vary the amounts slightly for realism
      const variance = 0.9 + Math.random() * 0.2; // 90% to 110% of base amount
      const actualAmount = monthlyAmount * variance;

      // Calculate principal and interest (principal increases over time, interest decreases)
      const principalRatio = 0.7 + (i * 0.05); // Start at 70%, increase by 5% each month
      const principalPaid = Math.min(actualAmount * principalRatio, loanAmount);
      const interestPaid = actualAmount - principalPaid;
      
      // Sometimes add penalty (10% chance)
      const hasPenalty = Math.random() < 0.1;
      const penaltyPaid = hasPenalty ? actualAmount * 0.05 : 0;
      
      // Sometimes add charges (5% chance)
      const hasCharges = Math.random() < 0.05;
      const chargesPaid = hasCharges ? actualAmount * 0.02 : 0;

      // Determine repayment type
      let repaymentType = RepaymentType.NORMAL_REPAYMENT;
      if (i === maxRepayments - 1 && Math.random() < 0.2) {
        // 20% chance of advance payment for last payment
        repaymentType = RepaymentType.ADVANCE_PAYMENT;
      }

      // Calculate excess amount (if payment is more than required)
      const requiredAmount = monthlyAmount + penaltyPaid + chargesPaid;
      const excessAmount = actualAmount > requiredAmount 
        ? actualAmount - requiredAmount 
        : 0;

      const repayment = this.loanRepaymentRepository.create({
        loanId: loan.id,
        postingDate: repaymentDate,
        valueDate: repaymentDate,
        amountPaid: Math.round(actualAmount * 100) / 100,
        principalPaid: Math.round(principalPaid * 100) / 100,
        interestPaid: Math.round(interestPaid * 100) / 100,
        penaltyPaid: Math.round(penaltyPaid * 100) / 100,
        chargesPaid: Math.round(chargesPaid * 100) / 100,
        excessAmount: Math.round(excessAmount * 100) / 100,
        repaymentType,
        referenceNumber: `REPAY-${loan.loanNumber}-${repaymentCounter.toString().padStart(3, '0')}`,
        modeOfPayment: this.getRandomPaymentMode(),
      });

      repayments.push(repayment);
      repaymentCounter++;
    }

    if (repayments.length > 0) {
      await this.loanRepaymentRepository.save(repayments);
      this.logger.log(
        `Created ${repayments.length} repayments for loan: ${loan.loanNumber}`,
      );
    }

    return repayments.length;
  }

  /**
   * Get random payment mode
   */
  private getRandomPaymentMode(): string {
    const modes = [
      'Bank Transfer',
      'Cash',
      'Cheque',
      'Mobile Money',
      'Credit Card',
      'Debit Card',
      'Online Payment',
    ];
    return modes[Math.floor(Math.random() * modes.length)];
  }

  /**
   * Create repayments for loans that don't have any repayments yet
   */
  async createRepaymentsForLoansWithoutRepayments(): Promise<void> {
    this.logger.log('Creating repayments for loans without repayments...');

    try {
      // Get all active/disbursed loans
      const loans = await this.loanRepository.find({
        where: [
          { status: LoanStatus.ACTIVE },
          { status: LoanStatus.DISBURSED },
        ],
      });

      // Get loans that already have repayments
      const loansWithRepayments = await this.loanRepaymentRepository
        .createQueryBuilder('repayment')
        .select('DISTINCT repayment.loanId', 'loanId')
        .getRawMany();

      const loanIdsWithRepayments = new Set(
        loansWithRepayments.map((r) => r.loanId),
      );

      // Filter loans without repayments
      const loansWithoutRepayments = loans.filter(
        (loan) => !loanIdsWithRepayments.has(loan.id),
      );

      if (loansWithoutRepayments.length === 0) {
        this.logger.log('All loans already have repayments.');
        return;
      }

      this.logger.log(
        `Found ${loansWithoutRepayments.length} loans without repayments.`,
      );

      let totalRepaymentsCreated = 0;

      for (const loan of loansWithoutRepayments) {
        try {
          const repaymentsCreated = await this.createRepaymentsForLoan(loan);
          totalRepaymentsCreated += repaymentsCreated;
        } catch (error) {
          this.logger.error(
            `Failed to create repayments for loan ${loan.loanNumber}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Successfully created ${totalRepaymentsCreated} repayments for ${loansWithoutRepayments.length} loans.`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating repayments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

