import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRateApiService } from './exchange-rate-api.service';

/**
 * Currency Conversion Service
 * Handles currency conversions and exchange rate management
 */
@Injectable()
export class CurrencyConversionService {
  private readonly logger = new Logger(CurrencyConversionService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    private readonly exchangeRateApiService: ExchangeRateApiService,
  ) {}

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    conversionDate?: Date,
  ): Promise<{
    convertedAmount: number;
    exchangeRate: number;
    fromCurrency: Currency;
    toCurrency: Currency;
  }> {
    const fromCurrency = await this.currencyRepository.findOne({
      where: { id: fromCurrencyId },
    });
    const toCurrency = await this.currencyRepository.findOne({
      where: { id: toCurrencyId },
    });

    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency not found');
    }

    if (fromCurrencyId === toCurrencyId) {
      return {
        convertedAmount: amount,
        exchangeRate: 1.0,
        fromCurrency,
        toCurrency,
      };
    }

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate(
      fromCurrency.code,
      toCurrency.code,
      conversionDate,
    );

    const convertedAmount = amount * exchangeRate;

    return {
      convertedAmount,
      exchangeRate,
      fromCurrency,
      toCurrency,
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrencyCode: string,
    toCurrencyCode: string,
    date?: Date,
  ): Promise<number> {
    if (fromCurrencyCode === toCurrencyCode) {
      return 1.0;
    }

    // Try to get from database first
    const rateDate = date || new Date();
    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency: { code: fromCurrencyCode },
        toCurrency: { code: toCurrencyCode },
        rateDate: rateDate,
        isActive: true,
      },
      relations: ['fromCurrency', 'toCurrency'],
      order: { createdAt: 'DESC' },
    });

    if (exchangeRate) {
      return Number(exchangeRate.rate);
    }

    // If not found in database, fetch from API
    try {
      const apiRate = await this.exchangeRateApiService.getExchangeRate(
        fromCurrencyCode,
        toCurrencyCode,
      );

      // Save to database for future use
      await this.saveExchangeRate(
        fromCurrencyCode,
        toCurrencyCode,
        apiRate,
        rateDate,
      );

      return apiRate;
    } catch (error) {
      this.logger.error(`Failed to get exchange rate from API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save exchange rate to database
   */
  async saveExchangeRate(
    fromCurrencyCode: string,
    toCurrencyCode: string,
    rate: number,
    rateDate: Date,
    source: string = 'API',
  ): Promise<ExchangeRate> {
    const fromCurrency = await this.currencyRepository.findOne({
      where: { code: fromCurrencyCode },
    });
    const toCurrency = await this.currencyRepository.findOne({
      where: { code: toCurrencyCode },
    });

    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency not found');
    }

    // Check if rate already exists
    const existing = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        rateDate: rateDate,
      },
    });

    if (existing) {
      existing.rate = rate;
      existing.source = source as any;
      return await this.exchangeRateRepository.save(existing);
    }

    const exchangeRate = this.exchangeRateRepository.create({
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate,
      rateDate,
      source: source as any,
      sourceReference: 'ExchangeRateApiService',
      isActive: true,
    });

    return await this.exchangeRateRepository.save(exchangeRate);
  }

  /**
   * Validate currency code
   */
  async validateCurrency(currencyId: string): Promise<boolean> {
    const currency = await this.currencyRepository.findOne({
      where: { id: currencyId, status: 'ACTIVE' as any },
    });
    return !!currency;
  }

  /**
   * Get base currency
   */
  async getBaseCurrency(): Promise<Currency> {
    const baseCurrency = await this.currencyRepository.findOne({
      where: { isBaseCurrency: true },
    });

    if (!baseCurrency) {
      throw new Error('Base currency not configured');
    }

    return baseCurrency;
  }
}

