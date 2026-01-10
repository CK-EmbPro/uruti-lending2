import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentReminder, ReminderStatus, ReminderChannel } from '../entities/payment-reminder.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CreatePaymentReminderDto, UpdatePaymentReminderDto } from '../dto/payment-reminder.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service for payment reminders
 * UC-014: Regular Payment Processing - Payment Reminders
 */
@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    @InjectRepository(PaymentReminder)
    private readonly reminderRepository: Repository<PaymentReminder>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Create payment reminder
   */
  async createReminder(createDto: CreatePaymentReminderDto): Promise<PaymentReminder> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const reminder = this.reminderRepository.create({
      ...createDto,
      dueDate: new Date(createDto.dueDate),
      channel: createDto.channel || ReminderChannel.EMAIL,
    });

    const savedReminder = await this.reminderRepository.save(reminder);
    this.logger.log(`Payment reminder created: ${savedReminder.id} for loan ${loan.loanNumber}`);

    return savedReminder;
  }

  /**
   * Send payment reminder
   */
  async sendReminder(reminderId: string): Promise<PaymentReminder> {
    const reminder = await this.reminderRepository.findOne({ where: { id: reminderId } });
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${reminderId} not found`);
    }

    if (reminder.status !== ReminderStatus.PENDING) {
      throw new BadRequestException(`Reminder is not in PENDING status`);
    }

    // In production, this would:
    // 1. Send email/SMS/Push notification
    // 2. Update reminder status
    // 3. Log the notification

    reminder.status = ReminderStatus.SENT;
    reminder.sentAt = new Date();

    const savedReminder = await this.reminderRepository.save(reminder);
    this.logger.log(`Payment reminder sent: ${reminderId}`);

    // await this.notificationService.sendPaymentReminder(reminder);

    return savedReminder;
  }

  /**
   * Acknowledge reminder
   */
  async acknowledgeReminder(reminderId: string): Promise<PaymentReminder> {
    const reminder = await this.reminderRepository.findOne({ where: { id: reminderId } });
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${reminderId} not found`);
    }

    reminder.status = ReminderStatus.ACKNOWLEDGED;
    reminder.acknowledgedAt = new Date();

    return await this.reminderRepository.save(reminder);
  }

  /**
   * Get reminders for loan
   */
  async getRemindersForLoan(loanId: string): Promise<PaymentReminder[]> {
    return await this.reminderRepository.find({
      where: { loanId },
      order: { dueDate: 'DESC' },
    });
  }

  /**
   * Scheduled job: Send payment reminders
   * Runs daily to check for upcoming payments
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processScheduledReminders(): Promise<void> {
    this.logger.log('Processing scheduled payment reminders...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find pending reminders that should be sent today
    const remindersToSend = await this.reminderRepository
      .createQueryBuilder('reminder')
      .where('reminder.status = :status', { status: ReminderStatus.PENDING })
      .andWhere('reminder.dueDate >= :today', { today })
      .andWhere('DATE(reminder.dueDate) - reminder.daysBeforeDue = DATE(:today)', { today })
      .getMany();

    for (const reminder of remindersToSend) {
      try {
        await this.sendReminder(reminder.id);
      } catch (error) {
        this.logger.error(`Failed to send reminder ${reminder.id}: ${error.message}`);
        reminder.status = ReminderStatus.FAILED;
        reminder.failureReason = error.message;
        await this.reminderRepository.save(reminder);
      }
    }

    this.logger.log(`Processed ${remindersToSend.length} payment reminders`);
  }
}

