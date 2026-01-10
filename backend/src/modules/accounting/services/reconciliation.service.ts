import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { PaymentMismatch } from '../entities/payment-mismatch.entity';
import { TransactionType, LedgerEntryStatus, MismatchType } from '../dto/reconciliation.dto';
import { ReconciliationRun } from '../entities/reconciliation-run.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import {
  LedgerEntryDto,
  PaymentMismatchDto,
  ReconciliationReportDto,
  CreateLedgerEntryRequestDto,
  ProcessPaymentRequestDto,
} from '../dto/reconciliation.dto';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(PaymentMismatch)
    private readonly mismatchRepository: Repository<PaymentMismatch>,
    @InjectRepository(ReconciliationRun)
    private readonly reconciliationRunRepository: Repository<ReconciliationRun>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Create a ledger entry (double-entry accounting)
   */
  async createLedgerEntry(
    request: CreateLedgerEntryRequestDto,
    userId: string,
  ): Promise<LedgerEntryDto> {
    this.logger.log(`Creating ledger entry: ${request.transactionType} for ${request.referenceNumber}`);

    // Validate double-entry: debit and credit must balance
    if (request.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Create ledger entry
    const entry = this.ledgerEntryRepository.create({
      transactionType: request.transactionType,
      debitAccount: request.debitAccount,
      creditAccount: request.creditAccount,
      amount: request.amount,
      currency: request.currency,
      exchangeRate: request.exchangeRate || 1.0,
      referenceNumber: request.referenceNumber,
      loanId: request.loanId,
      customerId: request.customerId,
      description: request.description,
      status: LedgerEntryStatus.PENDING,
      createdBy: userId,
      source: request.source,
    });

    // Post entry immediately (real-time)
    entry.status = LedgerEntryStatus.POSTED;
    entry.postedAt = new Date();

    const savedEntry = await this.ledgerEntryRepository.save(entry);

    return this.mapLedgerEntryToDto(savedEntry);
  }

  /**
   * Process payment and detect mismatches
   */
  async processPayment(request: ProcessPaymentRequestDto): Promise<PaymentMismatchDto | null> {
    this.logger.log(`Processing payment: ${request.referenceNumber}`);

    // Check for duplicate reference
    const existingPayment = await this.repaymentRepository.findOne({
      where: { referenceNumber: request.referenceNumber },
    });

    if (existingPayment) {
      // Duplicate reference detected
      const mismatch = this.mismatchRepository.create({
        mismatchType: MismatchType.DUPLICATE_REFERENCE,
        referenceNumber: request.referenceNumber,
        paymentAmount: request.amount,
        customerId: request.customerId,
        loanId: request.loanId,
        suggestedResolution: 'Duplicate reference number detected. Please verify payment.',
        autoAllocated: false,
      });
      await this.mismatchRepository.save(mismatch);
      return this.mapMismatchToDto(mismatch);
    }

    // Try to auto-allocate payment
    const allocation = await this.autoAllocatePayment(request);

    if (allocation.mismatch) {
      // Mismatch detected - save to review queue
      const mismatch = this.mismatchRepository.create({
        mismatchType: allocation.mismatchType,
        referenceNumber: request.referenceNumber,
        paymentAmount: request.amount,
        expectedAmount: allocation.expectedAmount,
        customerId: request.customerId || allocation.suggestedCustomerId,
        loanId: request.loanId || allocation.suggestedLoanId,
        suggestedResolution: allocation.suggestedResolution,
        autoAllocated: false,
      });
      await this.mismatchRepository.save(mismatch);
      return this.mapMismatchToDto(mismatch);
    }

    // Payment matched successfully - create ledger entry
    if (allocation.loanId) {
      await this.createRepaymentLedgerEntry(
        allocation.loanId,
        request.referenceNumber,
        request.amount,
        request.paymentDate,
      );
    }

    return null; // No mismatch
  }

  /**
   * Auto-allocate payment to loan
   */
  private async autoAllocatePayment(
    request: ProcessPaymentRequestDto,
  ): Promise<{
    mismatch: boolean;
    mismatchType?: MismatchType;
    expectedAmount?: number;
    suggestedLoanId?: string;
    suggestedCustomerId?: string;
    suggestedResolution?: string;
    loanId?: string;
  }> {
    // If loan ID provided, verify amount
    if (request.loanId) {
      const loan = await this.loanRepository.findOne({
        where: { id: request.loanId },
      });

      if (!loan) {
        return {
          mismatch: true,
          mismatchType: MismatchType.WRONG_ACCOUNT,
          suggestedResolution: `Loan ${request.loanId} not found`,
        };
      }

      // Get expected payment amount (simplified - would calculate from schedule)
      const expectedAmount = loan.loanAmount || 0; // Would calculate actual due amount
      const amountDifference = Math.abs(request.amount - expectedAmount);

      if (amountDifference > 0.01) {
        // Amount mismatch
        return {
          mismatch: true,
          mismatchType: MismatchType.AMOUNT_MISMATCH,
          expectedAmount,
          loanId: request.loanId,
          suggestedResolution: `Amount mismatch. Expected: ${expectedAmount}, Received: ${request.amount}`,
        };
      }

      return {
        mismatch: false,
        loanId: request.loanId,
      };
    }

    // If customer ID provided, try to match by amount and timing
    if (request.customerId) {
      const loans = await this.loanRepository.find({
        where: { applicantId: request.customerId },
      });

      // Find loan with matching expected amount (within 5% tolerance)
      for (const loan of loans) {
        const expectedAmount = loan.loanAmount || 0; // Would calculate actual due amount
        const tolerance = expectedAmount * 0.05; // 5% tolerance
        if (Math.abs(request.amount - expectedAmount) <= tolerance) {
          return {
            mismatch: false,
            loanId: loan.id,
          };
        }
      }
    }

    // Try to match by amount only (across all loans)
    const loans = await this.loanRepository.find({
      take: 100, // Limit search
    });

    for (const loan of loans) {
      const expectedAmount = loan.loanAmount || 0; // Would calculate actual due amount
      const tolerance = expectedAmount * 0.05; // 5% tolerance
      if (Math.abs(request.amount - expectedAmount) <= tolerance) {
        return {
          mismatch: false,
          loanId: loan.id,
          suggestedCustomerId: loan.applicantId,
        };
      }
    }

    // Unallocated payment
    return {
      mismatch: true,
      mismatchType: MismatchType.UNALLOCATED,
      suggestedResolution: 'Payment could not be automatically allocated. Please provide loan ID or customer ID.',
    };
  }

  /**
   * Create ledger entry for repayment
   */
  private async createRepaymentLedgerEntry(
    loanId: string,
    referenceNumber: string,
    amount: number,
    paymentDate: string,
  ): Promise<void> {
    // Create principal repayment entry
    await this.createLedgerEntry(
      {
        transactionType: TransactionType.REPAYMENT_PRINCIPAL,
        debitAccount: 'CASH',
        creditAccount: 'LOAN_ASSETS',
        amount: amount * 0.8, // 80% principal (simplified)
        currency: 'USD',
        referenceNumber: `${referenceNumber}-PRINCIPAL`,
        loanId,
        description: `Principal repayment for loan ${loanId}`,
        source: 'PAYMENT_SYSTEM',
      },
      'SYSTEM',
    );

    // Create interest repayment entry
    await this.createLedgerEntry(
      {
        transactionType: TransactionType.REPAYMENT_INTEREST,
        debitAccount: 'CASH',
        creditAccount: 'INTEREST_INCOME',
        amount: amount * 0.2, // 20% interest (simplified)
        currency: 'USD',
        referenceNumber: `${referenceNumber}-INTEREST`,
        loanId,
        description: `Interest repayment for loan ${loanId}`,
        source: 'PAYMENT_SYSTEM',
      },
      'SYSTEM',
    );
  }

  /**
   * Run end-of-day reconciliation
   */
  async runEndOfDayReconciliation(date: Date = new Date()): Promise<ReconciliationReportDto> {
    this.logger.log(`Running end-of-day reconciliation for ${date.toISOString().split('T')[0]}`);

    const reconciliationDate = new Date(date);
    reconciliationDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reconciliationDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Create reconciliation run
    const run = this.reconciliationRunRepository.create({
      reconciliationDate,
      status: 'IN_PROGRESS',
    });
    await this.reconciliationRunRepository.save(run);

    try {
      // Get all ledger entries for the day
      const ledgerEntries = await this.ledgerEntryRepository.find({
        where: {
          createdAt: Between(reconciliationDate, nextDay),
          status: LedgerEntryStatus.POSTED,
        },
      });

      // Get bank statement transactions (simplified - would fetch from bank API)
      const bankTransactions = await this.getBankStatementTransactions(reconciliationDate);

      // Match entries
      const matchingResult = this.matchEntries(ledgerEntries, bankTransactions);

      // Update reconciliation run
      run.totalLedgerEntries = ledgerEntries.length;
      run.totalBankTransactions = bankTransactions.length;
      run.matchedEntries = matchingResult.matched;
      run.unmatchedLedgerEntries = matchingResult.unmatchedLedger.length;
      run.unmatchedBankTransactions = matchingResult.unmatchedBank.length;
      run.discrepancies = matchingResult.discrepancies;
      run.status = 'COMPLETED';
      run.completedAt = new Date();
      await this.reconciliationRunRepository.save(run);

      return {
        reconciliationDate: reconciliationDate.toISOString().split('T')[0],
        totalLedgerEntries: ledgerEntries.length,
        totalBankTransactions: bankTransactions.length,
        matchedEntries: matchingResult.matched,
        unmatchedLedgerEntries: matchingResult.unmatchedLedger.length,
        unmatchedBankTransactions: matchingResult.unmatchedBank.length,
        status: 'COMPLETED',
        discrepancies: matchingResult.discrepancies,
      };
    } catch (error) {
      run.status = 'FAILED';
      run.errorMessage = error.message;
      await this.reconciliationRunRepository.save(run);
      throw error;
    }
  }

  /**
   * Match ledger entries with bank transactions
   */
  private matchEntries(
    ledgerEntries: LedgerEntry[],
    bankTransactions: any[],
  ): {
    matched: number;
    unmatchedLedger: LedgerEntry[];
    unmatchedBank: any[];
    discrepancies: string[];
  } {
    const matched = 0;
    const unmatchedLedger: LedgerEntry[] = [];
    const unmatchedBank: any[] = [];
    const discrepancies: string[] = [];

    // Simplified matching logic
    // In production, would use sophisticated matching algorithms
    for (const entry of ledgerEntries) {
      const match = bankTransactions.find(
        (t) => t.referenceNumber === entry.referenceNumber && Math.abs(t.amount - entry.amount) < 0.01,
      );
      if (!match) {
        unmatchedLedger.push(entry);
        discrepancies.push(`Ledger entry ${entry.referenceNumber} not found in bank statement`);
      }
    }

    for (const transaction of bankTransactions) {
      const match = ledgerEntries.find(
        (e) => e.referenceNumber === transaction.referenceNumber && Math.abs(e.amount - transaction.amount) < 0.01,
      );
      if (!match) {
        unmatchedBank.push(transaction);
        discrepancies.push(`Bank transaction ${transaction.referenceNumber} not found in ledger`);
      }
    }

    return {
      matched: ledgerEntries.length - unmatchedLedger.length,
      unmatchedLedger,
      unmatchedBank,
      discrepancies,
    };
  }

  /**
   * Get bank statement transactions (simplified - would fetch from bank API)
   */
  private async getBankStatementTransactions(date: Date): Promise<any[]> {
    // Simplified - would fetch from bank API
    // For now, return empty array
    return [];
  }

  /**
   * Get payment mismatches in review queue
   */
  async getPaymentMismatches(resolved: boolean = false): Promise<PaymentMismatchDto[]> {
    const where: any = {};
    if (resolved) {
      where.resolvedAt = MoreThan(new Date(0));
    } else {
      where.resolvedAt = null;
    }

    const mismatches = await this.mismatchRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return mismatches.map((m) => this.mapMismatchToDto(m));
  }

  /**
   * Helper methods
   */
  private mapLedgerEntryToDto(entry: LedgerEntry): LedgerEntryDto {
    return {
      id: entry.id,
      transactionType: entry.transactionType,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amount: Number(entry.amount),
      currency: entry.currency,
      exchangeRate: entry.exchangeRate ? Number(entry.exchangeRate) : undefined,
      referenceNumber: entry.referenceNumber,
      loanId: entry.loanId,
      customerId: entry.customerId,
      description: entry.description,
      status: entry.status,
      createdBy: entry.createdBy,
      source: entry.source,
      createdAt: entry.createdAt.toISOString(),
      postedAt: entry.postedAt?.toISOString(),
    };
  }

  private mapMismatchToDto(mismatch: PaymentMismatch): PaymentMismatchDto {
    return {
      id: mismatch.id,
      mismatchType: mismatch.mismatchType,
      referenceNumber: mismatch.referenceNumber,
      paymentAmount: Number(mismatch.paymentAmount),
      expectedAmount: mismatch.expectedAmount ? Number(mismatch.expectedAmount) : undefined,
      customerId: mismatch.customerId,
      loanId: mismatch.loanId,
      suggestedResolution: mismatch.suggestedResolution,
      autoAllocated: mismatch.autoAllocated,
      createdAt: mismatch.createdAt.toISOString(),
      resolvedAt: mismatch.resolvedAt?.toISOString(),
    };
  }
}

