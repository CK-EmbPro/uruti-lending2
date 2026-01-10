import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, In } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { WeightedCreditScoringService } from './weighted-credit-scoring.service';
import { ScoringTrigger } from '../entities/credit-score-history.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

/**
 * Service for scheduled credit score updates
 * Handles hourly updates for active loans and daily updates for dormant loans
 */
@Injectable()
export class ScoringSchedulerService {
  private readonly logger = new Logger(ScoringSchedulerService.name);

  // Configuration
  private readonly ACTIVE_LOAN_THRESHOLD_DAYS = 30; // Loans with activity in last 30 days are considered active
  private readonly DORMANT_LOAN_THRESHOLD_DAYS = 30; // Loans with no activity for 30+ days are dormant

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    private readonly weightedScoringService: WeightedCreditScoringService,
  ) {}

  /**
   * Hourly scheduled job for active loans
   * Runs every hour to rescore active loans
   */
  @Cron(CronExpression.EVERY_HOUR)
  async rescoreActiveLoans() {
    this.logger.log('Starting hourly rescoring for active loans...');

    try {
      const activeLoans = await this.getActiveLoans();
      this.logger.log(`Found ${activeLoans.length} active loans to rescore`);

      let successCount = 0;
      let errorCount = 0;

      for (const loan of activeLoans) {
        try {
          await this.rescoreLoan(loan, ScoringTrigger.SCHEDULED_HOURLY);
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to rescore loan ${loan.id}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log(
        `Hourly rescoring completed: ${successCount} successful, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(`Error in hourly rescoring job: ${error.message}`, error.stack);
    }
  }

  /**
   * Daily scheduled job for dormant loans
   * Runs daily at 2 AM to rescore dormant loans
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async rescoreDormantLoans() {
    this.logger.log('Starting daily rescoring for dormant loans...');

    try {
      const dormantLoans = await this.getDormantLoans();
      this.logger.log(`Found ${dormantLoans.length} dormant loans to rescore`);

      let successCount = 0;
      let errorCount = 0;

      for (const loan of dormantLoans) {
        try {
          await this.rescoreLoan(loan, ScoringTrigger.SCHEDULED_DAILY);
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to rescore loan ${loan.id}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log(
        `Daily rescoring completed: ${successCount} successful, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(`Error in daily rescoring job: ${error.message}`, error.stack);
    }
  }

  /**
   * Get active loans (loans with recent activity)
   */
  private async getActiveLoans(): Promise<Loan[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.ACTIVE_LOAN_THRESHOLD_DAYS);

    return await this.loanRepository.find({
      where: [
        {
          status: In([LoanStatus.ACTIVE, LoanStatus.DISBURSED, LoanStatus.PARTIALLY_DISBURSED]),
          updatedAt: MoreThanOrEqual(thresholdDate),
        },
        // Also include loans with recent repayments (check via repayment schedule)
        // Note: lastRepaymentDate doesn't exist on Loan entity
        // Filtering by status and updatedAt should be sufficient
      ],
      relations: ['repaymentSchedule'],
    });
  }

  /**
   * Get dormant loans (loans with no recent activity)
   */
  private async getDormantLoans(): Promise<Loan[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - this.DORMANT_LOAN_THRESHOLD_DAYS);

    return await this.loanRepository.find({
      where: [
        {
          status: In([LoanStatus.ACTIVE, LoanStatus.DISBURSED, LoanStatus.PARTIALLY_DISBURSED]),
          updatedAt: LessThan(thresholdDate),
        },
      ],
      relations: ['repaymentSchedules'],
    });
  }

  /**
   * Rescore a loan
   */
  private async rescoreLoan(loan: Loan, trigger: ScoringTrigger): Promise<void> {
    if (!loan.applicantId) {
      this.logger.warn(`Loan ${loan.id} has no applicantId, skipping rescoring`);
      return;
    }

    // Determine segment based on loan amount
    const segment = this.determineSegment(loan.loanAmount);

    // Prepare scoring request
    const scoringRequest = {
      applicantId: loan.applicantId,
      // Note: applicationId not stored on Loan entity - can be retrieved from loan.loanId if needed
      loanId: loan.id,
    };

    // Calculate score with trigger
    await this.weightedScoringService.calculateWeightedScore(
      scoringRequest,
      loan.companyId,
      true, // useML
      segment,
      trigger,
      {
        loanId: loan.id,
        loanStatus: loan.status,
        timestamp: new Date().toISOString(),
      },
    );

    this.logger.debug(`Rescored loan ${loan.id} (trigger: ${trigger})`);
  }

  /**
   * Determine segment based on loan amount
   */
  private determineSegment(amount: number): 'MICRO' | 'SME' | 'ENTERPRISE' {
    if (amount < 10000) {
      return 'MICRO';
    } else if (amount < 100000) {
      return 'SME';
    } else {
      return 'ENTERPRISE';
    }
  }
}

