import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { PaymentReminder } from '../entities/payment-reminder.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { PaymentReminderIntegrationService } from './payment-reminder-integration.service';
import { ReminderType, ReminderChannel, SendPaymentReminderDto } from '../dto/payment-reminder.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    @InjectRepository(PaymentReminder)
    private readonly reminderRepository: Repository<PaymentReminder>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly notificationService: NotificationService,
    private readonly paymentReminderIntegrationService: PaymentReminderIntegrationService,
  ) {}

  /**
   * Schedule payment reminders for upcoming repayments
   */
  async scheduleRemindersForLoan(loanId: string, companyId: string): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
      relations: ['repaymentSchedules'],
    });

    if (!loan || loan.status !== LoanStatus.ACTIVE) {
      this.logger.warn(`Loan ${loanId} not found or not active`);
      return;
    }

    // Get upcoming repayments (next 30 days)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const upcomingSchedules = await this.scheduleRepository.find({
      where: {
        loanId,
        paymentDate: Between(today, futureDate),
        status: ScheduleEntryStatus.PENDING,
      },
      order: { paymentDate: 'ASC' },
    });

    for (const schedule of upcomingSchedules) {
      // Schedule reminder 3 days before due date
      const reminderDate = new Date(schedule.paymentDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate >= today) {
        await this.createReminder({
          loanId,
          repaymentScheduleId: schedule.id,
          reminderType: ReminderType.UPCOMING,
          scheduledDate: reminderDate,
          channels: [ReminderChannel.EMAIL, ReminderChannel.SMS],
        });
      }

      // Schedule reminder on due date
      await this.createReminder({
        loanId,
        repaymentScheduleId: schedule.id,
        reminderType: ReminderType.DUE_TODAY,
        scheduledDate: new Date(schedule.paymentDate),
        channels: [ReminderChannel.EMAIL, ReminderChannel.SMS, ReminderChannel.PUSH],
      });
    }

    this.logger.log(`Scheduled reminders for loan ${loanId}`);
  }

  /**
   * Create a payment reminder
   */
  async createReminder(data: {
    loanId: string;
    repaymentScheduleId?: string;
    reminderType: ReminderType;
    scheduledDate: Date;
    channels: ReminderChannel[];
    message?: string;
  }): Promise<PaymentReminder> {
    // Check if reminder already exists
    const existing = await this.reminderRepository.findOne({
      where: {
        loanId: data.loanId,
        repaymentScheduleId: data.repaymentScheduleId,
        reminderType: data.reminderType,
        scheduledDate: data.scheduledDate,
      },
    });

    if (existing) {
      return existing;
    }

    const reminder = this.reminderRepository.create({
      loanId: data.loanId,
      repaymentScheduleId: data.repaymentScheduleId,
      reminderType: data.reminderType,
      scheduledDate: data.scheduledDate,
      channels: data.channels,
      message: data.message,
      status: 'PENDING',
    });

    return await this.reminderRepository.save(reminder);
  }

  /**
   * Send a payment reminder immediately
   */
  async sendReminder(dto: SendPaymentReminderDto, companyId: string): Promise<PaymentReminder> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: dto.repaymentScheduleId },
      relations: ['loan'],
    });

    if (!schedule) {
      throw new Error(`Repayment schedule ${dto.repaymentScheduleId} not found`);
    }

    if (schedule.loan.companyId !== companyId) {
      throw new Error('Access denied');
    }

    const loan = schedule.loan;

    // Determine reminder type based on due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(schedule.paymentDate);
    dueDate.setHours(0, 0, 0, 0);

    let reminderType: ReminderType;
    if (dueDate < today) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      reminderType = daysOverdue > 30 ? ReminderType.FINAL_NOTICE : ReminderType.OVERDUE;
    } else if (dueDate.getTime() === today.getTime()) {
      reminderType = ReminderType.DUE_TODAY;
    } else {
      reminderType = ReminderType.UPCOMING;
    }

    // Create reminder record
    const reminder = await this.createReminder({
      loanId: loan.id,
      repaymentScheduleId: schedule.id,
      reminderType,
      scheduledDate: new Date(),
      channels: dto.channels,
      message: dto.customMessage,
    });

    // Send notifications
    await this.sendNotifications(reminder, schedule, loan);

    // Send payment reminder with PDF and QR code (integration service)
    try {
      const amountDue = schedule.principalAmount + schedule.interestAmount;
      await this.paymentReminderIntegrationService.sendPaymentReminderWithPDF(
        reminder.id,
        loan.id,
        amountDue,
        schedule.paymentDate,
        reminder.reminderType,
      );
    } catch (error) {
      // Log error but don't fail the reminder
      this.logger.error(`Failed to send payment reminder with PDF: ${error.message}`);
    }

    // Update reminder status
    reminder.status = 'SENT';
    reminder.sentDate = new Date();
    await this.reminderRepository.save(reminder);

    return reminder;
  }

  /**
   * Send notifications for a reminder
   */
  private async sendNotifications(
    reminder: PaymentReminder,
    schedule: LoanRepaymentSchedule,
    loan: Loan,
  ): Promise<void> {
    const message = this.buildReminderMessage(reminder, schedule, loan);

    const metadata: Record<string, any> = {};

    for (const channel of reminder.channels) {
      try {
        switch (channel) {
          case ReminderChannel.EMAIL:
            // Send email notification
            await this.notificationService.sendNotification({
              recipientId: loan.applicantId,
              notificationType: 'PAYMENT_REMINDER' as any,
              channel: 'EMAIL' as any,
              subject: this.getEmailSubject(reminder.reminderType),
              body: message,
              metadata: {
                recipientEmail: '', // TODO: Get from applicant relationship
                loanNumber: loan.loanNumber,
                dueDate: schedule.paymentDate,
                amount: schedule.principalAmount + schedule.interestAmount,
                reminderType: reminder.reminderType,
              },
            });
            metadata.emailSent = true;
            break;

          case ReminderChannel.SMS:
            // Send SMS notification
            await this.notificationService.sendNotification({
              recipientId: loan.applicantId,
              notificationType: 'PAYMENT_REMINDER' as any,
              channel: 'SMS' as any,
              subject: this.getPushTitle(reminder.reminderType),
              body: this.buildSMSMessage(reminder, schedule, loan),
              metadata: {
                recipientPhone: '', // Phone should be retrieved from customer/company entity
                loanNumber: loan.loanNumber,
              },
            });
            metadata.smsSent = true;
            break;

          case ReminderChannel.PUSH:
            // Send push notification
            await this.notificationService.sendNotification({
              recipientId: loan.applicantId,
              notificationType: 'PAYMENT_REMINDER' as any,
              channel: 'PUSH' as any,
              subject: this.getPushTitle(reminder.reminderType),
              body: message,
              metadata: {
                loanId: loan.id,
                scheduleId: schedule.id,
                type: 'payment-reminder',
              },
            });
            metadata.pushSent = true;
            break;

          case ReminderChannel.IN_APP:
            // Create in-app notification
            await this.notificationService.sendNotification({
              recipientId: loan.applicantId,
              notificationType: 'PAYMENT_REMINDER' as any,
              channel: 'IN_APP' as any,
              subject: this.getPushTitle(reminder.reminderType),
              body: message,
              metadata: {
                loanId: loan.id,
                scheduleId: schedule.id,
                entityType: 'Loan',
                entityId: loan.id,
              },
            });
            metadata.inAppSent = true;
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} reminder: ${error.message}`);
        metadata[`${channel}Error`] = error.message;
      }
    }

    reminder.metadata = metadata;
    await this.reminderRepository.save(reminder);
  }

  /**
   * Build reminder message
   */
  private buildReminderMessage(
    reminder: PaymentReminder,
    schedule: LoanRepaymentSchedule,
    loan: Loan,
  ): string {
    const amount = schedule.principalAmount + schedule.interestAmount;
    const dueDate = new Date(schedule.paymentDate).toLocaleDateString();

    if (reminder.message) {
      return reminder.message;
    }

    switch (reminder.reminderType) {
      case ReminderType.UPCOMING:
        return `Reminder: Your loan payment of ${amount} is due on ${dueDate}. Please ensure sufficient funds.`;
      case ReminderType.DUE_TODAY:
        return `Your loan payment of ${amount} is due today. Please make the payment to avoid late fees.`;
      case ReminderType.OVERDUE:
        return `URGENT: Your loan payment of ${amount} is overdue. Please make the payment immediately to avoid penalties.`;
      case ReminderType.FINAL_NOTICE:
        return `FINAL NOTICE: Your loan payment of ${amount} is significantly overdue. Please contact us immediately.`;
      default:
        return `Your loan payment of ${amount} is due on ${dueDate}.`;
    }
  }

  /**
   * Build SMS message (shorter)
   */
  private buildSMSMessage(
    reminder: PaymentReminder,
    schedule: LoanRepaymentSchedule,
    loan: Loan,
  ): string {
    const amount = schedule.principalAmount + schedule.interestAmount;
    const dueDate = new Date(schedule.paymentDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    switch (reminder.reminderType) {
      case ReminderType.DUE_TODAY:
        return `Payment due today: ${amount}. Loan: ${loan.loanNumber}. Pay now to avoid fees.`;
      case ReminderType.OVERDUE:
        return `URGENT: Payment overdue ${amount}. Loan: ${loan.loanNumber}. Pay immediately.`;
      default:
        return `Payment reminder: ${amount} due ${dueDate}. Loan: ${loan.loanNumber}`;
    }
  }

  /**
   * Get email subject
   */
  private getEmailSubject(reminderType: ReminderType): string {
    switch (reminderType) {
      case ReminderType.UPCOMING:
        return 'Upcoming Payment Reminder';
      case ReminderType.DUE_TODAY:
        return 'Payment Due Today - Action Required';
      case ReminderType.OVERDUE:
        return 'URGENT: Payment Overdue';
      case ReminderType.FINAL_NOTICE:
        return 'FINAL NOTICE: Payment Overdue';
      default:
        return 'Payment Reminder';
    }
  }

  /**
   * Get push notification title
   */
  private getPushTitle(reminderType: ReminderType): string {
    switch (reminderType) {
      case ReminderType.DUE_TODAY:
        return 'Payment Due Today';
      case ReminderType.OVERDUE:
        return 'Payment Overdue';
      case ReminderType.FINAL_NOTICE:
        return 'Final Notice';
      default:
        return 'Payment Reminder';
    }
  }

  /**
   * Process pending reminders (cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processPendingReminders(): Promise<void> {
    this.logger.log('Processing pending payment reminders...');

    const now = new Date();
    const reminders = await this.reminderRepository.find({
      where: {
        status: 'PENDING',
        scheduledDate: LessThanOrEqual(now),
      },
      relations: ['repaymentSchedule', 'loan'],
    });

    for (const reminder of reminders) {
      try {
        if (reminder.repaymentSchedule && reminder.loan) {
          await this.sendNotifications(
            reminder,
            reminder.repaymentSchedule,
            reminder.loan,
          );

          reminder.status = 'SENT';
          reminder.sentDate = new Date();
          await this.reminderRepository.save(reminder);
        }
      } catch (error) {
        this.logger.error(`Failed to process reminder ${reminder.id}: ${error.message}`);
        reminder.status = 'FAILED';
        reminder.errorMessage = error.message;
        await this.reminderRepository.save(reminder);
      }
    }

    this.logger.log(`Processed ${reminders.length} payment reminders`);
  }

  /**
   * Get reminders for a loan
   */
  async getRemindersForLoan(loanId: string, companyId: string): Promise<PaymentReminder[]> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
    });

    if (!loan) {
      throw new Error('Loan not found or access denied');
    }

    return await this.reminderRepository.find({
      where: { loanId },
      order: { scheduledDate: 'DESC' },
      relations: ['repaymentSchedule'],
    });
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string, companyId: string): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { id: reminderId },
      relations: ['loan'],
    });

    if (!reminder || reminder.loan.companyId !== companyId) {
      throw new Error('Reminder not found or access denied');
    }

    if (reminder.status === 'PENDING') {
      reminder.status = 'CANCELLED';
      await this.reminderRepository.save(reminder);
    }
  }
}

