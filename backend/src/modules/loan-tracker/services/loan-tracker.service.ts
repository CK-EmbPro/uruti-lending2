import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanTrackerGateway } from '../gateways/loan-tracker.gateway';
@Injectable()
export class LoanTrackerService {
  private readonly logger = new Logger(LoanTrackerService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    private readonly trackerGateway: LoanTrackerGateway,
  ) {}

  /**
   * Notify loan status change (can be called from other services)
   */
  async notifyLoanStatusChange(loanId: string, status: string, companyId: string): Promise<void> {
    try {
      const loan = await this.loanRepository.findOne({
        where: { id: loanId, companyId },
        relations: ['loanProduct'],
      });

      if (!loan) {
        return;
      }

      const update = {
        status,
        loanNumber: loan.loanNumber,
        loanAmount: loan.loanAmount,
        disbursedAmount: loan.disbursedAmount,
        outstandingBalance: this.calculateOutstandingBalance(loan),
        nextPaymentDate: this.getNextPaymentDate(loan),
        nextPaymentAmount: this.getNextPaymentAmount(loan),
      };

      this.trackerGateway.broadcastLoanUpdate(loanId, update);
      this.logger.log(`Notified loan status change for ${loanId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to notify loan status change: ${error.message}`);
    }
  }

  /**
   * Notify application status change
   */
  async notifyApplicationStatusChange(
    applicationId: string,
    status: string,
    companyId: string,
  ): Promise<void> {
    try {
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId, companyId },
        relations: ['loanProduct'],
      });

      if (!application) {
        return;
      }

      const update = {
        status,
        applicationNumber: application.applicationNumber,
        requestedAmount: application.requestedAmount,
        approvedAmount: application.approvedAmount,
        remarks: application.remarks,
      };

      this.trackerGateway.broadcastApplicationUpdate(applicationId, update);
      this.logger.log(`Notified application status change for ${applicationId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to notify application status change: ${error.message}`);
    }
  }

  /**
   * Get real-time loan status
   */
  async getLoanStatus(loanId: string, companyId: string): Promise<any> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
      relations: ['loanProduct', 'repaymentSchedules'],
    });

    if (!loan) {
      throw new Error('Loan not found or access denied');
    }

    return {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      status: loan.status,
      loanAmount: loan.loanAmount,
      disbursedAmount: loan.disbursedAmount,
      outstandingBalance: this.calculateOutstandingBalance(loan),
      nextPaymentDate: this.getNextPaymentDate(loan),
      nextPaymentAmount: this.getNextPaymentAmount(loan),
      totalPaid: loan.totalAmountPaid,
      lastUpdated: loan.updatedAt,
    };
  }

  /**
   * Get real-time application status
   */
  async getApplicationStatus(applicationId: string, companyId: string): Promise<any> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, companyId },
    });

    if (!application) {
      throw new Error('Application not found or access denied');
    }

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
      requestedAmount: application.requestedAmount,
      approvedAmount: application.approvedAmount,
      remarks: application.remarks,
      applicationDate: application.applicationDate,
      approvalDate: application.approvalDate,
      rejectionDate: application.rejectionDate,
      lastUpdated: application.updatedAt,
    };
  }

  /**
   * Calculate outstanding balance
   */
  private calculateOutstandingBalance(loan: Loan): number {
    if (loan.status === LoanStatus.CLOSED || loan.status === LoanStatus.SETTLED) {
      return 0;
    }

    // Simplified calculation - in production, use actual repayment schedule
    const totalPaid = loan.totalAmountPaid || 0;
    return Math.max(0, loan.disbursedAmount - totalPaid);
  }

  /**
   * Get next payment date
   */
  private getNextPaymentDate(loan: Loan): string | null {
    // This would query repayment schedule in production
    // For now, return null or calculate based on repayment start date
    if (loan.repaymentStartDate) {
      const nextDate = new Date(loan.repaymentStartDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate.toISOString().split('T')[0];
    }
    return null;
  }

  /**
   * Get next payment amount
   */
  private getNextPaymentAmount(loan: Loan): number | null {
    // This would query repayment schedule in production
    // For now, estimate based on loan amount and tenure
    if (loan.repaymentPeriods && loan.repaymentPeriods > 0) {
      const monthlyRate = (loan.rateOfInterest || 0) / 12 / 100;
      const principal = loan.disbursedAmount || loan.loanAmount;
      if (monthlyRate > 0) {
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, loan.repaymentPeriods)) /
          (Math.pow(1 + monthlyRate, loan.repaymentPeriods) - 1);
        return Math.ceil(emi);
      }
      return Math.ceil(principal / loan.repaymentPeriods);
    }
    return null;
  }
}

