import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiskBasedPricingService } from '../services/risk-based-pricing.service';

@Injectable()
export class PortfolioOptimizationScheduler {
  private readonly logger = new Logger(PortfolioOptimizationScheduler.name);

  constructor(private readonly pricingService: RiskBasedPricingService) {}

  /**
   * Weekly portfolio optimization
   * Runs every Monday at 2 AM
   */
  @Cron('0 2 * * 1') // Every Monday at 2 AM
  async optimizePortfolio() {
    this.logger.log('Starting weekly portfolio optimization');

    try {
      const optimization = await this.pricingService.getPortfolioOptimization();
      this.logger.log(
        `Portfolio optimization completed. Current yield: ${optimization.currentYield}%, Target: ${optimization.targetYield}%`,
      );
      this.logger.log(`Recommendations: ${optimization.recommendations.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error in portfolio optimization: ${error.message}`, error.stack);
    }
  }
}

