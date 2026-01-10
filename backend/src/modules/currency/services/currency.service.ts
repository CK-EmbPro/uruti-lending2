import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Currency, CurrencyStatus } from '../entities/currency.entity';
import { ExchangeRate, ExchangeRateSource } from '../entities/exchange-rate.entity';
import { FXTransaction, FXTransactionType, FXTransactionStatus } from '../entities/fx-transaction.entity';
import { FXExposure, ExposureType } from '../entities/fx-exposure.entity';
import {
  CreateCurrencyDto,
  CreateExchangeRateDto,
  ConvertCurrencyDto,
  CreateFXTransactionDto,
  GetExchangeRatesDto,
  GetFXExposureDto,
} from '../dto/currency.dto';

/**
 * Currency Service
 * Manages currencies, exchange rates, conversions, and FX transactions
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    @InjectRepository(FXTransaction)
    private readonly fxTransactionRepository: Repository<FXTransaction>,
    @InjectRepository(FXExposure)
    private readonly fxExposureRepository: Repository<FXExposure>,
  ) {}

  /**
   * Create a new currency
   */
  async createCurrency(dto: CreateCurrencyDto): Promise<Currency> {
    // Check if currency code already exists
    const existing = await this.currencyRepository.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Currency with code ${dto.code} already exists`);
    }

    // If this is set as base currency, unset other base currencies
    if (dto.isBaseCurrency) {
      await this.currencyRepository.update(
        { isBaseCurrency: true },
        { isBaseCurrency: false },
      );
    }

    const currency = this.currencyRepository.create({
      ...dto,
      status: CurrencyStatus.ACTIVE,
      exchangeRate: dto.exchangeRate || (dto.isBaseCurrency ? 1 : null),
      exchangeRateDate: dto.exchangeRate ? new Date() : null,
    });

    return await this.currencyRepository.save(currency);
  }

  /**
   * Get all currencies
   */
  async getAllCurrencies(): Promise<Currency[]> {
    return await this.currencyRepository.find({
      order: { code: 'ASC' },
    });
  }

  /**
   * Get active currencies
   */
  async getActiveCurrencies(): Promise<Currency[]> {
    return await this.currencyRepository.find({
      where: { status: CurrencyStatus.ACTIVE },
      order: { code: 'ASC' },
    });
  }

  /**
   * Get base currency
   */
  async getBaseCurrency(): Promise<Currency> {
    const baseCurrency = await this.currencyRepository.findOne({
      where: { isBaseCurrency: true, status: CurrencyStatus.ACTIVE },
    });

    if (!baseCurrency) {
      throw new NotFoundException('Base currency not found. Please set a base currency.');
    }

    return baseCurrency;
  }

  /**
   * Create exchange rate
   */
  async createExchangeRate(dto: CreateExchangeRateDto): Promise<ExchangeRate> {
    // Validate currencies exist
    const fromCurrency = await this.currencyRepository.findOne({
      where: { id: dto.fromCurrencyId },
    });
    const toCurrency = await this.currencyRepository.findOne({
      where: { id: dto.toCurrencyId },
    });

    if (!fromCurrency || !toCurrency) {
      throw new NotFoundException('Currency not found');
    }

    // Check if rate already exists for this date
    const existing = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        rateDate: new Date(dto.rateDate),
      },
    });

    if (existing) {
      // Update existing rate
      existing.rate = dto.rate;
      existing.source = dto.source || ExchangeRateSource.MANUAL;
      existing.sourceReference = dto.sourceReference || null;
      existing.buyRate = dto.buyRate || null;
      existing.sellRate = dto.sellRate || null;
      return await this.exchangeRateRepository.save(existing);
    }

    const exchangeRate = this.exchangeRateRepository.create({
      ...dto,
      rateDate: new Date(dto.rateDate),
      source: dto.source || ExchangeRateSource.MANUAL,
    });

    return await this.exchangeRateRepository.save(exchangeRate);
  }

  /**
   * Get exchange rate
   */
  async getExchangeRate(
    fromCurrencyId: string,
    toCurrencyId: string,
    rateDate?: Date,
  ): Promise<ExchangeRate> {
    const date = rateDate || new Date();

    // Try to find exact date match
    let rate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrencyId,
        toCurrencyId,
        rateDate: date,
        isActive: true,
      },
      relations: ['fromCurrency', 'toCurrency'],
    });

    // If not found, get latest rate before or on the date
    if (!rate) {
      rate = await this.exchangeRateRepository.findOne({
        where: {
          fromCurrencyId,
          toCurrencyId,
          isActive: true,
        },
        order: { rateDate: 'DESC' },
        relations: ['fromCurrency', 'toCurrency'],
      });
    }

    if (!rate) {
      throw new NotFoundException(
        `Exchange rate not found for ${fromCurrencyId} to ${toCurrencyId}`,
      );
    }

    return rate;
  }

  /**
   * Convert currency
   */
  async convertCurrency(dto: ConvertCurrencyDto): Promise<{
    fromCurrency: Currency;
    toCurrency: Currency;
    fromAmount: number;
    toAmount: number;
    exchangeRate: number;
    rateDate: Date;
  }> {
    const rateDate = dto.rateDate ? new Date(dto.rateDate) : new Date();
    const exchangeRate = await this.getExchangeRate(
      dto.fromCurrencyId,
      dto.toCurrencyId,
      rateDate,
    );

    // Use buy/sell rate if specified
    let rate = exchangeRate.rate;
    if (dto.useBuySellRate) {
      // For conversion, use appropriate rate based on direction
      // This is simplified - in production, you'd determine buy vs sell based on context
      rate = exchangeRate.buyRate || exchangeRate.sellRate || exchangeRate.rate;
    }

    const toAmount = dto.amount * rate;

    return {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      fromAmount: dto.amount,
      toAmount: Number(toAmount.toFixed(2)),
      exchangeRate: rate,
      rateDate: exchangeRate.rateDate,
    };
  }

  /**
   * Get exchange rates with filters
   */
  async getExchangeRates(filters: GetExchangeRatesDto): Promise<ExchangeRate[]> {
    const query = this.exchangeRateRepository.createQueryBuilder('rate')
      .leftJoinAndSelect('rate.fromCurrency', 'fromCurrency')
      .leftJoinAndSelect('rate.toCurrency', 'toCurrency')
      .where('rate.isActive = :isActive', { isActive: true });

    if (filters.fromCurrencyId) {
      query.andWhere('rate.fromCurrencyId = :fromCurrencyId', {
        fromCurrencyId: filters.fromCurrencyId,
      });
    }

    if (filters.toCurrencyId) {
      query.andWhere('rate.toCurrencyId = :toCurrencyId', {
        toCurrencyId: filters.toCurrencyId,
      });
    }

    if (filters.rateDate) {
      query.andWhere('rate.rateDate = :rateDate', {
        rateDate: filters.rateDate,
      });
    } else if (filters.startDate && filters.endDate) {
      query.andWhere('rate.rateDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('rate.rateDate', 'DESC');

    return await query.getMany();
  }

  /**
   * Create FX transaction
   */
  async createFXTransaction(dto: CreateFXTransactionDto): Promise<FXTransaction> {
    const fromCurrency = await this.currencyRepository.findOne({
      where: { id: dto.fromCurrencyId },
    });
    const toCurrency = await this.currencyRepository.findOne({
      where: { id: dto.toCurrencyId },
    });

    if (!fromCurrency || !toCurrency) {
      throw new NotFoundException('Currency not found');
    }

    const toAmount = dto.fromAmount * dto.exchangeRate;

    const transaction = this.fxTransactionRepository.create({
      ...dto,
      toAmount: Number(toAmount.toFixed(2)),
      transactionDate: new Date(dto.transactionDate),
      valueDate: dto.valueDate ? new Date(dto.valueDate) : null,
      status: FXTransactionStatus.COMPLETED,
    });

    return await this.fxTransactionRepository.save(transaction);
  }

  /**
   * Calculate FX exposure
   */
  async calculateFXExposure(
    loanId: string,
    currencyId: string,
    asOfDate: Date,
  ): Promise<FXExposure[]> {
    // This would integrate with loan service to get loan details
    // For now, this is a placeholder structure

    const exposures: FXExposure[] = [];

    // Calculate different types of exposures
    const exposureTypes = [
      ExposureType.LOAN_OUTSTANDING,
      ExposureType.INTEREST_ACCRUED,
      ExposureType.PRINCIPAL_DUE,
      ExposureType.INTEREST_DUE,
    ];

    for (const exposureType of exposureTypes) {
      // In production, this would calculate actual exposure from loan data
      const exposure = this.fxExposureRepository.create({
        loanId,
        currencyId,
        exposureType,
        exposureAmount: 0, // Would be calculated from loan
        exchangeRate: 1, // Would get from exchange rate service
        baseCurrencyAmount: 0, // Would be calculated
        asOfDate,
      });

      exposures.push(exposure);
    }

    return exposures;
  }

  /**
   * Get FX exposures
   */
  async getFXExposures(filters: GetFXExposureDto): Promise<FXExposure[]> {
    const query = this.fxExposureRepository.createQueryBuilder('exposure')
      .leftJoinAndSelect('exposure.currency', 'currency')
      .leftJoinAndSelect('exposure.loan', 'loan');

    if (filters.loanId) {
      query.andWhere('exposure.loanId = :loanId', { loanId: filters.loanId });
    }

    if (filters.currencyId) {
      query.andWhere('exposure.currencyId = :currencyId', { currencyId: filters.currencyId });
    }

    if (filters.exposureType) {
      query.andWhere('exposure.exposureType = :exposureType', {
        exposureType: filters.exposureType,
      });
    }

    if (filters.asOfDate) {
      query.andWhere('exposure.asOfDate = :asOfDate', {
        asOfDate: filters.asOfDate,
      });
    }

    query.orderBy('exposure.asOfDate', 'DESC');

    return await query.getMany();
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { code },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code ${code} not found`);
    }

    return currency;
  }
}

