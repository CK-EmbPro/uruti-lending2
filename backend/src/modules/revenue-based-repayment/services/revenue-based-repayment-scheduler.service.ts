import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueBasedRepaymentConfig } from '../entities/revenue-based-repayment-config.entity';
import { RevenueBasedRepaymentCalculatorService } from './revenue-based-repayment-calculator.service';
import { Inject, forwardRef } from '@nestjs/common';
import { LoanRepaymentService } from '../../loan-repayment/loan-repayment.service';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';

@Injectable()
export class RevenueBasedRepaymentSchedulerService {
  private readonly logger = new Logger(RevenueBasedRepaymentSchedulerService.name);

  constructor(
    @InjectRepository(RevenueBasedRepaymentConfig)
    private readonly configRepository: Repository<RevenueBasedRepaymentConfig>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly calculatorService: RevenueBasedRepaymentCalculatorService,
    @Inject(forwardRef(() => LoanRepaymentService))
    private readonly repaymentService: LoanRepaymentService,
  ) {}

  /**
   * Auto-calculate and create revenue-based repayments
   * Runs daily to check for loans with auto-calculate enabled
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoCalculateRepayments(): Promise<void> {
    this.logger.log('Starting auto-calculation of revenue-based repayments');

    // Find all active loans with revenue-based repayment config and auto-calculate enabled
    const configs = await this.configRepository.find({
      where: {
        autoCalculate: true,
      },
      relations: ['loan'],
    });

    for (const config of configs) {
      if (!config.loanId) {
        continue; // Skip product-level configs
      }

      const loan = await this.loanRepository.findOne({
        where: { id: config.loanId },
      });

      if (!loan || !this.isLoanActive(loan.status)) {
        continue;
      }

      try {
        // Get period dates based on revenue period
        const period = this.calculatorService.getPeriodDates(
          config.revenuePeriod,
          new Date(),
        );

        // Calculate repayment
        const calculation = await this.calculatorService.calculateRepayment(
          loan.id,
          period.startDate,
          period.endDate,
        );

        // Only create repayment if amount > 0
        if (calculation.finalAmount > 0) {
          // Create repayment
          await this.repaymentService.create(
            {
              loanId: loan.id,
              repaymentType: RepaymentType.NORMAL_REPAYMENT,
              amountPaid: calculation.finalAmount,
              postingDate: new Date().toISOString().split('T')[0],
              modeOfPayment: 'Revenue-Based Auto',
              referenceNumber: `REV-${Date.now()}`,
            },
            loan.companyId,
          );

          this.logger.log(
            `Auto-created revenue-based repayment for loan ${loan.id}: ${calculation.finalAmount}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to auto-calculate repayment for loan ${config.loanId}: ${error.message}`,
          error.stack,
        );
      }
    }

    this.logger.log('Completed auto-calculation of revenue-based repayments');
  }

  private isLoanActive(status: LoanStatus): boolean {
    return [
      LoanStatus.DISBURSED,
      LoanStatus.ACTIVE,
      LoanStatus.PARTIALLY_DISBURSED,
    ].includes(status);
  }
}

