import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueBasedRepaymentConfig } from '../entities/revenue-based-repayment-config.entity';
import { RevenueTrackingService } from './revenue-tracking.service';
import { RevenuePeriod } from '../entities/revenue-based-repayment-config.entity';

export interface RevenueBasedRepaymentCalculation {
  calculatedAmount: number;
  revenueAmount: number;
  repaymentPercentage: number;
  minimumAmount: number | null;
  maximumAmount: number | null;
  finalAmount: number; // After applying floor/ceiling
  floorApplied: boolean;
  ceilingApplied: boolean;
  period: {
    startDate: Date;
    endDate: Date;
    periodType: RevenuePeriod;
  };
}

@Injectable()
export class RevenueBasedRepaymentCalculatorService {
  private readonly logger = new Logger(RevenueBasedRepaymentCalculatorService.name);

  constructor(
    @InjectRepository(RevenueBasedRepaymentConfig)
    private readonly configRepository: Repository<RevenueBasedRepaymentConfig>,
    private readonly revenueTrackingService: RevenueTrackingService,
  ) {}

  /**
   * Calculate repayment amount based on revenue
   */
  async calculateRepayment(
    loanId: string,
    periodStartDate: Date,
    periodEndDate: Date,
  ): Promise<RevenueBasedRepaymentCalculation> {
    // Get configuration
    const config = await this.configRepository.findOne({
      where: { loanId },
    });

    if (!config) {
      throw new BadRequestException(`Revenue-based repayment config not found for loan ${loanId}`);
    }

    // Get total revenue for the period
    const revenueAmount = await this.revenueTrackingService.getTotalRevenueForPeriod(
      loanId,
      periodStartDate,
      periodEndDate,
    );

    // Calculate repayment as percentage of revenue
    const calculatedAmount = (revenueAmount * config.repaymentPercentage) / 100;

    // Apply floor (minimum)
    let finalAmount = calculatedAmount;
    let floorApplied = false;
    if (config.minimumRepaymentAmount && finalAmount < config.minimumRepaymentAmount) {
      finalAmount = config.minimumRepaymentAmount;
      floorApplied = true;
    }

    // Apply ceiling (maximum)
    let ceilingApplied = false;
    if (config.maximumRepaymentAmount && finalAmount > config.maximumRepaymentAmount) {
      finalAmount = config.maximumRepaymentAmount;
      ceilingApplied = true;
    }

    this.logger.log(
      `Calculated repayment for loan ${loanId}: Revenue=${revenueAmount}, ` +
      `Percentage=${config.repaymentPercentage}%, Calculated=${calculatedAmount}, ` +
      `Final=${finalAmount} (Floor: ${floorApplied}, Ceiling: ${ceilingApplied})`,
    );

    return {
      calculatedAmount,
      revenueAmount,
      repaymentPercentage: config.repaymentPercentage,
      minimumAmount: config.minimumRepaymentAmount,
      maximumAmount: config.maximumRepaymentAmount,
      finalAmount,
      floorApplied,
      ceilingApplied,
      period: {
        startDate: periodStartDate,
        endDate: periodEndDate,
        periodType: config.revenuePeriod,
      },
    };
  }

  /**
   * Get period dates based on revenue period type
   */
  getPeriodDates(
    periodType: RevenuePeriod,
    referenceDate: Date = new Date(),
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(referenceDate);
    let endDate = new Date(referenceDate);

    switch (periodType) {
      case RevenuePeriod.DAILY:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case RevenuePeriod.WEEKLY:
        // Start of week (Monday)
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        // End of week (Sunday)
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case RevenuePeriod.MONTHLY:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        const monthlyEndDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        monthlyEndDate.setHours(23, 59, 59, 999);
        endDate = monthlyEndDate;
        break;
      case RevenuePeriod.QUARTERLY:
        const quarter = Math.floor(startDate.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        const quarterlyEndDate = new Date(startDate.getFullYear(), (quarter + 1) * 3, 0);
        quarterlyEndDate.setHours(23, 59, 59, 999);
        endDate = quarterlyEndDate;
        break;
    }

    return { startDate, endDate };
  }
}

