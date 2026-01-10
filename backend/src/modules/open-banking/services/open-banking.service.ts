import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BankConnection } from '../entities/bank-connection.entity';
import { BankAccount } from '../entities/bank-account.entity';
import { BankTransaction } from '../entities/bank-transaction.entity';
import { BankConnectionStatus, AccountType, TransactionCategory } from '../dto/open-banking.dto';
import {
  ConnectBankAccountDto,
  BankAccount as BankAccountDto,
  BankTransaction as BankTransactionDto,
  AccountBalance,
  IncomeVerification,
} from '../dto/open-banking.dto';

@Injectable()
export class OpenBankingService {
  private readonly logger = new Logger(OpenBankingService.name);

  constructor(
    @InjectRepository(BankConnection)
    private connectionRepository: Repository<BankConnection>,
    @InjectRepository(BankAccount)
    private accountRepository: Repository<BankAccount>,
    @InjectRepository(BankTransaction)
    private transactionRepository: Repository<BankTransaction>,
  ) {}

  async connectBankAccount(customerId: string, connectDto: ConnectBankAccountDto): Promise<BankConnection> {
    // TODO: Integrate with actual Open Banking provider (Plaid, Yodlee, etc.)
    // This is a placeholder that simulates connection

    this.logger.log(`Connecting bank account for customer ${customerId} via ${connectDto.provider}`);

    // Simulate API call to provider
    await new Promise(resolve => setTimeout(resolve, 500));

    const connection = this.connectionRepository.create({
      customerId,
      provider: connectDto.provider,
      accessToken: `encrypted_token_${Date.now()}`, // In production, encrypt this
      itemId: `item_${Date.now()}`,
      status: BankConnectionStatus.CONNECTED,
      connectedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });

    const saved = await this.connectionRepository.save(connection);

    // Fetch accounts
    await this.syncAccounts(saved.id);

    return saved;
  }

  private async syncAccounts(connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({ where: { id: connectionId } });
    if (!connection) return;

    // TODO: Fetch accounts from provider API
    // This is a placeholder
    const mockAccounts = [
      {
        providerAccountId: 'acc_checking_001',
        bankName: 'Chase Bank',
        accountType: AccountType.CHECKING,
        accountNumber: '****1234',
        routingNumber: '****5678',
        currentBalance: 5000.00,
        availableBalance: 4500.00,
      },
      {
        providerAccountId: 'acc_savings_001',
        bankName: 'Chase Bank',
        accountType: AccountType.SAVINGS,
        accountNumber: '****5678',
        routingNumber: '****5678',
        currentBalance: 15000.00,
        availableBalance: 15000.00,
      },
    ];

    for (const accountData of mockAccounts) {
      const existing = await this.accountRepository.findOne({
        where: {
          connectionId,
          providerAccountId: accountData.providerAccountId,
        },
      });

      if (!existing) {
        const account = this.accountRepository.create({
          customerId: connection.customerId,
          connectionId,
          ...accountData,
          lastSyncedAt: new Date(),
        });
        await this.accountRepository.save(account);
      }
    }
  }

  async getBankAccounts(customerId: string): Promise<BankAccount[]> {
    return this.accountRepository.find({
      where: { customerId },
      relations: ['connection'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Bank account with ID ${accountId} not found`);
    }

    // TODO: Fetch real-time balance from provider
    return {
      current: Number(account.currentBalance),
      available: Number(account.availableBalance),
      pending: Number(account.currentBalance) - Number(account.availableBalance),
      lastUpdated: account.lastSyncedAt || account.updatedAt,
    };
  }

  async getTransactions(
    customerId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<BankTransaction[]> {
    const where: any = { customerId };
    if (accountId) where.accountId = accountId;
    if (startDate) where.transactionDate = MoreThan(startDate);
    if (endDate) where.transactionDate = LessThan(endDate);

    return this.transactionRepository.find({
      where,
      order: { transactionDate: 'DESC' },
      take: limit,
      relations: ['account'],
    });
  }

  async syncTransactions(connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({ where: { id: connectionId } });
    if (!connection) {
      throw new NotFoundException(`Bank connection with ID ${connectionId} not found`);
    }

    const accounts = await this.accountRepository.find({ where: { connectionId } });

    for (const account of accounts) {
      // TODO: Fetch transactions from provider API
      // This is a placeholder
      this.logger.log(`Syncing transactions for account ${account.id}`);

      // Simulate fetching transactions
      const mockTransactions = this.generateMockTransactions(account.id, account.customerId);

      for (const txData of mockTransactions) {
        const existing = await this.transactionRepository.findOne({
          where: {
            accountId: account.id,
            providerTransactionId: txData.providerTransactionId,
          },
        });

        if (!existing) {
          const transaction = this.transactionRepository.create(txData);
          await this.transactionRepository.save(transaction);
        }
      }

      account.lastSyncedAt = new Date();
      await this.accountRepository.save(account);
    }

    connection.lastSyncedAt = new Date();
    await this.connectionRepository.save(connection);
  }

  private generateMockTransactions(accountId: string, customerId: string): Partial<BankTransaction>[] {
    // Generate mock transactions for demonstration
    const transactions: Partial<BankTransaction>[] = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      transactions.push({
        customerId,
        accountId,
        providerTransactionId: `tx_${Date.now()}_${i}`,
        transactionDate: date,
        amount: -Math.random() * 200 - 50,
        description: `Transaction ${i + 1}`,
        category: TransactionCategory.EXPENSE,
        merchant: `Merchant ${i + 1}`,
        isPending: i === 0,
      });
    }

    return transactions;
  }

  async verifyIncome(customerId: string): Promise<IncomeVerification> {
    // Get all bank accounts for customer
    const accounts = await this.getBankAccounts(customerId);

    // Get transactions from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.customerId = :customerId', { customerId })
      .andWhere('tx.transactionDate >= :startDate', { startDate: threeMonthsAgo })
      .andWhere('tx.amount > 0') // Income transactions
      .andWhere('tx.category = :category', { category: TransactionCategory.INCOME })
      .getMany();

    // Calculate monthly income
    const totalIncome = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const monthlyIncome = totalIncome / 3;

    // Calculate stability score (simplified)
    const monthlyIncomes = [0, 0, 0];
    transactions.forEach(tx => {
      const monthIndex = Math.floor((new Date().getTime() - tx.transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthIndex >= 0 && monthIndex < 3) {
        monthlyIncomes[monthIndex] += Number(tx.amount);
      }
    });

    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / 3;
    const variance = monthlyIncomes.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) / 3;
    const stabilityScore = Math.max(0, 1 - (variance / (avgIncome * avgIncome)));

    // Identify income sources
    const incomeSources = [...new Set(transactions.map(tx => tx.merchant || tx.description))];

    return {
      monthlyIncome,
      stabilityScore: Math.min(1, Math.max(0, stabilityScore)),
      incomeSources: incomeSources.slice(0, 5),
      verifiedDate: new Date(),
    };
  }

  async disconnectBankAccount(connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({ where: { id: connectionId } });
    if (!connection) {
      throw new NotFoundException(`Bank connection with ID ${connectionId} not found`);
    }

    // TODO: Revoke access token with provider
    connection.status = BankConnectionStatus.REVOKED;
    await this.connectionRepository.save(connection);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllConnections() {
    this.logger.log('Syncing all bank connections...');
    const connections = await this.connectionRepository.find({
      where: { status: BankConnectionStatus.CONNECTED },
    });

    for (const connection of connections) {
      try {
        await this.syncTransactions(connection.id);
      } catch (error) {
        this.logger.error(`Error syncing connection ${connection.id}: ${error.message}`);
      }
    }

    this.logger.log(`Synced ${connections.length} bank connections`);
  }
}
