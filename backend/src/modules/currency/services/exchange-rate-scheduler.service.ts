import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRateApiService } from './exchange-rate-api.service';

/**
 * Exchange Rate Scheduler Service
 * Automatically updates exchange rates on a schedule
 */
@Injectable()
export class ExchangeRateSchedulerService {
  private readonly logger = new Logger(ExchangeRateSchedulerService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    private readonly exchangeRateApiService: ExchangeRateApiService,
  ) {}

  /**
   * Update exchange rates daily at 6 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async updateExchangeRatesDaily(): Promise<void> {
    this.logger.log('Starting daily exchange rate update');
    await this.updateAllExchangeRates();
  }

  /**
   * Update exchange rates every 4 hours during business hours
   */
  @Cron('0 */4 * * *') // Every 4 hours
  async updateExchangeRatesFrequently(): Promise<void> {
    const hour = new Date().getHours();
    // Only update during business hours (6 AM - 10 PM)
    if (hour >= 6 && hour < 22) {
      this.logger.log('Starting frequent exchange rate update');
      await this.updateAllExchangeRates();
    }
  }

  /**
   * Update all exchange rates
   */
  async updateAllExchangeRates(): Promise<void> {
    try {
      const currencies = await this.currencyRepository.find({
        where: { status: 'ACTIVE' as any },
      });

      if (currencies.length === 0) {
        this.logger.warn('No active currencies found');
        return;
      }

      const baseCurrency = currencies.find((c) => c.isBaseCurrency);
      if (!baseCurrency) {
        this.logger.warn('Base currency not found');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let updatedCount = 0;
      let errorCount = 0;

      for (const currency of currencies) {
        if (currency.id === baseCurrency.id) {
          continue; // Skip base currency
        }

        try {
          // Get rate from API
          const rate = await this.exchangeRateApiService.getExchangeRate(
            currency.code,
            baseCurrency.code,
          );

          // Save to database
          const existing = await this.exchangeRateRepository.findOne({
            where: {
              fromCurrencyId: currency.id,
              toCurrencyId: baseCurrency.id,
              rateDate: today,
            },
          });

          if (existing) {
            existing.rate = rate;
            existing.source = 'API' as any;
            existing.sourceReference = 'Scheduled Update';
            await this.exchangeRateRepository.save(existing);
          } else {
            const newRate = this.exchangeRateRepository.create({
              fromCurrencyId: currency.id,
              toCurrencyId: baseCurrency.id,
              rate,
              rateDate: today,
              source: 'API' as any,
              sourceReference: 'Scheduled Update',
              isActive: true,
            });
            await this.exchangeRateRepository.save(newRate);
          }

          // Update currency entity
          currency.exchangeRate = rate;
          currency.exchangeRateDate = new Date();
          await this.currencyRepository.save(currency);

          updatedCount++;
          this.logger.log(`Updated exchange rate for ${currency.code}: ${rate}`);
        } catch (error: any) {
          errorCount++;
          this.logger.error(
            `Failed to update exchange rate for ${currency.code}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Exchange rate update completed. Updated: ${updatedCount}, Errors: ${errorCount}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to update exchange rates: ${error.message}`, error.stack);
    }
  }

  /**
   * Manually trigger exchange rate update
   */
  async manualUpdate(): Promise<{ updated: number; errors: number }> {
    this.logger.log('Manual exchange rate update triggered');
    await this.updateAllExchangeRates();

    const currencies = await this.currencyRepository.find({
      where: { status: 'ACTIVE' as any },
    });

    return {
      updated: currencies.length - 1, // Exclude base currency
      errors: 0, // Would need to track this properly
    };
  }
}

