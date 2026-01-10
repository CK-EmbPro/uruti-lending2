import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoffQuote, QuoteStatus } from '../entities/payoff-quote.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { CreatePayoffQuoteDto, ProcessPayoffDto } from '../dto/payoff-quote.dto';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';
import { EarlySettlementRebateService } from './early-settlement-rebate.service';

/**
 * Service for payoff quote requests
 * UC-023: Payoff Quote Request
 */
@Injectable()
export class PayoffQuoteService {
  private readonly logger = new Logger(PayoffQuoteService.name);

  constructor(
    @InjectRepository(PayoffQuote)
    private readonly quoteRepository: Repository<PayoffQuote>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    private readonly rebateService: EarlySettlementRebateService,
  ) {}

  /**
   * Generate payoff quote
   */
  async generateQuote(createDto: CreatePayoffQuoteDto): Promise<PayoffQuote> {
    const loan = await this.loanRepository.findOne({
      where: { id: createDto.loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const payoffDate = createDto.payoffDate ? new Date(createDto.payoffDate) : new Date();
    const validUntil = createDto.validUntil
      ? new Date(createDto.validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Calculate principal balance
    const principalBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);

    // Calculate accrued interest (from last payment to payoff date)
    const accruedInterest = this.calculateAccruedInterest(loan, payoffDate);

    // Calculate interest rebate for early settlement
    const rebateResult = this.rebateService.calculateRebate(loan, payoffDate, accruedInterest);

    // Calculate prepayment penalty (if applicable)
    const prepaymentPenalty = this.calculatePrepaymentPenalty(loan, principalBalance);

    // Calculate other fees
    const otherFees = 0; // Would include any other applicable fees

    // Calculate per-diem interest
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const perDiemInterest = principalBalance * dailyRate;

    // Total payoff amount (after rebate)
    const totalPayoffAmount = principalBalance + accruedInterest - rebateResult.rebateAmount + prepaymentPenalty + otherFees;

    const quote = this.quoteRepository.create({
      loanId: createDto.loanId,
      principalBalance,
      accruedInterest,
      prepaymentPenalty,
      otherFees,
      totalPayoffAmount,
      perDiemInterest,
      quoteDate: new Date(),
      validUntil,
      status: QuoteStatus.ACTIVE,
      notes: `Interest rebate: ${rebateResult.rebateAmount.toFixed(2)} (${rebateResult.rebatePercentage}%) - ${rebateResult.monthsRemaining} months remaining`,
    });

    const savedQuote = await this.quoteRepository.save(quote);

    this.logger.log(`Payoff quote generated: ${savedQuote.id} for loan ${loan.loanNumber}`);

    return savedQuote;
  }

  /**
   * Process payoff
   */
  async processPayoff(payoffDto: ProcessPayoffDto, userId: string): Promise<{ quote: PayoffQuote; repayment: LoanRepayment }> {
    const quote = await this.quoteRepository.findOne({
      where: { id: payoffDto.quoteId },
      relations: ['loan'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${payoffDto.quoteId} not found`);
    }

    if (quote.status !== QuoteStatus.ACTIVE) {
      throw new BadRequestException(`Quote is not active. Current status: ${quote.status}`);
    }

    if (new Date() > quote.validUntil) {
      quote.status = QuoteStatus.EXPIRED;
      await this.quoteRepository.save(quote);
      throw new BadRequestException('Quote has expired. Please request a new quote.');
    }

    // Validate payment amount
    const tolerance = 0.01; // Allow small rounding differences
    if (Math.abs(payoffDto.paymentAmount - quote.totalPayoffAmount) > tolerance) {
      throw new BadRequestException(
        `Payment amount (${payoffDto.paymentAmount}) does not match quote amount (${quote.totalPayoffAmount})`,
      );
    }

    const loan = quote.loan;
    const paymentDate = payoffDto.paymentDate ? new Date(payoffDto.paymentDate) : new Date();

    // Create repayment record
    const repayment = this.repaymentRepository.create({
      loanId: loan.id,
      postingDate: paymentDate,
      amountPaid: payoffDto.paymentAmount,
      principalPaid: quote.principalBalance,
      interestPaid: quote.accruedInterest,
      penaltyPaid: quote.prepaymentPenalty + quote.otherFees,
      repaymentType: RepaymentType.LOAN_CLOSURE,
      modeOfPayment: payoffDto.modeOfPayment || 'Payoff',
      referenceNumber: `PAYOFF-${quote.id}`,
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan balances
    loan.totalPrincipalPaid = (loan.totalPrincipalPaid || 0) + quote.principalBalance;
    loan.totalInterestPaid = (loan.totalInterestPaid || 0) + quote.accruedInterest;
    loan.totalPenaltyPaid = (loan.totalPenaltyPaid || 0) + quote.prepaymentPenalty + quote.otherFees;
    loan.totalAmountPaid = (loan.totalAmountPaid || 0) + payoffDto.paymentAmount;
    loan.status = LoanStatus.CLOSED;
    loan.closureDate = paymentDate;
    await this.loanRepository.save(loan);

    // Update quote status
    quote.status = QuoteStatus.PAID;
    quote.paidDate = paymentDate;
    quote.paidBy = userId;
    await this.quoteRepository.save(quote);

    this.logger.log(`Payoff processed: ${quote.id} for loan ${loan.loanNumber}`);

    return { quote, repayment: savedRepayment };
  }

  /**
   * Get quotes for loan
   */
  async getQuotesForLoan(loanId: string): Promise<PayoffQuote[]> {
    return await this.quoteRepository.find({
      where: { loanId },
      order: { quoteDate: 'DESC' },
    });
  }

  /**
   * Get active quote for loan
   */
  async getActiveQuote(loanId: string): Promise<PayoffQuote | null> {
    return await this.quoteRepository.findOne({
      where: { loanId, status: QuoteStatus.ACTIVE },
      order: { quoteDate: 'DESC' },
    });
  }

  /**
   * Calculate accrued interest
   */
  private calculateAccruedInterest(loan: Loan, payoffDate: Date): number {
    // Simplified calculation - would use actual interest accrual service
    const lastPaymentDate = loan.disbursementDate || loan.postingDate;
    const days = Math.floor((payoffDate.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const outstandingBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    return outstandingBalance * dailyRate * days;
  }

  /**
   * Calculate prepayment penalty
   */
  private calculatePrepaymentPenalty(loan: Loan, principalBalance: number): number {
    // Simplified calculation - would check loan product for penalty rules
    // Typically 1-3% of principal balance
    return 0; // Placeholder - would implement based on loan product rules
  }
}

