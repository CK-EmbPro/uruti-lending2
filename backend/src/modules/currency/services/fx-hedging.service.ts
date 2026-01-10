import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { FXHedgingPosition } from '../entities/fx-hedging-position.entity';
import { ExchangeRateApiService } from './exchange-rate-api.service';
import { Loan } from '../../loan/entities/loan.entity';

export enum HedgingStrategy {
  FORWARD_CONTRACT = 'FORWARD_CONTRACT',
  OPTIONS = 'OPTIONS',
  NATURAL_HEDGE = 'NATURAL_HEDGE',
  NO_HEDGE = 'NO_HEDGE',
}

export enum HedgingStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  CANCELLED = 'CANCELLED',
  EXECUTED = 'EXECUTED',
}

/**
 * FX Hedging Service
 * Manages foreign exchange hedging positions and strategies
 */
@Injectable()
export class FXHedgingService {
  private readonly logger = new Logger(FXHedgingService.name);

  constructor(
    @InjectRepository(FXHedgingPosition)
    private readonly hedgingPositionRepository: Repository<FXHedgingPosition>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly exchangeRateApiService: ExchangeRateApiService,
  ) {}

  /**
   * Create hedging position for a loan
   */
  async createHedgingPosition(
    loanId: string,
    strategy: HedgingStrategy,
    hedgeAmount: number,
    hedgeCurrency: string,
    maturityDate: Date,
    targetRate?: number,
  ): Promise<FXHedgingPosition> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId }, relations: ['currency'] });
    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    if (!loan.currency) {
      throw new Error(`Loan ${loanId} does not have a currency`);
    }

    const loanCurrency = loan.currency.code;
    const baseCurrency = 'USD'; // Assuming USD is base currency

    // Get current exchange rate
    const currentRate = await this.exchangeRateApiService.getExchangeRate(loanCurrency, baseCurrency);

    const position = this.hedgingPositionRepository.create({
      loanId,
      strategy,
      hedgeAmount,
      hedgeCurrency,
      loanCurrency,
      baseCurrency,
      currentRate,
      targetRate: targetRate || currentRate,
      maturityDate,
      status: HedgingStatus.ACTIVE,
    });

    return await this.hedgingPositionRepository.save(position);
  }

  /**
   * Calculate FX exposure for a loan
   */
  async calculateFXExposure(loanId: string): Promise<{
    exposure: number;
    exposureBaseCurrency: number;
    currentRate: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['currency'],
    });

    if (!loan || !loan.currency) {
      throw new Error(`Loan ${loanId} not found or has no currency`);
    }

    const outstandingAmount = loan.loanAmount - loan.disbursedAmount;
    const currentRate = await this.exchangeRateApiService.getExchangeRate(
      loan.currency.code,
      'USD',
    );
    const exposureBaseCurrency = outstandingAmount * currentRate;

    // Calculate risk level based on exposure and volatility
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (exposureBaseCurrency > 100000) {
      riskLevel = 'HIGH';
    } else if (exposureBaseCurrency > 50000) {
      riskLevel = 'MEDIUM';
    }

    return {
      exposure: outstandingAmount,
      exposureBaseCurrency,
      currentRate,
      riskLevel,
    };
  }

  /**
   * Get hedging recommendations for a loan
   */
  async getHedgingRecommendations(loanId: string): Promise<{
    recommended: boolean;
    strategy: HedgingStrategy;
    hedgePercentage: number;
    reason: string;
  }> {
    const exposure = await this.calculateFXExposure(loanId);

    // Simple recommendation logic
    if (exposure.riskLevel === 'HIGH') {
      return {
        recommended: true,
        strategy: HedgingStrategy.FORWARD_CONTRACT,
        hedgePercentage: 100,
        reason: 'High FX exposure detected. Recommend full hedging.',
      };
    } else if (exposure.riskLevel === 'MEDIUM') {
      return {
        recommended: true,
        strategy: HedgingStrategy.NATURAL_HEDGE,
        hedgePercentage: 50,
        reason: 'Medium FX exposure. Consider partial hedging.',
      };
    } else {
      return {
        recommended: false,
        strategy: HedgingStrategy.NO_HEDGE,
        hedgePercentage: 0,
        reason: 'Low FX exposure. No hedging required.',
      };
    }
  }

  /**
   * Mark-to-market valuation of hedging positions
   */
  async markToMarket(positionId: string): Promise<{
    position: FXHedgingPosition;
    currentValue: number;
    unrealizedPnL: number;
  }> {
    const position = await this.hedgingPositionRepository.findOne({
      where: { id: positionId },
      relations: ['loan'],
    });

    if (!position) {
      throw new Error(`Hedging position ${positionId} not found`);
    }

    // Get current market rate
    const currentRate = await this.exchangeRateApiService.getExchangeRate(
      position.loanCurrency,
      position.baseCurrency,
    );

    // Calculate current value and P&L
    const currentValue = position.hedgeAmount * currentRate;
    const unrealizedPnL = currentValue - position.hedgeAmount * position.targetRate;

    // Update position
    position.currentRate = currentRate;
    await this.hedgingPositionRepository.save(position);

    return {
      position,
      currentValue,
      unrealizedPnL,
    };
  }

  /**
   * Get all active hedging positions
   */
  async getActivePositions(): Promise<FXHedgingPosition[]> {
    return await this.hedgingPositionRepository.find({
      where: { status: HedgingStatus.ACTIVE },
      relations: ['loan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Execute hedging position (on maturity)
   */
  async executeHedgingPosition(positionId: string): Promise<FXHedgingPosition> {
    const position = await this.hedgingPositionRepository.findOne({
      where: { id: positionId },
    });

    if (!position) {
      throw new Error(`Hedging position ${positionId} not found`);
    }

    if (position.status !== HedgingStatus.ACTIVE) {
      throw new Error(`Position ${positionId} is not active`);
    }

    // Mark-to-market before execution
    const mtm = await this.markToMarket(positionId);

    position.status = HedgingStatus.EXECUTED;
    position.executedAt = new Date();
    position.executedRate = mtm.position.currentRate;
    position.realizedPnL = mtm.unrealizedPnL;

    return await this.hedgingPositionRepository.save(position);
  }
}

