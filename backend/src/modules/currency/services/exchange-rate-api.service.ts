import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ExchangeRateProvider {
  name: string;
  apiKey?: string;
  baseUrl: string;
  getRate: (from: string, to: string) => Promise<number>;
}

/**
 * Exchange Rate API Service
 * Supports multiple providers: Fixer.io, ExchangeRate-API, Open Exchange Rates
 */
@Injectable()
export class ExchangeRateApiService {
  private readonly logger = new Logger(ExchangeRateApiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly provider: string;
  private readonly apiKey: string | undefined;
  private readonly baseCurrency: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('EXCHANGE_RATE_PROVIDER') || 'fixer';
    this.apiKey = this.configService.get<string>('EXCHANGE_RATE_API_KEY');
    this.baseCurrency = this.configService.get<string>('BASE_CURRENCY') || 'USD';

    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!this.apiKey && this.provider !== 'exchange-rate-api') {
      this.logger.warn(`Exchange rate API key not configured for provider: ${this.provider}`);
    }
  }

  /**
   * Get exchange rate from currency to base currency
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string = this.baseCurrency): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    try {
      switch (this.provider) {
        case 'fixer':
          return await this.getRateFromFixer(fromCurrency, toCurrency);
        case 'exchange-rate-api':
          return await this.getRateFromExchangeRateApi(fromCurrency, toCurrency);
        case 'open-exchange-rates':
          return await this.getRateFromOpenExchangeRates(fromCurrency, toCurrency);
        default:
          throw new HttpException(
            `Unsupported exchange rate provider: ${this.provider}`,
            HttpStatus.BAD_REQUEST,
          );
      }
    } catch (error: any) {
      this.logger.error(`Failed to get exchange rate: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch exchange rate: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get multiple exchange rates at once
   */
  async getExchangeRates(
    fromCurrency: string,
    toCurrencies: string[],
  ): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};

    if (this.provider === 'fixer' || this.provider === 'open-exchange-rates') {
      // These providers support multiple currencies in one call
      const allRates = await this.getAllRates(fromCurrency);
      for (const toCurrency of toCurrencies) {
        rates[toCurrency] = allRates[toCurrency] || 1.0;
      }
    } else {
      // Fetch rates one by one
      for (const toCurrency of toCurrencies) {
        rates[toCurrency] = await this.getExchangeRate(fromCurrency, toCurrency);
      }
    }

    return rates;
  }

  /**
   * Get all available rates for a base currency
   */
  async getAllRates(baseCurrency: string = this.baseCurrency): Promise<Record<string, number>> {
    try {
      switch (this.provider) {
        case 'fixer':
          return await this.getAllRatesFromFixer(baseCurrency);
        case 'exchange-rate-api':
          return await this.getAllRatesFromExchangeRateApi(baseCurrency);
        case 'open-exchange-rates':
          return await this.getAllRatesFromOpenExchangeRates(baseCurrency);
        default:
          throw new HttpException(
            `Unsupported exchange rate provider: ${this.provider}`,
            HttpStatus.BAD_REQUEST,
          );
      }
    } catch (error: any) {
      this.logger.error(`Failed to get all exchange rates: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch exchange rates: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string = this.baseCurrency,
  ): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  // Fixer.io implementation
  private async getRateFromFixer(fromCurrency: string, toCurrency: string): Promise<number> {
    if (!this.apiKey) {
      throw new HttpException('Fixer.io API key not configured', HttpStatus.BAD_REQUEST);
    }

    const url = `https://api.fixer.io/latest?access_key=${this.apiKey}&base=${fromCurrency}&symbols=${toCurrency}`;
    const response = await this.httpClient.get(url);

    if (response.data.success === false) {
      throw new HttpException(
        `Fixer.io API error: ${response.data.error?.info || 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return response.data.rates[toCurrency];
  }

  private async getAllRatesFromFixer(baseCurrency: string): Promise<Record<string, number>> {
    if (!this.apiKey) {
      throw new HttpException('Fixer.io API key not configured', HttpStatus.BAD_REQUEST);
    }

    const url = `https://api.fixer.io/latest?access_key=${this.apiKey}&base=${baseCurrency}`;
    const response = await this.httpClient.get(url);

    if (response.data.success === false) {
      throw new HttpException(
        `Fixer.io API error: ${response.data.error?.info || 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return response.data.rates;
  }

  // ExchangeRate-API implementation (free tier available)
  private async getRateFromExchangeRateApi(fromCurrency: string, toCurrency: string): Promise<number> {
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    const response = await this.httpClient.get(url);

    return response.data.rates[toCurrency] || 1.0;
  }

  private async getAllRatesFromExchangeRateApi(baseCurrency: string): Promise<Record<string, number>> {
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    const response = await this.httpClient.get(url);

    return response.data.rates || {};
  }

  // Open Exchange Rates implementation
  private async getRateFromOpenExchangeRates(fromCurrency: string, toCurrency: string): Promise<number> {
    if (!this.apiKey) {
      throw new HttpException('Open Exchange Rates API key not configured', HttpStatus.BAD_REQUEST);
    }

    const url = `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}&base=${fromCurrency}&symbols=${toCurrency}`;
    const response = await this.httpClient.get(url);

    return response.data.rates[toCurrency];
  }

  private async getAllRatesFromOpenExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
    if (!this.apiKey) {
      throw new HttpException('Open Exchange Rates API key not configured', HttpStatus.BAD_REQUEST);
    }

    const url = `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}&base=${baseCurrency}`;
    const response = await this.httpClient.get(url);

    return response.data.rates || {};
  }

  /**
   * Validate currency code
   */
  validateCurrencyCode(currencyCode: string): boolean {
    // Basic validation - 3 uppercase letters
    return /^[A-Z]{3}$/.test(currencyCode);
  }
}

