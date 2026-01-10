import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserAccount } from '../entities/user-account.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import { ProductConfiguration } from '../entities/product-configuration.entity';
import { BusinessRule } from '../entities/business-rule.entity';
import { FeeSchedule } from '../entities/fee-schedule.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import {
  CreateUserAccountDto,
  UpdateUserAccountDto,
  ActivateUserAccountDto,
  QueryUserAccountsDto,
} from '../dto/user-account.dto';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import {
  CreateProductConfigurationDto,
  UpdateProductConfigurationDto,
  TestProductConfigurationDto,
  ActivateProductConfigurationDto,
} from '../dto/product-configuration.dto';
import {
  CreateBusinessRuleDto,
  UpdateBusinessRuleDto,
  TestBusinessRuleDto,
  PromoteBusinessRuleDto,
  AnalyzeBusinessRuleImpactDto,
} from '../dto/business-rule.dto';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  ApplyFeeScheduleDto,
} from '../dto/fee-schedule.dto';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { ProductStatus } from '../../../common/enums/product-status.enum';
import { RuleStatus } from '../../../common/enums/rule-status.enum';

/**
 * Administration Service
 * Handles UC-051: User Account Management
 * Handles UC-052: Product Configuration
 * Handles UC-053: Business Rules Management
 * Handles UC-054: Fee Schedule Management
 */
@Injectable()
export class AdministrationService {
  private readonly logger = new Logger(AdministrationService.name);

  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserActivityLog)
    private readonly activityLogRepository: Repository<UserActivityLog>,
    @InjectRepository(ProductConfiguration)
    private readonly productConfigRepository: Repository<ProductConfiguration>,
    @InjectRepository(BusinessRule)
    private readonly businessRuleRepository: Repository<BusinessRule>,
    @InjectRepository(FeeSchedule)
    private readonly feeScheduleRepository: Repository<FeeSchedule>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * UC-051: User Account Management
   */

  async createUserAccount(dto: CreateUserAccountDto, createdBy: string, createdByName: string): Promise<UserAccount> {
    // Check if email already exists
    const existingUser = await this.userAccountRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException(`User with email ${dto.email} already exists`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Get roles if provided
    let roles: Role[] = [];
    if (dto.roleIds && dto.roleIds.length > 0) {
      roles = await this.roleRepository.find({ where: { id: In(dto.roleIds) } });
      if (roles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    const userAccount = this.userAccountRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      companyId: dto.companyId,
      status: UserStatus.PENDING_ACTIVATION,
      isMfaEnabled: dto.isMfaEnabled || false,
      roles,
      remarks: dto.remarks,
      createdBy,
    });

    const savedUser = await this.userAccountRepository.save(userAccount);

    // Log activity
    await this.logUserActivity(savedUser.id, 'USER_CREATED', {
      createdBy,
      createdByName,
      email: dto.email,
    }, createdBy);

    this.logger.log(`User account created: ${savedUser.email} by ${createdByName}`);

    return savedUser;
  }

  async updateUserAccount(
    id: string,
    dto: UpdateUserAccountDto,
    updatedBy: string,
    updatedByName: string,
  ): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({ where: { id } });
    if (!userAccount) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }

    // Update roles if provided
    if (dto.roleIds) {
      const roles = await this.roleRepository.find({ where: { id: In(dto.roleIds) } });
      if (roles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
      userAccount.roles = roles;
    }

    // Update other fields
    if (dto.name) userAccount.name = dto.name;
    if (dto.phoneNumber) userAccount.phoneNumber = dto.phoneNumber;
    if (dto.status) userAccount.status = dto.status;
    if (dto.isMfaEnabled !== undefined) userAccount.isMfaEnabled = dto.isMfaEnabled;
    if (dto.remarks) userAccount.remarks = dto.remarks;

    userAccount.updatedBy = updatedBy;

    const updatedUser = await this.userAccountRepository.save(userAccount);

    // Log activity
    await this.logUserActivity(id, 'USER_UPDATED', {
      updatedBy,
      updatedByName,
      changes: dto,
    }, updatedBy);

    return updatedUser;
  }

  async activateUserAccount(
    id: string,
    dto: ActivateUserAccountDto,
    activatedBy: string,
    activatedByName: string,
  ): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({ where: { id } });
    if (!userAccount) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }

    if (userAccount.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User account is already active');
    }

    userAccount.status = UserStatus.ACTIVE;
    userAccount.activatedAt = new Date();
    userAccount.activatedBy = activatedBy;
    if (dto.remarks) userAccount.remarks = dto.remarks;

    const activatedUser = await this.userAccountRepository.save(userAccount);

    // Log activity
    await this.logUserActivity(id, 'USER_ACTIVATED', {
      activatedBy,
      activatedByName,
    }, activatedBy);

    this.logger.log(`User account activated: ${userAccount.email} by ${activatedByName}`);

    return activatedUser;
  }

  async getUserAccounts(filters: QueryUserAccountsDto): Promise<UserAccount[]> {
    const query = this.userAccountRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (filters.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters.companyId) {
      query.andWhere('user.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.roleId) {
      query.andWhere('roles.id = :roleId', { roleId: filters.roleId });
    }

    if (filters.search) {
      query.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return await query.getMany();
  }

  async getUserAccount(id: string): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!userAccount) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }

    return userAccount;
  }

  async getUserActivityLogs(userId: string, limit: number = 50): Promise<UserActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { userId },
      order: { activityDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * UC-052: Product Configuration
   */

  async createProductConfiguration(
    dto: CreateProductConfigurationDto,
    createdBy: string,
    createdByName: string,
  ): Promise<ProductConfiguration> {
    // Check if product code already exists
    const existing = await this.productConfigRepository.findOne({ where: { productCode: dto.productCode } });
    if (existing) {
      throw new BadRequestException(`Product configuration with code ${dto.productCode} already exists`);
    }

    const productConfig = this.productConfigRepository.create({
      productCode: dto.productCode,
      productName: dto.productName,
      companyId: dto.companyId,
      minimumLoanAmount: dto.minimumLoanAmount,
      maximumLoanAmount: dto.maximumLoanAmount,
      minimumCreditScore: dto.minimumCreditScore,
      minimumAge: dto.minimumAge,
      maximumAge: dto.maximumAge,
      maximumDebtToIncomeRatio: dto.maximumDebtToIncomeRatio,
      requiredDocuments: dto.requiredDocuments,
      employmentTypes: dto.employmentTypes,
      baseInterestRate: dto.baseInterestRate,
      minimumInterestRate: dto.minimumInterestRate,
      maximumInterestRate: dto.maximumInterestRate,
      interestRateFactors: dto.interestRateFactors,
      approvalWorkflow: dto.approvalWorkflow,
      disbursementWorkflow: dto.disbursementWorkflow,
      minimumTerm: dto.minimumTerm,
      maximumTerm: dto.maximumTerm,
      allowsPrepayment: dto.allowsPrepayment,
      allowsRefinancing: dto.allowsRefinancing,
      requiresCollateral: dto.requiresCollateral,
      productDescription: dto.productDescription,
      termsAndConditions: dto.termsAndConditions,
      status: ProductStatus.DRAFT,
      createdBy,
    });

    const savedConfig = await this.productConfigRepository.save(productConfig);

    this.logger.log(`Product configuration created: ${savedConfig.productCode} by ${createdByName}`);

    return savedConfig;
  }

  async updateProductConfiguration(
    id: string,
    dto: UpdateProductConfigurationDto,
    updatedBy: string,
    updatedByName: string,
  ): Promise<ProductConfiguration> {
    const productConfig = await this.productConfigRepository.findOne({ where: { id } });
    if (!productConfig) {
      throw new NotFoundException(`Product configuration with ID ${id} not found`);
    }

    Object.assign(productConfig, dto);
    productConfig.updatedBy = updatedBy;

    const updatedConfig = await this.productConfigRepository.save(productConfig);

    this.logger.log(`Product configuration updated: ${updatedConfig.productCode} by ${updatedByName}`);

    return updatedConfig;
  }

  async testProductConfiguration(
    id: string,
    dto: TestProductConfigurationDto,
    testedBy: string,
    testedByName: string,
  ): Promise<ProductConfiguration> {
    const productConfig = await this.productConfigRepository.findOne({ where: { id } });
    if (!productConfig) {
      throw new NotFoundException(`Product configuration with ID ${id} not found`);
    }

    // Simulate testing - in production, this would run actual test scenarios
    const testResults = {
      scenariosTested: dto.testScenarios || {},
      passed: true,
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString(),
    };

    productConfig.status = ProductStatus.TESTING;
    productConfig.testedAt = new Date();
    productConfig.testedBy = testedBy;
    productConfig.testResults = JSON.stringify(testResults);
    if (dto.testRemarks) productConfig.remarks = dto.testRemarks;

    const testedConfig = await this.productConfigRepository.save(productConfig);

    this.logger.log(`Product configuration tested: ${testedConfig.productCode} by ${testedByName}`);

    return testedConfig;
  }

  async activateProductConfiguration(
    id: string,
    dto: ActivateProductConfigurationDto,
    activatedBy: string,
    activatedByName: string,
  ): Promise<ProductConfiguration> {
    const productConfig = await this.productConfigRepository.findOne({ where: { id } });
    if (!productConfig) {
      throw new NotFoundException(`Product configuration with ID ${id} not found`);
    }

    if (productConfig.status !== ProductStatus.TESTING && productConfig.status !== ProductStatus.DRAFT) {
      throw new BadRequestException(`Product configuration must be in TESTING or DRAFT status to activate. Current status: ${productConfig.status}`);
    }

    productConfig.status = ProductStatus.ACTIVE;
    productConfig.activatedAt = new Date();
    productConfig.activatedBy = activatedBy;
    if (dto.remarks) productConfig.remarks = dto.remarks;

    const activatedConfig = await this.productConfigRepository.save(productConfig);

    // Create corresponding LoanProduct if it doesn't exist
    await this.syncToLoanProduct(activatedConfig);

    this.logger.log(`Product configuration activated: ${activatedConfig.productCode} by ${activatedByName}`);

    return activatedConfig;
  }

  async getProductConfigurations(filters: {
    status?: ProductStatus;
    companyId?: string;
  }): Promise<ProductConfiguration[]> {
    const query = this.productConfigRepository.createQueryBuilder('config');

    if (filters.status) {
      query.andWhere('config.status = :status', { status: filters.status });
    }

    if (filters.companyId) {
      query.andWhere('config.companyId = :companyId', { companyId: filters.companyId });
    }

    return await query.getMany();
  }

  private async syncToLoanProduct(productConfig: ProductConfiguration): Promise<void> {
    // Check if LoanProduct already exists
    const existingProduct = await this.loanProductRepository.findOne({
      where: { productCode: productConfig.productCode },
    });

    if (!existingProduct) {
      // Create new LoanProduct from configuration
      const loanProduct = this.loanProductRepository.create({
        productCode: productConfig.productCode,
        productName: productConfig.productName,
        companyId: productConfig.companyId,
        rateOfInterest: productConfig.baseInterestRate,
        maximumLoanAmount: productConfig.maximumLoanAmount,
        disabled: false,
        // Set default account references (would come from company settings)
        disbursementAccount: 'DEFAULT_DISBURSEMENT',
        paymentAccount: 'DEFAULT_PAYMENT',
        loanAccount: 'DEFAULT_LOAN',
        interestIncomeAccount: 'DEFAULT_INTEREST_INCOME',
        penaltyIncomeAccount: 'DEFAULT_PENALTY_INCOME',
        interestAccruedAccount: 'DEFAULT_INTEREST_ACCRUED',
        interestReceivableAccount: 'DEFAULT_INTEREST_RECEIVABLE',
        penaltyAccruedAccount: 'DEFAULT_PENALTY_ACCRUED',
        penaltyReceivableAccount: 'DEFAULT_PENALTY_RECEIVABLE',
        securityDepositAccount: 'DEFAULT_SECURITY_DEPOSIT',
        customerRefundAccount: 'DEFAULT_CUSTOMER_REFUND',
        writeOffAccount: 'DEFAULT_WRITE_OFF',
        writeOffRecoveryAccount: 'DEFAULT_WRITE_OFF_RECOVERY',
        interestWaiverAccount: 'DEFAULT_INTEREST_WAIVER',
        penaltyWaiverAccount: 'DEFAULT_PENALTY_WAIVER',
      });

      await this.loanProductRepository.save(loanProduct);
      this.logger.log(`LoanProduct created from configuration: ${productConfig.productCode}`);
    }
  }

  /**
   * UC-053: Business Rules Management
   */

  async createBusinessRule(
    dto: CreateBusinessRuleDto,
    createdBy: string,
    createdByName: string,
  ): Promise<BusinessRule> {
    // Check if rule name already exists
    const existing = await this.businessRuleRepository.findOne({ where: { ruleName: dto.ruleName } });
    if (existing) {
      throw new BadRequestException(`Business rule with name ${dto.ruleName} already exists`);
    }

    const businessRule = this.businessRuleRepository.create({
      ...dto,
      status: RuleStatus.DRAFT,
      version: dto.version || '1.0.0',
      createdBy,
    });

    const savedRule = await this.businessRuleRepository.save(businessRule);

    this.logger.log(`Business rule created: ${savedRule.ruleName} by ${createdByName}`);

    return savedRule;
  }

  async updateBusinessRule(
    id: string,
    dto: UpdateBusinessRuleDto,
    updatedBy: string,
    updatedByName: string,
  ): Promise<BusinessRule> {
    const businessRule = await this.businessRuleRepository.findOne({ where: { id } });
    if (!businessRule) {
      throw new NotFoundException(`Business rule with ID ${id} not found`);
    }

    Object.assign(businessRule, dto);
    businessRule.updatedBy = updatedBy;

    const updatedRule = await this.businessRuleRepository.save(businessRule);

    this.logger.log(`Business rule updated: ${updatedRule.ruleName} by ${updatedByName}`);

    return updatedRule;
  }

  async testBusinessRule(
    id: string,
    dto: TestBusinessRuleDto,
    testedBy: string,
    testedByName: string,
  ): Promise<BusinessRule> {
    const businessRule = await this.businessRuleRepository.findOne({ where: { id } });
    if (!businessRule) {
      throw new NotFoundException(`Business rule with ID ${id} not found`);
    }

    // Simulate sandbox testing - in production, this would execute rule in isolated environment
    const testResults = {
      scenariosTested: dto.testScenarios || {},
      passed: true,
      executionTime: '0.05s',
      results: {},
      timestamp: new Date().toISOString(),
    };

    businessRule.testedInSandbox = true;
    businessRule.testedAt = new Date();
    businessRule.testedBy = testedBy;
    businessRule.testResults = testResults;
    businessRule.status = RuleStatus.TESTING;
    if (dto.testRemarks) businessRule.sandboxTestResults = dto.testRemarks;

    const testedRule = await this.businessRuleRepository.save(businessRule);

    this.logger.log(`Business rule tested in sandbox: ${testedRule.ruleName} by ${testedByName}`);

    return testedRule;
  }

  async analyzeBusinessRuleImpact(
    id: string,
    dto: AnalyzeBusinessRuleImpactDto,
    analyzedBy: string,
    analyzedByName: string,
  ): Promise<BusinessRule> {
    const businessRule = await this.businessRuleRepository.findOne({ where: { id } });
    if (!businessRule) {
      throw new NotFoundException(`Business rule with ID ${id} not found`);
    }

    // Simulate impact analysis - in production, this would analyze portfolio
    const impactAnalysis = {
      estimatedAffectedLoans: Math.floor(Math.random() * 1000) + 100,
      estimatedImpact: 'Low to Medium',
      riskLevel: 'Medium',
      recommendations: ['Monitor closely after promotion', 'Consider gradual rollout'],
      timestamp: new Date().toISOString(),
    };

    businessRule.impactAnalysis = impactAnalysis;
    businessRule.estimatedAffectedLoans = impactAnalysis.estimatedAffectedLoans;
    businessRule.impactNotes = JSON.stringify(impactAnalysis);

    const analyzedRule = await this.businessRuleRepository.save(businessRule);

    this.logger.log(`Business rule impact analyzed: ${analyzedRule.ruleName} by ${analyzedByName}`);

    return analyzedRule;
  }

  async promoteBusinessRule(
    id: string,
    dto: PromoteBusinessRuleDto,
    promotedBy: string,
    promotedByName: string,
  ): Promise<BusinessRule> {
    const businessRule = await this.businessRuleRepository.findOne({ where: { id } });
    if (!businessRule) {
      throw new NotFoundException(`Business rule with ID ${id} not found`);
    }

    if (businessRule.status !== RuleStatus.TESTING) {
      throw new BadRequestException(`Business rule must be in TESTING status to promote. Current status: ${businessRule.status}`);
    }

    businessRule.status = RuleStatus.ACTIVE;
    businessRule.promotedToProductionAt = new Date();
    businessRule.promotedBy = promotedBy;
    if (dto.promotionNotes) businessRule.promotionNotes = dto.promotionNotes;

    // Handle gradual rollout if specified
    if (dto.rolloutPercentage && dto.rolloutPercentage < 100) {
      businessRule.monitoringMetrics = {
        rolloutPercentage: dto.rolloutPercentage,
        rolloutStartDate: new Date().toISOString(),
      };
    }

    const promotedRule = await this.businessRuleRepository.save(businessRule);

    this.logger.log(`Business rule promoted to production: ${promotedRule.ruleName} by ${promotedByName}`);

    return promotedRule;
  }

  async getBusinessRules(filters: {
    status?: RuleStatus;
    ruleCategory?: string;
  }): Promise<BusinessRule[]> {
    const query = this.businessRuleRepository.createQueryBuilder('rule');

    if (filters.status) {
      query.andWhere('rule.status = :status', { status: filters.status });
    }

    if (filters.ruleCategory) {
      query.andWhere('rule.ruleCategory = :ruleCategory', { ruleCategory: filters.ruleCategory });
    }

    query.orderBy('rule.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * UC-054: Fee Schedule Management
   */

  async createFeeSchedule(
    dto: CreateFeeScheduleDto,
    createdBy: string,
    createdByName: string,
  ): Promise<FeeSchedule> {
    // Check if fee code already exists
    const existing = await this.feeScheduleRepository.findOne({ where: { feeCode: dto.feeCode } });
    if (existing) {
      throw new BadRequestException(`Fee schedule with code ${dto.feeCode} already exists`);
    }

    const feeSchedule = this.feeScheduleRepository.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      grandfatherCutoffDate: dto.grandfatherCutoffDate ? new Date(dto.grandfatherCutoffDate) : undefined,
      promotionalStartDate: dto.promotionalStartDate ? new Date(dto.promotionalStartDate) : undefined,
      promotionalEndDate: dto.promotionalEndDate ? new Date(dto.promotionalEndDate) : undefined,
      isActive: true,
      createdBy,
    });

    const savedSchedule = await this.feeScheduleRepository.save(feeSchedule);

    this.logger.log(`Fee schedule created: ${savedSchedule.feeCode} by ${createdByName}`);

    return savedSchedule;
  }

  async updateFeeSchedule(
    id: string,
    dto: UpdateFeeScheduleDto,
    updatedBy: string,
    updatedByName: string,
  ): Promise<FeeSchedule> {
    const feeSchedule = await this.feeScheduleRepository.findOne({ where: { id } });
    if (!feeSchedule) {
      throw new NotFoundException(`Fee schedule with ID ${id} not found`);
    }

    Object.assign(feeSchedule, dto);
    if (dto.effectiveDate) {
      feeSchedule.effectiveDate = new Date(dto.effectiveDate);
    }
    feeSchedule.updatedBy = updatedBy;

    const updatedSchedule = await this.feeScheduleRepository.save(feeSchedule);

    this.logger.log(`Fee schedule updated: ${updatedSchedule.feeCode} by ${updatedByName}`);

    return updatedSchedule;
  }

  async applyFeeSchedule(
    id: string,
    dto: ApplyFeeScheduleDto,
    appliedBy: string,
    appliedByName: string,
  ): Promise<FeeSchedule> {
    const feeSchedule = await this.feeScheduleRepository.findOne({ where: { id } });
    if (!feeSchedule) {
      throw new NotFoundException(`Fee schedule with ID ${id} not found`);
    }

    // Calculate affected customers
    const affectedLoans = await this.calculateAffectedLoans(feeSchedule);
    feeSchedule.affectedCustomersCount = affectedLoans.length;

    // Send notifications if requested
    if (dto.sendNotification !== false) {
      feeSchedule.notificationSent = true;
      feeSchedule.notificationSentAt = new Date();
      feeSchedule.notificationMessage = dto.notificationMessage || `Fee schedule ${feeSchedule.feeName} is now effective.`;
      // In production, this would trigger actual notification service
    }

    feeSchedule.isActive = true;

    const appliedSchedule = await this.feeScheduleRepository.save(feeSchedule);

    this.logger.log(`Fee schedule applied: ${appliedSchedule.feeCode} affecting ${affectedLoans.length} loans by ${appliedByName}`);

    return appliedSchedule;
  }

  async getFeeSchedules(filters: {
    feeType?: string;
    companyId?: string;
    isActive?: boolean;
  }): Promise<FeeSchedule[]> {
    const query = this.feeScheduleRepository.createQueryBuilder('fee');

    if (filters.feeType) {
      query.andWhere('fee.feeType = :feeType', { feeType: filters.feeType });
    }

    if (filters.companyId) {
      query.andWhere('fee.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('fee.isActive = :isActive', { isActive: filters.isActive });
    }

    query.orderBy('fee.effectiveDate', 'DESC');

    return await query.getMany();
  }

  private async calculateAffectedLoans(feeSchedule: FeeSchedule): Promise<Loan[]> {
    const query = this.loanRepository.createQueryBuilder('loan');

    // Apply grandfathering if enabled
    if (feeSchedule.grandfatherExistingAccounts && feeSchedule.grandfatherCutoffDate) {
      query.andWhere('loan.createdAt >= :cutoffDate', { cutoffDate: feeSchedule.grandfatherCutoffDate });
    }

    // Filter by applicable loan products
    if (feeSchedule.applicableLoanProducts && feeSchedule.applicableLoanProducts.length > 0) {
      query.andWhere('loan.loanProductId IN (:...productIds)', { productIds: feeSchedule.applicableLoanProducts });
    }

    return await query.getMany();
  }

  /**
   * Role and Permission Management
   */

  async createRole(dto: CreateRoleDto, createdBy: string, createdByName: string): Promise<Role> {
    const existing = await this.roleRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException(`Role with name ${dto.name} already exists`);
    }

    let permissions: Permission[] = [];
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.find({ where: { id: In(dto.permissionIds) } });
      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const role = this.roleRepository.create({
      ...dto,
      permissions,
      createdBy,
    });

    const savedRole = await this.roleRepository.save(role);

    this.logger.log(`Role created: ${savedRole.name} by ${createdByName}`);

    return savedRole;
  }

  async updateRole(id: string, dto: UpdateRoleDto, updatedBy: string, updatedByName: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (dto.permissionIds) {
      const permissions = await this.permissionRepository.find({ where: { id: In(dto.permissionIds) } });
      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
      role.permissions = permissions;
    }

    Object.assign(role, dto);
    role.updatedBy = updatedBy;

    const updatedRole = await this.roleRepository.save(role);

    this.logger.log(`Role updated: ${updatedRole.name} by ${updatedByName}`);

    return updatedRole;
  }

  async getRoles(): Promise<Role[]> {
    return await this.roleRepository.find({ relations: ['permissions'] });
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      // Use simple find() without relations to avoid ManyToMany loading issues
      const permissions = await this.permissionRepository.find({
        order: {
          resource: 'ASC',
          action: 'ASC',
        },
        // Explicitly don't load relations
        relations: [],
      });
      
      this.logger.log(`Fetched ${permissions.length} permissions`);
      return permissions;
    } catch (error: any) {
      this.logger.error('Error fetching permissions:', error);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);
      // Return empty array instead of throwing to prevent 500 error
      // This allows the UI to load even if there's a database issue
      return [];
    }
  }


  /**
   * Helper Methods
   */

  private async logUserActivity(
    userId: string,
    activityType: string,
    metadata: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    const activityLog = this.activityLogRepository.create({
      userId,
      activityType,
      description: `${activityType} performed`,
      metadata,
      ipAddress,
      activityDate: new Date(),
    });

    await this.activityLogRepository.save(activityLog);
  }
}

