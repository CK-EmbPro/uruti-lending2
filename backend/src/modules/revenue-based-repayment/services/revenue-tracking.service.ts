import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { RevenueTracking, RevenueSource, RevenueStatus } from '../entities/revenue-tracking.entity';
import { Integration } from '../../integration-hub/entities/integration.entity';
import { IntegrationType } from '../../integration-hub/entities/integration.entity';
import { BankTransaction } from '../../open-banking/entities/bank-transaction.entity';

export interface RevenueData {
  amount: number;
  date: Date;
  source: RevenueSource;
  integrationId?: string;
  externalReferenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RevenueTrackingService {
  private readonly logger = new Logger(RevenueTrackingService.name);

  constructor(
    @InjectRepository(RevenueTracking)
    private readonly revenueTrackingRepository: Repository<RevenueTracking>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(BankTransaction)
    private readonly bankTransactionRepository: Repository<BankTransaction>,
  ) {}

  /**
   * Fetch revenue data from payment gateway integration
   */
  async fetchRevenueFromPaymentGateway(
    integrationId: string,
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueData[]> {
    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, type: IntegrationType.PAYMENT_GATEWAY },
    });

    if (!integration) {
      throw new NotFoundException(`Payment gateway integration ${integrationId} not found`);
    }

    this.logger.log(`Fetching revenue from payment gateway ${integration.provider} for loan ${loanId}`);

    // TODO: Implement actual integration adapter based on provider
    // This is a placeholder that would call the actual payment gateway API
    const revenueData: RevenueData[] = [];

    switch (integration.provider) {
      case 'Stripe':
        // revenueData = await this.fetchFromStripe(integration, loanId, startDate, endDate);
        break;
      case 'PayPal':
        // revenueData = await this.fetchFromPayPal(integration, loanId, startDate, endDate);
        break;
      default:
        this.logger.warn(`Unsupported payment gateway provider: ${integration.provider}`);
    }

    return revenueData;
  }

  /**
   * Fetch revenue data from accounting system integration
   */
  async fetchRevenueFromAccountingSystem(
    integrationId: string,
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueData[]> {
    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId, type: IntegrationType.ACCOUNTING },
    });

    if (!integration) {
      throw new NotFoundException(`Accounting integration ${integrationId} not found`);
    }

    this.logger.log(`Fetching revenue from accounting system ${integration.provider} for loan ${loanId}`);

    // TODO: Implement actual integration adapter based on provider
    // This is a placeholder that would call the actual accounting system API
    const revenueData: RevenueData[] = [];

    switch (integration.provider) {
      case 'QuickBooks':
        // revenueData = await this.fetchFromQuickBooks(integration, loanId, startDate, endDate);
        break;
      case 'Xero':
        // revenueData = await this.fetchFromXero(integration, loanId, startDate, endDate);
        break;
      default:
        this.logger.warn(`Unsupported accounting provider: ${integration.provider}`);
    }

    return revenueData;
  }

  /**
   * Fetch revenue data from bank statements
   */
  async fetchRevenueFromBankStatements(
    bankAccountId: string,
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueData[]> {
    this.logger.log(`Fetching revenue from bank account ${bankAccountId} for loan ${loanId}`);

    // Fetch transactions from bank account
    const transactions = await this.bankTransactionRepository.find({
      where: {
        accountId: bankAccountId,
        transactionDate: Between(startDate, endDate),
      },
    });

    // Filter for credit transactions (revenue) - positive amounts
    const creditTransactions = transactions.filter(t => t.amount > 0);

    return creditTransactions.map(t => ({
      amount: t.amount,
      date: t.transactionDate,
      source: RevenueSource.BANK_STATEMENT,
      externalReferenceId: t.providerTransactionId,
      description: t.description,
      metadata: {
        category: t.category,
        merchant: t.merchant,
      },
    }));
  }

  /**
   * Record revenue tracking entry
   */
  async recordRevenue(
    loanId: string,
    companyId: string,
    revenueData: RevenueData,
  ): Promise<RevenueTracking> {
    const revenue = this.revenueTrackingRepository.create({
      loanId,
      companyId,
      revenueAmount: revenueData.amount,
      revenueDate: revenueData.date,
      source: revenueData.source,
      sourceIntegrationId: revenueData.integrationId,
      externalReferenceId: revenueData.externalReferenceId,
      description: revenueData.description,
      metadata: revenueData.metadata,
      status: RevenueStatus.PENDING,
    });

    return await this.revenueTrackingRepository.save(revenue);
  }

  /**
   * Get revenue for a loan in a date range
   */
  async getRevenueForPeriod(
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueTracking[]> {
    return await this.revenueTrackingRepository.find({
      where: {
        loanId,
        revenueDate: Between(startDate, endDate),
      },
      order: {
        revenueDate: 'ASC',
      },
    });
  }

  /**
   * Get total revenue for a period
   */
  async getTotalRevenueForPeriod(
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const revenues = await this.getRevenueForPeriod(loanId, startDate, endDate);
    return revenues
      .filter(r => r.status === RevenueStatus.VERIFIED)
      .reduce((sum, r) => sum + Number(r.revenueAmount), 0);
  }
}

