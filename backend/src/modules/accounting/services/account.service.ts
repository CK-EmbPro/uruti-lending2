import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, DataSource } from 'typeorm';
import { Account, AccountType, RootType } from '../entities/account.entity';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from '../dto/create-account.dto';
import { Company } from '../../company/entities/company.entity';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new account
   */
  async create(createDto: CreateAccountDto): Promise<Account> {
    // Check if account code already exists for this company
    const existing = await this.accountRepository.findOne({
      where: {
        accountCode: createDto.accountCode,
        companyId: createDto.companyId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Account with code ${createDto.accountCode} already exists for this company`,
      );
    }

    // Validate parent account if provided
    let parentAccount: Account | null = null;
    let level = 0;

    if (createDto.parentAccountId) {
      parentAccount = await this.accountRepository.findOne({
        where: { id: createDto.parentAccountId },
      });

      if (!parentAccount) {
        throw new NotFoundException(
          `Parent account with ID ${createDto.parentAccountId} not found`,
        );
      }

      if (parentAccount.companyId !== createDto.companyId) {
        throw new BadRequestException(
          'Parent account must belong to the same company',
        );
      }

      if (!parentAccount.isGroup) {
        throw new BadRequestException(
          'Parent account must be a group account',
        );
      }

      if (parentAccount.accountType !== createDto.accountType) {
        throw new BadRequestException(
          'Account type must match parent account type',
        );
      }

      level = parentAccount.level + 1;
    }

    // Validate root type matches account type
    if (this.getRootTypeFromAccountType(createDto.accountType) !== createDto.rootType) {
      throw new BadRequestException(
        'Root type must match account type category',
      );
    }

    const account = this.accountRepository.create({
      ...createDto,
      parentAccountId: createDto.parentAccountId || null,
      level,
      isGroup: createDto.isGroup ?? false,
      openingBalance: createDto.openingBalance ?? 0,
      currency: createDto.currency || 'USD',
      isActive: true,
      isFrozen: false,
    });

    const savedAccount = await this.accountRepository.save(account);
    this.logger.log(`Account created: ${savedAccount.accountCode} - ${savedAccount.accountName}`);

    return savedAccount;
  }

  /**
   * Find account by code and company
   */
  async findByCode(accountCode: string, companyId: string): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: {
        accountCode,
        companyId,
        isActive: true,
        isFrozen: false,
      },
    });
  }

  /**
   * Find or create account intelligently based on transaction context
   */
  async findOrCreateAccount(
    accountCode: string,
    accountName: string,
    accountType: AccountType,
    companyId: string,
    options?: {
      parentAccountCode?: string;
      description?: string;
      isGroup?: boolean;
    },
  ): Promise<Account> {
    // First, try to find existing account
    let account = await this.findByCode(accountCode, companyId);

    if (account) {
      return account;
    }

    // Account doesn't exist, create it intelligently
    this.logger.log(
      `Account ${accountCode} not found, creating automatically for company ${companyId}`,
    );

    // Determine parent account if provided
    let parentAccountId: string | undefined;
    if (options?.parentAccountCode) {
      const parent = await this.findByCode(options.parentAccountCode, companyId);
      if (parent) {
        parentAccountId = parent.id;
      }
    }

    // Determine root type from account type
    const rootType = this.getRootTypeFromAccountType(accountType);

    const createDto: CreateAccountDto = {
      accountCode,
      accountName,
      accountType,
      rootType,
      companyId,
      parentAccountId,
      isGroup: options?.isGroup ?? false,
      description: options?.description,
    };

    return await this.create(createDto);
  }

  /**
   * Get root type from account type
   */
  private getRootTypeFromAccountType(accountType: AccountType): RootType {
    const mapping: Record<AccountType, RootType> = {
      [AccountType.ASSET]: RootType.ASSET,
      [AccountType.LIABILITY]: RootType.LIABILITY,
      [AccountType.INCOME]: RootType.INCOME,
      [AccountType.EXPENSE]: RootType.EXPENSE,
      [AccountType.EQUITY]: RootType.EQUITY,
    };
    return mapping[accountType];
  }

  /**
   * Validate account exists and is usable
   */
  async validateAccount(
    accountCode: string,
    companyId: string,
    accountType?: AccountType,
  ): Promise<Account> {
    const account = await this.findByCode(accountCode, companyId);

    if (!account) {
      throw new NotFoundException(
        `Account with code ${accountCode} not found for company ${companyId}`,
      );
    }

    if (!account.isActive) {
      throw new BadRequestException(
        `Account ${accountCode} is not active`,
      );
    }

    if (account.isFrozen) {
      throw new BadRequestException(
        `Account ${accountCode} is frozen and cannot be used`,
      );
    }

    if (account.isGroup) {
      throw new BadRequestException(
        `Account ${accountCode} is a group account and cannot be used in transactions`,
      );
    }

    if (accountType && account.accountType !== accountType) {
      throw new BadRequestException(
        `Account ${accountCode} is of type ${account.accountType}, expected ${accountType}`,
      );
    }

    return account;
  }

  /**
   * Get all accounts with optional filters
   */
  async findAll(filters?: QueryAccountsDto): Promise<Account[]> {
    // Resolve companyId - if invalid or default, try to get default company
    let companyId = filters?.companyId;
    if (!companyId || companyId === 'default-company-id') {
      const companyRepository = this.dataSource.getRepository(Company);
      const defaultCompany = await companyRepository.findOne({
        where: { code: 'URUTI' },
      });
      if (defaultCompany) {
        companyId = defaultCompany.id;
      } else if (!companyId || companyId === 'default-company-id') {
        // If no default company found, return empty array
        return [];
      }
    }

    const queryBuilder = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.parentAccount', 'parentAccount')
      .orderBy('account.rootType', 'ASC')
      .addOrderBy('account.level', 'ASC')
      .addOrderBy('account.accountCode', 'ASC');

    if (companyId) {
      queryBuilder.andWhere('account.companyId = :companyId', {
        companyId,
      });
    }

    if (filters?.accountType) {
      queryBuilder.andWhere('account.accountType = :accountType', {
        accountType: filters.accountType,
      });
    }

    if (filters?.rootType) {
      queryBuilder.andWhere('account.rootType = :rootType', {
        rootType: filters.rootType,
      });
    }

    if (filters?.isGroup !== undefined) {
      queryBuilder.andWhere('account.isGroup = :isGroup', {
        isGroup: filters.isGroup,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('account.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.parentAccountId) {
      queryBuilder.andWhere('account.parentAccountId = :parentAccountId', {
        parentAccountId: filters.parentAccountId,
      });
    } else if (filters?.parentAccountId === null) {
      queryBuilder.andWhere('account.parentAccountId IS NULL');
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get account tree (hierarchical structure)
   */
  async getAccountTree(companyId: string, rootType?: RootType): Promise<Account[]> {
    // Resolve companyId - if invalid or default, try to get default company
    let resolvedCompanyId = companyId;
    if (!companyId || companyId === 'default-company-id') {
      const companyRepository = this.dataSource.getRepository(Company);
      const defaultCompany = await companyRepository.findOne({
        where: { code: 'URUTI' },
      });
      if (defaultCompany) {
        resolvedCompanyId = defaultCompany.id;
      } else if (!companyId || companyId === 'default-company-id') {
        // If no default company found, return empty array
        return [];
      }
    }

    const queryBuilder = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.childAccounts', 'childAccounts')
      .where('account.companyId = :companyId', { companyId: resolvedCompanyId })
      .andWhere('account.parentAccountId IS NULL')
      .orderBy('account.rootType', 'ASC')
      .addOrderBy('account.accountCode', 'ASC');

    if (rootType) {
      queryBuilder.andWhere('account.rootType = :rootType', { rootType });
    }

    const rootAccounts = await queryBuilder.getMany();

    // Recursively load children
    const loadChildren = async (account: Account): Promise<Account> => {
      const children = await this.accountRepository.find({
        where: { parentAccountId: account.id },
        order: { accountCode: 'ASC' },
      });

      account.childAccounts = await Promise.all(
        children.map((child) => loadChildren(child)),
      );

      return account;
    };

    return await Promise.all(rootAccounts.map((account) => loadChildren(account)));
  }

  /**
   * Get account by ID
   */
  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['parentAccount', 'childAccounts'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  /**
   * Update account
   */
  async update(id: string, updateDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    Object.assign(account, updateDto);

    return await this.accountRepository.save(account);
  }

  /**
   * Delete account (soft delete by setting isActive = false)
   */
  async delete(id: string): Promise<void> {
    const account = await this.findOne(id);

    // Check if account has children
    const children = await this.accountRepository.find({
      where: { parentAccountId: id },
    });

    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete account with child accounts. Delete or move children first.',
      );
    }

    // Check if account is used in GL entries (basic check)
    // In production, you might want to check actual GL entry usage
    // For now, we'll just deactivate it
    account.isActive = false;
    await this.accountRepository.save(account);

    this.logger.log(`Account deactivated: ${account.accountCode}`);
  }

  /**
   * Get account balance (calculated from GL entries)
   * This would need integration with GL entry service
   */
  async getAccountBalance(
    accountId: string,
    asOfDate?: Date,
  ): Promise<{ debit: number; credit: number; balance: number }> {
    // This is a placeholder - would need to query GL entries
    // For now, return opening balance
    const account = await this.findOne(accountId);

    // TODO: Calculate from GL entries
    const balance = account.openingBalance;

    return {
      debit: 0,
      credit: 0,
      balance,
    };
  }
}

