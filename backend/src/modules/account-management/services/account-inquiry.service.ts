import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';

/**
 * Service for account information inquiry
 * UC-019: Account Information Inquiry
 */
@Injectable()
export class AccountInquiryService {
  private readonly logger = new Logger(AccountInquiryService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
  ) {}

  /**
   * Get account summary
   */
  async getAccountSummary(loanId: string) {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const loanAmount = loan.loanAmount || 0;
    const totalPrincipalPaid = loan.totalPrincipalPaid || 0;
    const currentBalance = loanAmount - totalPrincipalPaid;

    return {
      loanNumber: loan.loanNumber,
      currentBalance,
      loanAmount,
      totalPrincipalPaid,
      totalInterestPaid: loan.totalInterestPaid || 0,
      totalPenaltyPaid: loan.totalPenaltyPaid || 0,
      interestRate: loan.rateOfInterest,
      nextPaymentDate: loan.repaymentStartDate,
      daysPastDue: loan.daysPastDue || 0,
      status: loan.status,
    };
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(loanId: string, limit: number = 50) {
    const repayments = await this.repaymentRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
      take: limit,
    });

    return repayments.map((repayment) => ({
      id: repayment.id,
      date: repayment.postingDate,
      amount: repayment.amountPaid,
      principal: repayment.principalPaid,
      interest: repayment.interestPaid,
      penalty: repayment.penaltyPaid,
      type: repayment.repaymentType,
      modeOfPayment: repayment.modeOfPayment,
      referenceNumber: repayment.referenceNumber,
    }));
  }

  /**
   * Get upcoming payments
   */
  async getUpcomingPayments(loanId: string, limit: number = 12) {
    const schedule = await this.scheduleRepository.find({
      where: { loanId },
      order: { paymentDate: 'ASC' },
      take: limit,
    });

    return schedule.map((entry) => ({
      id: entry.id,
      dueDate: entry.paymentDate,
      principal: entry.principalAmount,
      interest: entry.interestAmount,
      total: entry.totalPayment,
      status: entry.status,
    }));
  }

  /**
   * Get account details
   */
  async getAccountDetails(loanId: string) {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    return {
      loan,
      summary: await this.getAccountSummary(loanId),
      paymentHistory: await this.getPaymentHistory(loanId),
      upcomingPayments: await this.getUpcomingPayments(loanId),
    };
  }
}

