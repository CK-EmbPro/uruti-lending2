import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { PredictiveDefaultMonitoringService } from '../services/predictive-default-monitoring.service';

@Injectable()
export class DailyRiskScoreScheduler {
  private readonly logger = new Logger(DailyRiskScoreScheduler.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly monitoringService: PredictiveDefaultMonitoringService,
  ) {}

  /**
   * Calculate daily risk scores for all active loans
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async calculateDailyRiskScores() {
    this.logger.log('Starting daily risk score calculation for all active loans');

    try {
      // Get all active loans (not settled, written off, or closed)
      const activeLoans = await this.loanRepository.find({
        where: [
          { status: LoanStatus.ACTIVE },
          { status: LoanStatus.SANCTIONED },
          { status: LoanStatus.DISBURSED },
        ],
      });

      this.logger.log(`Found ${activeLoans.length} active loans to process`);

      let successCount = 0;
      let errorCount = 0;

      // Process loans in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < activeLoans.length; i += batchSize) {
        const batch = activeLoans.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (loan) => {
            try {
              await this.monitoringService.calculateDailyRiskScore(loan.id);
              successCount++;
            } catch (error) {
              this.logger.error(`Failed to calculate risk score for loan ${loan.id}: ${error.message}`);
              errorCount++;
            }
          }),
        );

        // Small delay between batches
        if (i + batchSize < activeLoans.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      this.logger.log(
        `Daily risk score calculation completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(`Error in daily risk score calculation: ${error.message}`, error.stack);
    }
  }
}

