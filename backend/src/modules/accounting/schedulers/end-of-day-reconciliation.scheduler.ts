import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliationService } from '../services/reconciliation.service';

@Injectable()
export class EndOfDayReconciliationScheduler {
  private readonly logger = new Logger(EndOfDayReconciliationScheduler.name);

  constructor(private readonly reconciliationService: ReconciliationService) {}

  /**
   * End-of-day reconciliation
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runReconciliation() {
    this.logger.log('Starting end-of-day reconciliation');

    try {
      const report = await this.reconciliationService.runEndOfDayReconciliation();
      this.logger.log(
        `Reconciliation completed. Matched: ${report.matchedEntries}/${report.totalLedgerEntries} entries`,
      );
      if (report.discrepancies.length > 0) {
        this.logger.warn(`Discrepancies found: ${report.discrepancies.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error in end-of-day reconciliation: ${error.message}`, error.stack);
    }
  }
}

