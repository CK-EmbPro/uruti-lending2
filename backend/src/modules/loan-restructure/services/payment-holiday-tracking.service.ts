import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentHoliday, PaymentHolidayStatus } from '../entities/payment-holiday.entity';
import { Loan } from '../../loan/entities/loan.entity';

const MAX_PAYMENT_HOLIDAYS_PER_LOAN = 2;

@Injectable()
export class PaymentHolidayTrackingService {
  private readonly logger = new Logger(PaymentHolidayTrackingService.name);

  constructor(
    @InjectRepository(PaymentHoliday)
    private readonly paymentHolidayRepository: Repository<PaymentHoliday>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Get payment holiday count for a loan
   */
  async getPaymentHolidayCount(loanId: string): Promise<number> {
    return await this.paymentHolidayRepository.count({
      where: {
        loanId,
        status: PaymentHolidayStatus.ACTIVE,
      },
    });
  }

  /**
   * Get all payment holidays for a loan (including completed)
   */
  async getPaymentHolidays(loanId: string): Promise<PaymentHoliday[]> {
    return await this.paymentHolidayRepository.find({
      where: { loanId },
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Validate if a new payment holiday can be requested
   */
  async validatePaymentHolidayRequest(loanId: string): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new BadRequestException(`Loan ${loanId} not found`);
    }

    // Count existing payment holidays (active and completed)
    const existingHolidays = await this.paymentHolidayRepository.count({
      where: {
        loanId,
        status: PaymentHolidayStatus.ACTIVE,
      },
    });

    if (existingHolidays >= MAX_PAYMENT_HOLIDAYS_PER_LOAN) {
      throw new BadRequestException(
        `Maximum of ${MAX_PAYMENT_HOLIDAYS_PER_LOAN} payment holidays allowed per loan. ` +
        `This loan already has ${existingHolidays} payment holiday(s).`,
      );
    }

    // Check if there's an active holiday that hasn't ended
    const activeHoliday = await this.paymentHolidayRepository.findOne({
      where: {
        loanId,
        status: PaymentHolidayStatus.ACTIVE,
      },
      order: { endDate: 'DESC' },
    });

    if (activeHoliday && new Date(activeHoliday.endDate) > new Date()) {
      throw new BadRequestException(
        `Loan already has an active payment holiday until ${activeHoliday.endDate.toISOString().split('T')[0]}. ` +
        `Cannot request a new holiday until the current one ends.`,
      );
    }
  }

  /**
   * Record a payment holiday
   */
  async recordPaymentHoliday(
    loanId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    durationMonths: number,
    reason?: string,
    modificationId?: string,
  ): Promise<PaymentHoliday> {
    // Validate before recording
    await this.validatePaymentHolidayRequest(loanId);

    const holiday = this.paymentHolidayRepository.create({
      loanId,
      companyId,
      startDate,
      endDate,
      durationMonths,
      reason,
      modificationId,
      status: PaymentHolidayStatus.ACTIVE,
    });

    return await this.paymentHolidayRepository.save(holiday);
  }

  /**
   * Complete a payment holiday
   */
  async completePaymentHoliday(holidayId: string): Promise<PaymentHoliday> {
    const holiday = await this.paymentHolidayRepository.findOne({
      where: { id: holidayId },
    });

    if (!holiday) {
      throw new BadRequestException(`Payment holiday ${holidayId} not found`);
    }

    holiday.status = PaymentHolidayStatus.COMPLETED;
    holiday.completedDate = new Date();

    return await this.paymentHolidayRepository.save(holiday);
  }

  /**
   * Get active payment holiday for a loan
   */
  async getActivePaymentHoliday(loanId: string): Promise<PaymentHoliday | null> {
    return await this.paymentHolidayRepository.findOne({
      where: {
        loanId,
        status: PaymentHolidayStatus.ACTIVE,
      },
      order: { endDate: 'DESC' },
    });
  }
}

