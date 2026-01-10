/**
 * Email Service Integration Examples
 * 
 * This file demonstrates how to integrate the Email service into existing modules
 */

import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { LoanRepaymentService } from '../loan-repayment/loan-repayment.service';
import { Loan } from '../loan/entities/loan.entity';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly loanRepaymentService: LoanRepaymentService,
  ) {}

  /**
   * Send payment reminder for a loan
   */
  async sendPaymentReminder(loan: Loan): Promise<void> {
    const customerEmail = loan.applicantEmail || 'customer@example.com';
    const dueDate = this.getNextDueDate(loan);
    // Note: calculateAmountDue doesn't exist - this is example code
    // In production, calculate amount due from repayment schedule
    const amountDue = { total: 0 }; // Placeholder

    await this.emailService.sendPaymentReminder(customerEmail, {
      loanId: loan.id,
      customerName: 'Customer', // Customer name not stored in Loan entity
      amountDue: amountDue.total,
      dueDate: dueDate.toISOString().split('T')[0],
      paymentLink: `https://app.urutilending.com/pay/${loan.id}`,
    });
  }

  /**
   * Send loan statement
   */
  async sendLoanStatement(loan: Loan, statementPdf: Buffer): Promise<void> {
    const customerEmail = loan.applicantEmail || 'customer@example.com';
    const period = this.getStatementPeriod();

    await this.emailService.sendLoanStatement(customerEmail, {
      loanId: loan.id,
      customerName: 'Customer', // Customer name not stored in Loan entity
      statementPeriod: period,
      statementPdf,
    });
  }

  /**
   * Send application status update
   */
  async sendApplicationStatus(
    email: string,
    applicationId: string,
    status: string,
    message?: string,
  ): Promise<void> {
    await this.emailService.sendApplicationStatus(email, {
      applicationId,
      customerName: 'Customer', // Get from application
      status,
      message,
    });
  }

  private getNextDueDate(loan: Loan): Date {
    // Calculate next due date logic
    const now = new Date();
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  }

  private getStatementPeriod(): string {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    return `${month} ${year}`;
  }
}

