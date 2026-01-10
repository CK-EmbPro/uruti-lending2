import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType, RootType } from '../entities/account.entity';
import { Company } from '../../company/entities/company.entity';

interface AccountSeedData {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  rootType: RootType;
  isGroup: boolean;
  parentCode?: string;
  description?: string;
  openingBalance?: number;
}

@Injectable()
export class AccountSeedService {
  private readonly logger = new Logger(AccountSeedService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Seed default Chart of Accounts for a company
   */
  async seedChartOfAccounts(companyId?: string, force: boolean = false): Promise<void> {
    this.logger.log('Starting Chart of Accounts seed...');

    try {
      // Get or create default company
      let company: Company;
      if (companyId) {
        company = await this.companyRepository.findOne({ where: { id: companyId } });
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }
      } else {
        // Try to find default company or create one
        company = await this.companyRepository.findOne({ where: { code: 'URUTI' } });
        if (!company) {
          company = this.companyRepository.create({
            name: 'Uruti Lending Company',
            code: 'URUTI',
            email: 'info@urutilending.com',
            address: '123 Financial Street, Business District',
            phone: '+1-555-0123',
            isActive: true,
          });
          company = await this.companyRepository.save(company);
          this.logger.log(`Created default company: ${company.name}`);
        }
      }

      // Check if accounts already exist
      const existingAccounts = await this.accountRepository.count({
        where: { companyId: company.id },
      });

      if (existingAccounts > 0 && !force) {
        this.logger.log(
          `Found ${existingAccounts} existing accounts for company ${company.id}. Skipping seed. Use force=true to override.`,
        );
        return;
      }

      if (force && existingAccounts > 0) {
        this.logger.log(`Force mode: Removing existing accounts...`);
        await this.accountRepository.delete({ companyId: company.id });
      }

      // Define Chart of Accounts structure
      const accountsData: AccountSeedData[] = [
        // ASSETS
        { accountCode: 'ASSETS', accountName: 'Assets', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: true },
        { accountCode: 'CURRENT-ASSETS', accountName: 'Current Assets', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: true, parentCode: 'ASSETS' },
        { accountCode: 'BANK-ACCOUNTS', accountName: 'Bank Accounts', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: true, parentCode: 'CURRENT-ASSETS' },
        { accountCode: 'BANK-DISBURSEMENT', accountName: 'Disbursement Account', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'BANK-ACCOUNTS', description: 'Account from which loans are disbursed' },
        { accountCode: 'BANK-PAYMENT', accountName: 'Payment Account', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'BANK-ACCOUNTS', description: 'Account where loan repayments are received' },
        { accountCode: 'BANK-OPERATING', accountName: 'Operating Account', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'BANK-ACCOUNTS', description: 'General operating bank account' },
        { accountCode: 'ACCOUNTS-RECEIVABLE', accountName: 'Accounts Receivable', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: true, parentCode: 'CURRENT-ASSETS' },
        { accountCode: 'INTEREST-RECEIVABLE', accountName: 'Interest Receivable', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'ACCOUNTS-RECEIVABLE', description: 'Interest receivable from borrowers' },
        { accountCode: 'PENALTY-RECEIVABLE', accountName: 'Penalty Receivable', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'ACCOUNTS-RECEIVABLE', description: 'Penalty charges receivable' },
        { accountCode: 'CHARGES-RECEIVABLE', accountName: 'Charges Receivable', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'ACCOUNTS-RECEIVABLE', description: 'Processing and other charges receivable' },
        { accountCode: 'LOANS-ADVANCES', accountName: 'Loans and Advances', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: true, parentCode: 'CURRENT-ASSETS' },
        { accountCode: 'LOAN-ACCOUNT', accountName: 'Loan Account', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'LOANS-ADVANCES', description: 'Principal amount of loans disbursed' },
        { accountCode: 'INTEREST-ACCRUED-ASSET', accountName: 'Interest Accrued (Asset)', accountType: AccountType.ASSET, rootType: RootType.ASSET, isGroup: false, parentCode: 'LOANS-ADVANCES', description: 'Accrued interest on loans' },

        // LIABILITIES
        { accountCode: 'LIABILITIES', accountName: 'Liabilities', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: true },
        { accountCode: 'CURRENT-LIABILITIES', accountName: 'Current Liabilities', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: true, parentCode: 'LIABILITIES' },
        { accountCode: 'ACCOUNTS-PAYABLE', accountName: 'Accounts Payable', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: true, parentCode: 'CURRENT-LIABILITIES' },
        { accountCode: 'INTEREST-ACCRUED', accountName: 'Interest Accrued', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: false, parentCode: 'ACCOUNTS-PAYABLE', description: 'Accrued interest liability' },
        { accountCode: 'PENALTY-ACCRUED', accountName: 'Penalty Accrued', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: false, parentCode: 'ACCOUNTS-PAYABLE', description: 'Accrued penalty liability' },
        { accountCode: 'SECURITY-DEPOSIT', accountName: 'Security Deposit', accountType: AccountType.LIABILITY, rootType: RootType.LIABILITY, isGroup: false, parentCode: 'CURRENT-LIABILITIES', description: 'Security deposits from borrowers' },

        // INCOME
        { accountCode: 'INCOME', accountName: 'Income', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: true },
        { accountCode: 'DIRECT-INCOME', accountName: 'Direct Income', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: true, parentCode: 'INCOME' },
        { accountCode: 'INTEREST-INCOME', accountName: 'Interest Income', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: false, parentCode: 'DIRECT-INCOME', description: 'Interest income from loans' },
        { accountCode: 'PENALTY-INCOME', accountName: 'Penalty Income', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: false, parentCode: 'DIRECT-INCOME', description: 'Penalty charges income' },
        { accountCode: 'PROCESSING-FEE-INCOME', accountName: 'Processing Fee Income', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: false, parentCode: 'DIRECT-INCOME', description: 'Processing fees income' },
        { accountCode: 'WRITE-OFF-RECOVERY', accountName: 'Write-Off Recovery', accountType: AccountType.INCOME, rootType: RootType.INCOME, isGroup: false, parentCode: 'DIRECT-INCOME', description: 'Recovery from written-off loans' },

        // EXPENSES
        { accountCode: 'EXPENSES', accountName: 'Expenses', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: true },
        { accountCode: 'DIRECT-EXPENSES', accountName: 'Direct Expenses', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: true, parentCode: 'EXPENSES' },
        { accountCode: 'WRITE-OFF-EXPENSE', accountName: 'Write-Off Expense', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: false, parentCode: 'DIRECT-EXPENSES', description: 'Loan write-off expenses' },
        { accountCode: 'INTEREST-WAIVER', accountName: 'Interest Waiver', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: false, parentCode: 'DIRECT-EXPENSES', description: 'Interest waiver expenses' },
        { accountCode: 'PENALTY-WAIVER', accountName: 'Penalty Waiver', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: false, parentCode: 'DIRECT-EXPENSES', description: 'Penalty waiver expenses' },
        { accountCode: 'OPERATING-EXPENSES', accountName: 'Operating Expenses', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: true, parentCode: 'EXPENSES' },
        { accountCode: 'ADMIN-EXPENSES', accountName: 'Administrative Expenses', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: false, parentCode: 'OPERATING-EXPENSES', description: 'General administrative expenses' },
        { accountCode: 'CUSTOMER-REFUND', accountName: 'Customer Refund Account', accountType: AccountType.EXPENSE, rootType: RootType.EXPENSE, isGroup: false, parentCode: 'DIRECT-EXPENSES', description: 'Account for customer refunds' },

        // EQUITY
        { accountCode: 'EQUITY', accountName: 'Equity', accountType: AccountType.EQUITY, rootType: RootType.EQUITY, isGroup: true },
        { accountCode: 'CAPITAL', accountName: 'Capital', accountType: AccountType.EQUITY, rootType: RootType.EQUITY, isGroup: false, parentCode: 'EQUITY', description: 'Company capital' },
        { accountCode: 'RETAINED-EARNINGS', accountName: 'Retained Earnings', accountType: AccountType.EQUITY, rootType: RootType.EQUITY, isGroup: false, parentCode: 'EQUITY', description: 'Retained earnings' },
      ];

      // Create accounts in hierarchical order
      const accountMap = new Map<string, Account>();
      const rootAccounts: AccountSeedData[] = [];
      const childAccounts: AccountSeedData[] = [];

      // Separate root and child accounts
      accountsData.forEach((acc) => {
        if (!acc.parentCode) {
          rootAccounts.push(acc);
        } else {
          childAccounts.push(acc);
        }
      });

      // Create root accounts first
      for (const accData of rootAccounts) {
        const account = this.accountRepository.create({
          accountCode: accData.accountCode,
          accountName: accData.accountName,
          accountType: accData.accountType,
          rootType: accData.rootType,
          isGroup: accData.isGroup,
          companyId: company.id,
          openingBalance: accData.openingBalance || 0,
          description: accData.description,
          level: 0,
          isActive: true,
          isFrozen: false,
          currency: 'USD',
        });

        const savedAccount = await this.accountRepository.save(account);
        accountMap.set(accData.accountCode, savedAccount);
        this.logger.log(`Created root account: ${accData.accountCode} - ${accData.accountName}`);
      }

      // Create child accounts (process by level)
      let remainingAccounts = [...childAccounts];
      let currentLevel = 1;

      while (remainingAccounts.length > 0) {
        const accountsToCreate = remainingAccounts.filter(
          (acc) => accountMap.has(acc.parentCode!),
        );

        if (accountsToCreate.length === 0) {
          this.logger.warn('Some accounts have invalid parent codes');
          break;
        }

        for (const accData of accountsToCreate) {
          const parentAccount = accountMap.get(accData.parentCode!);
          if (!parentAccount) {
            this.logger.warn(`Parent account not found: ${accData.parentCode}`);
            continue;
          }

          const account = this.accountRepository.create({
            accountCode: accData.accountCode,
            accountName: accData.accountName,
            accountType: accData.accountType,
            rootType: accData.rootType,
            isGroup: accData.isGroup,
            parentAccountId: parentAccount.id,
            companyId: company.id,
            openingBalance: accData.openingBalance || 0,
            description: accData.description,
            level: currentLevel,
            isActive: true,
            isFrozen: false,
            currency: 'USD',
          });

          const savedAccount = await this.accountRepository.save(account);
          accountMap.set(accData.accountCode, savedAccount);
          this.logger.log(
            `Created account: ${accData.accountCode} - ${accData.accountName} (Level ${currentLevel})`,
          );
        }

        remainingAccounts = remainingAccounts.filter(
          (acc) => !accountMap.has(acc.accountCode),
        );
        currentLevel++;
      }

      this.logger.log(
        `Chart of Accounts seeded successfully for company: ${company.name} (${company.id})`,
      );
      this.logger.log(`Total accounts created: ${accountMap.size}`);
    } catch (error) {
      this.logger.error('Error seeding Chart of Accounts:', error);
      throw error;
    }
  }
}

