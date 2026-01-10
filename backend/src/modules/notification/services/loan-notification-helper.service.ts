import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';

/**
 * Helper service to send loan-related notifications
 * Provides convenient methods for common loan notification scenarios
 */
@Injectable()
export class LoanNotificationHelperService {
  private readonly logger = new Logger(LoanNotificationHelperService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send notification when loan application is submitted
   */
  async notifyApplicationSubmitted(
    application: LoanApplication,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.APPLICATION_SUBMITTED,
        channel: NotificationChannel.IN_APP,
        subject: `Application ${application.applicationNumber} Submitted`,
        body: `Your loan application ${application.applicationNumber} has been submitted successfully and is under review.`,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          requestedAmount: application.requestedAmount,
          recipientEmail,
          recipientPhone,
        },
      });

      // Also send email
      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.APPLICATION_SUBMITTED,
          channel: NotificationChannel.EMAIL,
          subject: `Application ${application.applicationNumber} Submitted`,
          body: `Your loan application ${application.applicationNumber} has been submitted successfully and is under review.`,
          metadata: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send application submitted notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan application is approved
   */
  async notifyApplicationApproved(
    application: LoanApplication,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.APPLICATION_APPROVED,
        channel: NotificationChannel.IN_APP,
        subject: `Application ${application.applicationNumber} Approved`,
        body: `Congratulations! Your loan application ${application.applicationNumber} has been approved for $${application.approvedAmount || application.requestedAmount}.`,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          approvedAmount: application.approvedAmount || application.requestedAmount,
          recipientEmail,
          recipientPhone,
        },
      });

      // Also send email and SMS
      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.APPLICATION_APPROVED,
          channel: NotificationChannel.EMAIL,
          subject: `Application ${application.applicationNumber} Approved`,
          body: `Congratulations! Your loan application ${application.applicationNumber} has been approved for $${application.approvedAmount || application.requestedAmount}.`,
          metadata: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            recipientEmail,
          },
        });
      }

      if (recipientPhone) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.APPLICATION_APPROVED,
          channel: NotificationChannel.SMS,
          subject: `Application Approved`,
          body: `Your loan application ${application.applicationNumber} has been approved for $${application.approvedAmount || application.requestedAmount}.`,
          metadata: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            recipientPhone,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send application approved notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan application is rejected
   */
  async notifyApplicationRejected(
    application: LoanApplication,
    recipientId: string,
    reason?: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.APPLICATION_REJECTED,
        channel: NotificationChannel.IN_APP,
        subject: `Application ${application.applicationNumber} Status Update`,
        body: `Your loan application ${application.applicationNumber} has been reviewed. ${reason ? `Reason: ${reason}` : 'Please contact us for more information.'}`,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          reason,
        },
      });

      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.APPLICATION_REJECTED,
          channel: NotificationChannel.EMAIL,
          subject: `Application ${application.applicationNumber} Status Update`,
          body: `Your loan application ${application.applicationNumber} has been reviewed. ${reason ? `Reason: ${reason}` : 'Please contact us for more information.'}`,
          metadata: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send application rejected notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan is disbursed
   */
  async notifyLoanDisbursed(
    loan: Loan,
    disbursement: LoanDisbursement,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.LOAN_DISBURSED,
        channel: NotificationChannel.IN_APP,
        subject: `Loan ${loan.loanNumber} Disbursed`,
        body: `Your loan ${loan.loanNumber} has been disbursed. Amount: $${disbursement.disbursedAmount}. Disbursement Date: ${new Date(disbursement.disbursementDate).toLocaleDateString()}.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          disbursementId: disbursement.id,
          disbursedAmount: disbursement.disbursedAmount,
        },
      });

      // Also send email and SMS
      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.LOAN_DISBURSED,
          channel: NotificationChannel.EMAIL,
          subject: `Loan ${loan.loanNumber} Disbursed`,
          body: `Your loan ${loan.loanNumber} has been disbursed. Amount: $${disbursement.disbursedAmount}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }

      if (recipientPhone) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.LOAN_DISBURSED,
          channel: NotificationChannel.SMS,
          subject: `Loan Disbursed`,
          body: `Your loan ${loan.loanNumber} has been disbursed. Amount: $${disbursement.disbursedAmount}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientPhone,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send loan disbursed notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan status changes to active
   */
  async notifyLoanActive(
    loan: Loan,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.LOAN_ACTIVE,
        channel: NotificationChannel.IN_APP,
        subject: `Loan ${loan.loanNumber} is Now Active`,
        body: `Your loan ${loan.loanNumber} is now active. Loan Amount: $${loan.loanAmount}.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          loanAmount: loan.loanAmount,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send loan active notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan is closed
   */
  async notifyLoanClosed(
    loan: Loan,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.LOAN_CLOSED,
        channel: NotificationChannel.IN_APP,
        subject: `Loan ${loan.loanNumber} Closed`,
        body: `Your loan ${loan.loanNumber} has been closed successfully.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          closureDate: loan.closureDate,
        },
      });

      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.LOAN_CLOSED,
          channel: NotificationChannel.EMAIL,
          subject: `Loan ${loan.loanNumber} Closed`,
          body: `Your loan ${loan.loanNumber} has been closed successfully.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send loan closed notification: ${error.message}`);
    }
  }

  /**
   * Send notification when loan becomes overdue
   */
  async notifyLoanOverdue(
    loan: Loan,
    daysPastDue: number,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.LOAN_OVERDUE,
        channel: NotificationChannel.IN_APP,
        subject: `Loan ${loan.loanNumber} Overdue`,
        body: `Your loan ${loan.loanNumber} is ${daysPastDue} days past due. Please make a payment to avoid additional charges.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          daysPastDue,
        },
      });

      // Also send email and SMS for overdue
      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.LOAN_OVERDUE,
          channel: NotificationChannel.EMAIL,
          subject: `Loan ${loan.loanNumber} Overdue`,
          body: `Your loan ${loan.loanNumber} is ${daysPastDue} days past due. Please make a payment to avoid additional charges.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }

      if (recipientPhone) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.LOAN_OVERDUE,
          channel: NotificationChannel.SMS,
          subject: `Loan Overdue`,
          body: `Loan ${loan.loanNumber} is ${daysPastDue} days overdue. Please make a payment.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientPhone,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send loan overdue notification: ${error.message}`);
    }
  }

  /**
   * Send payment due reminder
   */
  async notifyPaymentDue(
    loan: Loan,
    dueDate: Date,
    dueAmount: number,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.PAYMENT_DUE,
        channel: NotificationChannel.IN_APP,
        subject: `Payment Due for Loan ${loan.loanNumber}`,
        body: `Your payment of $${dueAmount} for loan ${loan.loanNumber} is due on ${dueDate.toLocaleDateString()}.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          dueDate,
          dueAmount,
        },
      });

      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.PAYMENT_DUE,
          channel: NotificationChannel.EMAIL,
          subject: `Payment Due for Loan ${loan.loanNumber}`,
          body: `Your payment of $${dueAmount} for loan ${loan.loanNumber} is due on ${dueDate.toLocaleDateString()}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send payment due notification: ${error.message}`);
    }
  }

  /**
   * Send payment reminder (before due date)
   */
  async notifyPaymentReminder(
    loan: Loan,
    dueDate: Date,
    dueAmount: number,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.PAYMENT_REMINDER,
        channel: NotificationChannel.IN_APP,
        subject: `Payment Reminder - Loan ${loan.loanNumber}`,
        body: `Reminder: Your payment of $${dueAmount} for loan ${loan.loanNumber} is due on ${dueDate.toLocaleDateString()}.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          dueDate,
          dueAmount,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send payment reminder notification: ${error.message}`);
    }
  }

  /**
   * Send notification when payment is received
   */
  async notifyPaymentReceived(
    loan: Loan,
    repayment: LoanRepayment,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.IN_APP,
        subject: `Payment Received for Loan ${loan.loanNumber}`,
        body: `Thank you! We have received your payment of $${repayment.amountPaid} for loan ${loan.loanNumber}.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          repaymentId: repayment.id,
          amountPaid: repayment.amountPaid,
        },
      });

      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.EMAIL,
          subject: `Payment Received for Loan ${loan.loanNumber}`,
          body: `Thank you! We have received your payment of $${repayment.amountPaid} for loan ${loan.loanNumber}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send payment received notification: ${error.message}`);
    }
  }

  /**
   * Send notification when payment fails
   */
  async notifyPaymentFailed(
    loan: Loan,
    amount: number,
    reason: string,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        recipientId,
        notificationType: NotificationType.PAYMENT_FAILED,
        channel: NotificationChannel.IN_APP,
        subject: `Payment Failed for Loan ${loan.loanNumber}`,
        body: `Your payment of $${amount} for loan ${loan.loanNumber} has failed. Reason: ${reason}. Please try again or contact support.`,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          amount,
          reason,
        },
      });

      if (recipientEmail) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType: NotificationType.PAYMENT_FAILED,
          channel: NotificationChannel.EMAIL,
          subject: `Payment Failed for Loan ${loan.loanNumber}`,
          body: `Your payment of $${amount} for loan ${loan.loanNumber} has failed. Reason: ${reason}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send payment failed notification: ${error.message}`);
    }
  }

  /**
   * Send collection notice (replaces old collection notice system)
   */
  async notifyCollectionNotice(
    loan: Loan,
    noticeType: 'Delinquency Notice' | 'Collection Notice' | 'Final Notice',
    daysPastDue: number,
    outstandingBalance: number,
    recipientId: string,
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<void> {
    try {
      const notificationType =
        noticeType === 'Delinquency Notice'
          ? NotificationType.DELINQUENCY_NOTICE
          : noticeType === 'Collection Notice'
            ? NotificationType.COLLECTION_NOTICE
            : NotificationType.FINAL_NOTICE;

      // Determine channel based on notice type
      let channel: NotificationChannel = NotificationChannel.EMAIL;
      if (noticeType === 'Final Notice') {
        channel = NotificationChannel.LETTER; // Final notices are typically sent as letters
      } else if (daysPastDue > 60) {
        channel = NotificationChannel.SMS; // Use SMS for serious delinquencies
      }

      const subject = `${noticeType} - Loan ${loan.loanNumber}`;
      const body = `Your loan ${loan.loanNumber} is ${daysPastDue} days past due. Outstanding balance: $${outstandingBalance}. ${noticeType === 'Final Notice' ? 'This is a final notice. Please contact us immediately.' : 'Please make a payment to avoid further action.'}`;

      await this.notificationService.sendNotification({
        recipientId,
        notificationType,
        channel,
        subject,
        body,
        metadata: {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          daysPastDue,
          outstandingBalance,
          noticeType,
        },
      });

      // Also send via other channels for collection notices
      if (recipientEmail && channel !== NotificationChannel.EMAIL) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType,
          channel: NotificationChannel.EMAIL,
          subject,
          body,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientEmail,
          },
        });
      }

      if (recipientPhone && channel !== NotificationChannel.SMS) {
        await this.notificationService.sendNotification({
          recipientId,
          notificationType,
          channel: NotificationChannel.SMS,
          subject: `${noticeType} - Loan ${loan.loanNumber}`,
          body: `Loan ${loan.loanNumber} is ${daysPastDue} days overdue. Balance: $${outstandingBalance}.`,
          metadata: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            recipientPhone,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send collection notice notification: ${error.message}`);
    }
  }
}

