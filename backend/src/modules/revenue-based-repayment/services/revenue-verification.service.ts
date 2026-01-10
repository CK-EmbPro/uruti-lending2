import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RevenueVerification, VerificationStatus, DiscrepancyType } from '../entities/revenue-verification.entity';
import { RevenueTracking } from '../entities/revenue-tracking.entity';
import { BankTransaction } from '../../open-banking/entities/bank-transaction.entity';
import { RevenueBasedRepaymentConfig } from '../entities/revenue-based-repayment-config.entity';

@Injectable()
export class RevenueVerificationService {
  private readonly logger = new Logger(RevenueVerificationService.name);

  constructor(
    @InjectRepository(RevenueVerification)
    private readonly verificationRepository: Repository<RevenueVerification>,
    @InjectRepository(RevenueTracking)
    private readonly revenueTrackingRepository: Repository<RevenueTracking>,
    @InjectRepository(BankTransaction)
    private readonly bankTransactionRepository: Repository<BankTransaction>,
    @InjectRepository(RevenueBasedRepaymentConfig)
    private readonly configRepository: Repository<RevenueBasedRepaymentConfig>,
  ) {}

  /**
   * Verify revenue against bank statements
   */
  async verifyRevenueAgainstBankStatements(
    revenueTrackingId: string,
    bankAccountId: string,
  ): Promise<RevenueVerification> {
    const revenue = await this.revenueTrackingRepository.findOne({
      where: { id: revenueTrackingId },
      relations: ['loan'],
    });

    if (!revenue) {
      throw new Error(`Revenue tracking ${revenueTrackingId} not found`);
    }

    // Get config to check verification threshold
    const config = await this.configRepository.findOne({
      where: { loanId: revenue.loanId },
    });

    const threshold = config?.verificationThreshold || 5; // Default 5%

    // Find matching bank transactions
    const startDate = new Date(revenue.revenueDate);
    startDate.setDate(startDate.getDate() - 3); // 3 days before
    const endDate = new Date(revenue.revenueDate);
    endDate.setDate(endDate.getDate() + 3); // 3 days after

    const allTransactions = await this.bankTransactionRepository.find({
      where: {
        accountId: bankAccountId,
        transactionDate: Between(startDate, endDate),
      },
    });

    // Filter for credit transactions (positive amounts)
    const bankTransactions = allTransactions.filter(t => t.amount > 0);

    // Find closest matching transaction
    let closestTransaction: BankTransaction | null = null;
    let minDifference = Infinity;

    for (const transaction of bankTransactions) {
      const amountDifference = Math.abs(transaction.amount - revenue.revenueAmount);
      const dateDifference = Math.abs(
        transaction.transactionDate.getTime() - revenue.revenueDate.getTime(),
      );

      // Weighted difference (amount is more important)
      const totalDifference = amountDifference + dateDifference / (1000 * 60 * 60 * 24) * 100;

      if (totalDifference < minDifference) {
        minDifference = totalDifference;
        closestTransaction = transaction;
      }
    }

    // Calculate discrepancy
    let status = VerificationStatus.VERIFIED;
    let discrepancyType: DiscrepancyType | null = null;
    let discrepancyAmount = 0;
    let discrepancyPercentage = 0;

    if (closestTransaction) {
      const amountDiff = Math.abs(closestTransaction.amount - revenue.revenueAmount);
      discrepancyPercentage = (amountDiff / revenue.revenueAmount) * 100;

      if (discrepancyPercentage > threshold) {
        status = VerificationStatus.DISCREPANCY;
        discrepancyType = DiscrepancyType.AMOUNT_MISMATCH;
        discrepancyAmount = revenue.revenueAmount - closestTransaction.amount;
      } else if (
        Math.abs(
          closestTransaction.transactionDate.getTime() - revenue.revenueDate.getTime(),
        ) >
        2 * 24 * 60 * 60 * 1000 // More than 2 days difference
      ) {
        status = VerificationStatus.DISCREPANCY;
        discrepancyType = DiscrepancyType.DATE_MISMATCH;
      }
    } else {
      // No matching transaction found
      status = VerificationStatus.DISCREPANCY;
      discrepancyType = DiscrepancyType.MISSING_TRANSACTION;
    }

    // Create verification record
    const verification = this.verificationRepository.create({
      loanId: revenue.loanId,
      revenueTrackingId: revenue.id,
      companyId: revenue.companyId,
      reportedRevenue: revenue.revenueAmount,
      reportedDate: revenue.revenueDate,
      bankStatementAmount: closestTransaction?.amount || null,
      bankStatementDate: closestTransaction?.transactionDate || null,
      bankAccountId,
      bankTransactionId: closestTransaction?.id || null,
      status,
      discrepancyType,
      discrepancyAmount: discrepancyAmount || null,
      discrepancyPercentage: discrepancyPercentage || null,
      verificationDetails: {
        matchingTransactions: closestTransaction ? [closestTransaction.id] : [],
        missingTransactions: closestTransaction ? [] : [revenue.id],
        flaggedReasons:
          status === VerificationStatus.DISCREPANCY
            ? [
                discrepancyType === DiscrepancyType.AMOUNT_MISMATCH
                  ? `Amount mismatch: ${discrepancyPercentage.toFixed(2)}% difference`
                  : discrepancyType === DiscrepancyType.DATE_MISMATCH
                    ? 'Date mismatch: Transaction dates do not align'
                    : 'No matching transaction found in bank statements',
              ]
            : [],
      },
    });

    const saved = await this.verificationRepository.save(verification);

    // Update revenue tracking status
    revenue.status = status === VerificationStatus.VERIFIED 
      ? 'VERIFIED' as any 
      : 'DISCREPANCY' as any;
    revenue.verificationData = {
      bankStatementAmount: closestTransaction?.amount,
      bankStatementDate: closestTransaction?.transactionDate,
      discrepancy: discrepancyAmount || undefined,
      verifiedAt: new Date(),
    };
    await this.revenueTrackingRepository.save(revenue);

    this.logger.log(
      `Revenue verification completed for ${revenueTrackingId}: Status=${status}, ` +
      `Discrepancy=${discrepancyPercentage.toFixed(2)}%`,
    );

    return saved;
  }

  /**
   * Get verification history for a loan
   */
  async getVerificationHistory(loanId: string): Promise<RevenueVerification[]> {
    return await this.verificationRepository.find({
      where: { loanId },
      relations: ['revenueTracking'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get discrepancies for a loan
   */
  async getDiscrepancies(loanId: string): Promise<RevenueVerification[]> {
    return await this.verificationRepository.find({
      where: {
        loanId,
        status: VerificationStatus.DISCREPANCY,
      },
      relations: ['revenueTracking'],
      order: { createdAt: 'DESC' },
    });
  }
}

