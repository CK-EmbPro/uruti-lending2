import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanApplication, ApplicationStatus } from './entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanApplicationDto } from './dto/update-loan-application.dto';
import { CreateLoanDto } from '../loan/dto/create-loan.dto';
import { LoanService } from '../loan/loan.service';
import { WorkflowIntegrationService } from '../workflow/workflow-integration.service';
import { LoanApplicationWorkflowService } from './loan-application-workflow.service';
import { LoanNotificationHelperService } from '../notification/services/loan-notification-helper.service';
import { IntegrationService } from '../integration/services/integration.service';
import { WeightedCreditScoringService } from '../credit-scoring-engine/services/weighted-credit-scoring.service';

@Injectable()
export class LoanApplicationService {
  private readonly logger = new Logger(LoanApplicationService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    private readonly workflowIntegrationService: WorkflowIntegrationService,
    private readonly workflowService: LoanApplicationWorkflowService,
    private readonly notificationHelper: LoanNotificationHelperService,
    @Inject(forwardRef(() => IntegrationService))
    private readonly integrationService: IntegrationService,
    private readonly weightedScoringService: WeightedCreditScoringService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async create(createDto: CreateLoanApplicationDto, companyId: string): Promise<LoanApplication> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Validate loan product exists and belongs to company
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: createDto.loanProductId, companyId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${createDto.loanProductId} not found or does not belong to your company`,
      );
    }

    // Verify companyId matches
    if (createDto.companyId && createDto.companyId !== companyId) {
      throw new BadRequestException(
        'Cannot create application for a different company',
      );
    }

    // Validate requested amount
    if (
      loanProduct.maximumLoanAmount &&
      createDto.requestedAmount > loanProduct.maximumLoanAmount
    ) {
      throw new BadRequestException(
        `Requested amount exceeds maximum loan amount of ${loanProduct.maximumLoanAmount}`,
      );
    }

    // Generate application number
    const applicationNumber = await this.generateApplicationNumber();

    const application = this.applicationRepository.create({
      ...createDto,
      companyId, // Ensure companyId is set from authenticated user
      applicationNumber,
      applicationDate: createDto.applicationDate
        ? new Date(createDto.applicationDate)
        : new Date(),
      status: createDto.status || ApplicationStatus.DRAFT,
    });

    return await this.applicationRepository.save(application);
  }

  // async findAll(
  //   companyId: string,
  //   filters?: {
  //     status?: string;
  //     applicantType?: string;
  //     applicantId?: string;
  //     loanProductId?: string;
  //     minAmount?: number;
  //     maxAmount?: number;
  //     fromDate?: string;
  //     toDate?: string;
  //     search?: string;
  //     sortBy?: string;
  //     sortOrder?: 'ASC' | 'DESC';
  //     page?: number;
  //     limit?: number;
  //   },
  // ): Promise<{
  //   data: LoanApplication[]
  //   ; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean
  // }> {
  //   if (!companyId) {
  //     throw new BadRequestException('Company ID is required');
  //   }

  //   const queryBuilder = this.applicationRepository.createQueryBuilder('application');


  //   // if (filters?.applicantType) {
  //   //   queryBuilder.andWhere('application.applicantType = :applicantType', {
  //   //     applicantType: filters.applicantType,
  //   //   });
  //   // }

  //   // if (filters?.applicantId) {
  //   //   queryBuilder.andWhere('application.applicantId = :applicantId', {
  //   //     applicantId: filters.applicantId,
  //   //   });
  //   // }

  //   // if (filters?.loanProductId) {
  //   //   queryBuilder.andWhere('application.loanProductId = :loanProductId', {
  //   //     loanProductId: filters.loanProductId,
  //   //   });
  //   // }

  //   // if (filters?.minAmount !== undefined) {
  //   //   queryBuilder.andWhere('application.requestedAmount >= :minAmount', {
  //   //     minAmount: filters.minAmount,
  //   //   });
  //   // }

  //   // if (filters?.maxAmount !== undefined) {
  //   //   queryBuilder.andWhere('application.requestedAmount <= :maxAmount', {
  //   //     maxAmount: filters.maxAmount,
  //   //   });
  //   // }

  //   // if (filters?.fromDate) {
  //   //   queryBuilder.andWhere('application.applicationDate >= :fromDate', {
  //   //     fromDate: new Date(filters.fromDate),
  //   //   });
  //   // }

  //   // if (filters?.toDate) {
  //   //   queryBuilder.andWhere('application.applicationDate <= :toDate', {
  //   //     toDate: new Date(filters.toDate),
  //   //   });
  //   // }

  //   // if (filters?.search) {
  //   //   queryBuilder.andWhere(
  //   //     '(LOWER(application.applicationNumber) LIKE LOWER(:search) OR ' +
  //   //       'LOWER(application.applicantId) LIKE LOWER(:search) OR ' +
  //   //       'LOWER(COALESCE(application.remarks, \'\')) LIKE LOWER(:search))',
  //   //     { search: `%${filters.search}%` },
  //   //   );
  //   // }

  //   // // Apply sorting
  //   // const sortBy = filters?.sortBy || 'createdAt';
  //   // const sortOrder = filters?.sortOrder || 'DESC';
  //   // const allowedSortFields = ['createdAt', 'applicationDate', 'requestedAmount', 'status', 'applicationNumber'];
  //   // const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  //   // queryBuilder.orderBy(`application.${finalSortBy}`, sortOrder);

  //   // // Get total count before pagination
  //   // const total = await queryBuilder.getCount();

  //   // // Apply pagination
  //   // const page = filters?.page || 1;
  //   // const limit = filters?.limit || 20;
  //   // const skip = (page - 1) * limit;
  //   // queryBuilder.skip(skip).take(limit);

  //   // Execute query
  //   const data = await queryBuilder.getMany();
  //   const total = data.length; // Simplified for now since pagination is commented out
  //   const page = filters?.page || 1;
  //   const limit = filters?.limit || 20;
  //   const totalPages = Math.ceil(total / limit);

  //   return {
  //     data,
  //     total,
  //     page,
  //     limit,
  //     totalPages,
  //     hasNext: page < totalPages,
  //     hasPrevious: page > 1,
  //   };
  // }

  async findAll(
    companyId: string,
    filters?: {
      status?: string;
      applicantType?: string;
      applicantId?: string;
      loanProductId?: string;
      minAmount?: number;
      maxAmount?: number;
      fromDate?: string;
      toDate?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: LoanApplication[]
    ; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean
  }> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    // companyId ="ce501685-75b0-4893-9b51-debdf9471b7e"

    const queryBuilder = this.applicationRepository.createQueryBuilder('application');

    // Always filter by companyId for multi-tenancy
    queryBuilder.where('application.companyId = :companyId', { companyId });

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('application.status = :status', { status: filters.status });
    }

    if (filters?.applicantType) {
      queryBuilder.andWhere('application.applicantType = :applicantType', {
        applicantType: filters.applicantType,
      });
    }

    if (filters?.applicantId) {
      queryBuilder.andWhere('application.applicantId = :applicantId', {
        applicantId: filters.applicantId,
      });
    }

    if (filters?.loanProductId) {
      queryBuilder.andWhere('application.loanProductId = :loanProductId', {
        loanProductId: filters.loanProductId,
      });
    }

    if (filters?.minAmount !== undefined) {
      queryBuilder.andWhere('application.requestedAmount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters?.maxAmount !== undefined) {
      queryBuilder.andWhere('application.requestedAmount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    if (filters?.fromDate) {
      queryBuilder.andWhere('application.applicationDate >= :fromDate', {
        fromDate: new Date(filters.fromDate),
      });
    }

    if (filters?.toDate) {
      queryBuilder.andWhere('application.applicationDate <= :toDate', {
        toDate: new Date(filters.toDate),
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(application.applicationNumber) LIKE LOWER(:search) OR ' +
        'LOWER(application.applicantId) LIKE LOWER(:search) OR ' +
        'LOWER(COALESCE(application.remarks, \'\')) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    const allowedSortFields = ['createdAt', 'applicationDate', 'requestedAmount', 'status', 'applicationNumber'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`application.${finalSortBy}`, sortOrder);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async findOne(id: string, companyId: string): Promise<LoanApplication> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    this.logger.log("copmany id " + companyId)
    const application = await this.applicationRepository.findOne({
      where: { id, companyId }, // Enforce company isolation
    });
    if (!application) {
      throw new NotFoundException(
        `Loan application with ID ${id} not found or access denied`,
      );
    }
    return application;
  }

  async update(id: string, updateDto: UpdateLoanApplicationDto, companyId: string): Promise<LoanApplication> {
    const application = await this.findOne(id, companyId); // Verify company access

    // Only allow updates if in DRAFT status
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        `Application can only be updated in DRAFT status. Current status: ${application.status}`,
      );
    }

    // Prevent changing companyId
    if (updateDto.companyId && updateDto.companyId !== companyId) {
      throw new BadRequestException('Cannot change company ID');
    }

    Object.assign(application, updateDto);
    return await this.applicationRepository.save(application);
  }

  async approve(
    id: string,
    companyId: string,
    userId?: string,
    userRoles?: string[],
    comments?: string,
    autoCreateLoan: boolean = true,
  ): Promise<LoanApplication> {
    const application = await this.findOne(id, companyId); // Verify company access

    // Check if workflow is enabled
    const workflowEnabled =
      await this.workflowIntegrationService.isWorkflowEnabled(
        'Loan Application',
      );

    if (workflowEnabled && userId) {
      // Use workflow engine
      const result = await this.workflowIntegrationService.performWorkflowAction(
        'Loan Application',
        application.id,
        application.status,
        'Approve',
        userId,
        undefined,
        comments,
        userRoles,
      );
      application.status = result.newState as ApplicationStatus;
    } else {
      // Fallback: direct status update
      if (application.status !== ApplicationStatus.SUBMITTED && application.status !== ApplicationStatus.UNDER_REVIEW) {
        throw new BadRequestException(
          `Application can only be approved from SUBMITTED or UNDER_REVIEW status. Current status: ${application.status}`,
        );
      }
      application.status = ApplicationStatus.APPROVED;
    }

    application.approvalDate = new Date();
    application.approvedBy = userId || null;
    application.approvedAmount = application.approvedAmount || application.requestedAmount;

    // Use transaction to ensure atomicity of approval AND loan creation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedApplication: LoanApplication;
    let createdLoan: Loan | null = null;

    try {
      // Save the application within the transaction
      savedApplication = await queryRunner.manager.save(LoanApplication, application);
      this.logger.log(`Loan application ${id} approved successfully (within transaction)`);

      // Automatically create loan from approved application
      this.logger.log(`Checking auto-create loan: autoCreateLoan=${autoCreateLoan}, status=${savedApplication.status}, loanId=${savedApplication.loanId}`);
      if (autoCreateLoan && savedApplication.status === ApplicationStatus.APPROVED && !savedApplication.loanId) {
        // Create loan within the same transaction
        createdLoan = await this.createLoanFromApplicationTransactional(queryRunner, savedApplication, companyId);
        this.logger.log(
          `Loan ${createdLoan.loanNumber} automatically created from approved application ${savedApplication.applicationNumber}`,
        );
      }

      // Commit the transaction - both approval and loan creation succeeded
      await queryRunner.commitTransaction();
      this.logger.log(`Transaction committed for application ${id}`);

    } catch (error) {
      // Rollback the entire transaction - revert approval if loan creation fails
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Transaction rolled back for application ${id}: ${error.message}`,
        error.stack,
      );
      // Re-throw the error so the user sees a meaningful message
      throw new BadRequestException(
        `Failed to approve application and create loan: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }

    // Reload application to get updated status (now committed)
    const finalApplication = await this.findOne(id, companyId);

    // Send notification when application is approved (non-critical, outside transaction)
    try {
      await this.notificationHelper.notifyApplicationApproved(
        finalApplication,
        finalApplication.applicantId,
        undefined, // recipientEmail - would be fetched from Customer entity
        undefined, // recipientPhone - would be fetched from Customer entity
      );
    } catch (error) {
      this.logger.error(`Failed to send application approved notification: ${error.message}`);
    }

    // Notify external platform if this is an external application (non-critical, outside transaction)
    try {
      await this.integrationService.notifyApplicationApproved(
        finalApplication.id,
        finalApplication.approvedAmount || finalApplication.requestedAmount,
      );
    } catch (error) {
      this.logger.error(`Failed to send external platform webhook for application approval: ${error.message}`);
      // Don't throw - internal notification succeeded, webhook failure is logged
    }

    return finalApplication;
  }

  async reject(
    id: string,
    companyId: string,
    userId?: string,
    userRoles?: string[],
    comments?: string,
  ): Promise<LoanApplication> {
    const application = await this.findOne(id, companyId); // Verify company access

    // Check if workflow is enabled
    const workflowEnabled =
      await this.workflowIntegrationService.isWorkflowEnabled(
        'Loan Application',
      );

    if (workflowEnabled) {
      // Use workflow engine
      if (userId) {
        const result =
          await this.workflowIntegrationService.performWorkflowAction(
            'Loan Application',
            application.id,
            application.status,
            'Reject',
            userId,
            undefined,
            comments,
            userRoles,
          );
        application.status = result.newState as ApplicationStatus;
      } else {
        // Fallback: direct status update
        application.status = ApplicationStatus.REJECTED;
      }
    } else {
      // Fallback: direct status update if workflow not enabled
      if (
        application.status === ApplicationStatus.APPROVED ||
        application.status === ApplicationStatus.REJECTED
      ) {
        throw new BadRequestException(
          `Application cannot be rejected. Current status: ${application.status}`,
        );
      }
      application.status = ApplicationStatus.REJECTED;
    }
    application.rejectionDate = new Date();

    const savedApplication = await this.applicationRepository.save(application);

    // Send notification when application is rejected
    try {
      await this.notificationHelper.notifyApplicationRejected(
        savedApplication,
        savedApplication.applicantId,
        comments, // reason
        undefined, // recipientEmail - would be fetched from Customer entity
        undefined, // recipientPhone - would be fetched from Customer entity
      );
    } catch (error) {
      this.logger.error(`Failed to send application rejected notification: ${error.message}`);
    }

    // Notify external platform if this is an external application
    try {
      await this.integrationService.notifyApplicationRejected(
        savedApplication.id,
        comments || 'Application rejected',
      );
    } catch (error) {
      this.logger.error(`Failed to send external platform webhook for application rejection: ${error.message}`);
      // Don't throw - internal notification succeeded, webhook failure is logged
    }

    return savedApplication;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const application = await this.findOne(id, companyId); // Verify company access

    // Only allow deletion if in DRAFT or CANCELLED status
    if (
      application.status !== ApplicationStatus.DRAFT &&
      application.status !== ApplicationStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Application can only be deleted in DRAFT or CANCELLED status. Current status: ${application.status}`,
      );
    }

    await this.applicationRepository.remove(application);
  }


  //This method is still needed in the seeding script
  async createLoanFromApplication(
    applicationId: string,
    companyId: string,
    submit: boolean = false,
  ): Promise<Loan> {
    const application = await this.findOne(applicationId, companyId); // Verify company access

    this.logger.log(`Creating loan from application ${applicationId} for company ${companyId}. Application Product ID: ${application.loanProductId}`);
    // Business Rule: Only approved applications can create loans
    if (application.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException(
        `Loan can only be created from APPROVED applications. Current status: ${application.status}`,
      );
    }

    // Business Rule: Check if loan already created from this application
    if (application.loanId) {
      const existingLoan = await this.loanRepository.findOne({
        where: { id: application.loanId, companyId },
      });
      if (existingLoan) {
        throw new BadRequestException(
          `Loan already created from this application. Loan ID: ${application.loanId}`,
        );
      }
    }

    // Get loan product (verify it belongs to company)
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId, companyId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${application.loanProductId} not found`,
      );
    }

    // Determine loan amount (use approved amount, fallback to requested)
    const loanAmount = application.approvedAmount || application.requestedAmount;

    // Business Rule: For secured loans, validate against maximum loan amount
    if (application.isSecuredLoan && application.maximumLoanAmount) {
      if (loanAmount > application.maximumLoanAmount) {
        throw new BadRequestException(
          `Loan amount (${loanAmount}) cannot exceed maximum loan amount from securities (${application.maximumLoanAmount})`,
        );
      }
    }

    // Business Rule: Validate loan amount against product maximum
    if (
      loanProduct.maximumLoanAmount &&
      loanAmount > loanProduct.maximumLoanAmount
    ) {
      throw new BadRequestException(
        `Loan amount (${loanAmount}) exceeds maximum loan amount of product (${loanProduct.maximumLoanAmount})`,
      );
    }

    // Create loan DTO from application
    // Handle date conversion (could be Date object or string from DB)
    const applicationDate = application.applicationDate instanceof Date
      ? application.applicationDate
      : new Date(application.applicationDate);

    const createLoanDto: CreateLoanDto = {
      loanNumber: await this.generateLoanNumber(),
      companyId: application.companyId,
      applicantType: application.applicantType as any,
      applicantId: application.applicantId,
      loanProductId: application.loanProductId,
      loanAmount,
      postingDate: applicationDate.toISOString().split('T')[0],
      isTermLoan: loanProduct.isTermLoan,
      isSecuredLoan: application.isSecuredLoan || false,
      rateOfInterest: loanProduct.rateOfInterest,
      penaltyInterestRate: loanProduct.penaltyInterestRate,
      repaymentScheduleType: loanProduct.repaymentScheduleType as any,
      // Copy repayment terms from application if available
      repaymentPeriods: application.repaymentPeriods,
      repaymentFrequency: application.repaymentFrequency as any,
      repaymentStartDate: application.repaymentStartDate
        ? (application.repaymentStartDate instanceof Date
          ? application.repaymentStartDate
          : new Date(application.repaymentStartDate)
        ).toISOString().split('T')[0]
        : undefined,
      repaymentMethod: application.repaymentMethod,
      repaymentStructure: application.repaymentStructure, // Use borrower's selected structure
    };

    // Create loan using loan service (properly validates and sets defaults)
    const savedLoan = await this.loanService.create(createLoanDto, companyId);

    // Update loan with additional fields from application
    if (application.isSecuredLoan && application.maximumLoanAmount) {
      savedLoan.maximumLoanAmount = application.maximumLoanAmount;
    }

    // If submit is true, update status to SANCTIONED
    if (submit) {
      savedLoan.status = LoanStatus.SANCTIONED;
    }

    await this.loanRepository.save(savedLoan);

    // Link application to loan
    application.loanId = savedLoan.id;
    await this.applicationRepository.save(application);

    // TODO: Create loan security assignment from application's proposed pledges
    // This would require:
    // 1. Loan Security Assignment entity
    // 2. Proposed Pledges table in Loan Application
    // 3. Security assignment service

    return savedLoan;
  }

  /**
   * Create loan from application within an existing transaction.
   * This method is used by the approve() method to ensure atomicity.
   */
  private async createLoanFromApplicationTransactional(
    queryRunner: import('typeorm').QueryRunner,
    application: LoanApplication,
    companyId: string,
    submit: boolean = false,
  ): Promise<Loan> {
    this.logger.log(`Creating loan from application ${application.id} for company ${companyId} (transactional). Application Product ID: ${application.loanProductId}`);

    // Business Rule: Only approved applications can create loans
    if (application.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException(
        `Loan can only be created from APPROVED applications. Current status: ${application.status}`,
      );
    }

    // Business Rule: Check if loan already created from this application
    if (application.loanId) {
      const existingLoan = await queryRunner.manager.findOne(Loan, {
        where: { id: application.loanId, companyId },
      });
      if (existingLoan) {
        throw new BadRequestException(
          `Loan already created from this application. Loan ID: ${application.loanId}`,
        );
      }
    }

    // Get loan product (verify it belongs to company)
    const loanProduct = await queryRunner.manager.findOne(LoanProduct, {
      where: { id: application.loanProductId, companyId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${application.loanProductId} not found or does not belong to your company`,
      );
    }

    // Determine loan amount (use approved amount, fallback to requested)
    const loanAmount = application.approvedAmount || application.requestedAmount;

    // Business Rule: For secured loans, validate against maximum loan amount
    if (application.isSecuredLoan && application.maximumLoanAmount) {
      if (loanAmount > application.maximumLoanAmount) {
        throw new BadRequestException(
          `Loan amount (${loanAmount}) cannot exceed maximum loan amount from securities (${application.maximumLoanAmount})`,
        );
      }
    }

    // Business Rule: Validate loan amount against product maximum
    if (
      loanProduct.maximumLoanAmount &&
      loanAmount > loanProduct.maximumLoanAmount
    ) {
      throw new BadRequestException(
        `Loan amount (${loanAmount}) exceeds maximum loan amount of product (${loanProduct.maximumLoanAmount})`,
      );
    }

    // Create loan DTO from application
    // Handle date conversion (could be Date object or string from DB)
    const applicationDate = application.applicationDate instanceof Date
      ? application.applicationDate
      : new Date(application.applicationDate);

    // Generate loan number
    const loanNumber = await this.generateLoanNumber();

    // Create loan entity directly (instead of using LoanService.create to stay within transaction)
    const loan = queryRunner.manager.create(Loan, {
      loanNumber,
      companyId: application.companyId,
      applicantType: application.applicantType as any,
      applicantId: application.applicantId,
      loanProductId: application.loanProductId,
      loanAmount,
      postingDate: applicationDate,
      repaymentStartDate: application.repaymentStartDate
        ? (application.repaymentStartDate instanceof Date
          ? application.repaymentStartDate
          : new Date(application.repaymentStartDate))
        : null,
      status: submit ? LoanStatus.SANCTIONED : LoanStatus.DRAFT,
      isTermLoan: loanProduct.isTermLoan,
      isSecuredLoan: application.isSecuredLoan || false,
      rateOfInterest: loanProduct.rateOfInterest,
      penaltyInterestRate: loanProduct.penaltyInterestRate,
      repaymentScheduleType: loanProduct.repaymentScheduleType as any,
      repaymentPeriods: application.repaymentPeriods,
      repaymentFrequency: application.repaymentFrequency as any,
      repaymentMethod: application.repaymentMethod,
      repaymentStructure: application.repaymentStructure,
      // Copy accounts from loan product
      disbursementAccount: loanProduct.disbursementAccount,
      paymentAccount: loanProduct.paymentAccount,
      loanAccount: loanProduct.loanAccount,
      interestIncomeAccount: loanProduct.interestIncomeAccount,
      penaltyIncomeAccount: loanProduct.penaltyIncomeAccount,
    });

    // Update loan with additional fields from application
    if (application.isSecuredLoan && application.maximumLoanAmount) {
      loan.maximumLoanAmount = application.maximumLoanAmount;
    }

    const savedLoan = await queryRunner.manager.save(Loan, loan);

    // Link application to loan
    application.loanId = savedLoan.id;
    await queryRunner.manager.save(LoanApplication, application);

    this.logger.log(`Loan ${savedLoan.loanNumber} created and linked to application ${application.applicationNumber} (transactional)`);

    return savedLoan;
  }

  /**
   * Submit loan application and trigger credit scoring
   */
  async submit(
    id: string,
    companyId: string,
    scoringData?: {
      bankAccountData?: any;
      utilityTelecomData?: any;
      rentPaymentData?: any;
      behavioralData?: any;
      digitalFootprintData?: any;
      transactionalData?: any;
    },
  ): Promise<LoanApplication> {
    const application = await this.findOne(id, companyId);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        `Application can only be submitted from DRAFT status. Current status: ${application.status}`,
      );
    }

    // Trigger credit scoring if data is provided
    if (scoringData) {
      try {
        await this.calculateCreditScore(id, companyId, scoringData);
      } catch (error) {
        this.logger.warn(
          `Failed to calculate credit score for application ${application.applicationNumber}: ${error.message}`,
        );
        // Continue with submission even if scoring fails
      }
    }

    // Update status to SUBMITTED
    application.status = ApplicationStatus.SUBMITTED;
    const savedApplication = await this.applicationRepository.save(application);

    // Note: Workflow is automatically triggered through status changes
    // No need to explicitly trigger here as workflow engine handles state transitions

    this.logger.log(
      `Application ${savedApplication.applicationNumber} submitted successfully`,
    );

    return savedApplication;
  }

  /**
   * Calculate weighted credit score for an application
   */
  async calculateCreditScore(
    applicationId: string,
    companyId: string,
    scoringData?: {
      bankAccountData?: any;
      utilityTelecomData?: any;
      rentPaymentData?: any;
      behavioralData?: any;
      digitalFootprintData?: any;
      transactionalData?: any;
      creditBureauData?: any;
    },
  ): Promise<LoanApplication> {
    const application = await this.findOne(applicationId, companyId);

    this.logger.log(
      `Calculating weighted credit score for application ${application.applicationNumber}`,
    );

    try {
      // Prepare scoring request
      const scoringRequest = {
        applicantId: application.applicantId,
        applicationId: application.id,
        creditBureauData: scoringData?.creditBureauData,
        bankAccountData: scoringData?.bankAccountData,
        utilityTelecomData: scoringData?.utilityTelecomData,
        rentPaymentData: scoringData?.rentPaymentData,
        behavioralData: scoringData?.behavioralData,
        digitalFootprintData: scoringData?.digitalFootprintData,
        transactionalData: scoringData?.transactionalData,
      };

      // Determine segment based on loan product or amount (if available)
      // This could be enhanced to automatically detect segment
      const segment = this.determineSegment(application);

      // Calculate weighted score with segment-specific weights
      // Include trigger for history tracking
      const scoringResult = await this.weightedScoringService.calculateWeightedScore(
        scoringRequest,
        companyId,
        true, // useML
        segment,
        'APPLICATION_SUBMITTED' as any, // Trigger
        {
          applicationId: application.id,
          timestamp: new Date().toISOString(),
        },
      );

      // Store scoring results in application
      application.creditScore = scoringResult.finalScore;
      application.scoringDetails = {
        finalScore: scoringResult.finalScore,
        scoreBreakdown: scoringResult.scoreBreakdown,
        weights: scoringResult.weights,
        explanation: scoringResult.explanation,
        confidence: scoringResult.confidence,
        riskTier: scoringResult.riskTier,
        calculatedAt: scoringResult.calculatedAt,
      };
      application.creditScoreCalculatedAt = new Date();

      // Auto-update status based on score (optional)
      // High score (>= 700) -> UNDER_REVIEW
      // Medium score (600-699) -> UNDER_REVIEW
      // Low score (< 600) -> Keep as SUBMITTED for manual review
      if (
        application.status === ApplicationStatus.SUBMITTED &&
        scoringResult.finalScore >= 700
      ) {
        application.status = ApplicationStatus.UNDER_REVIEW;
        this.logger.log(
          `Application ${application.applicationNumber} moved to UNDER_REVIEW based on high credit score (${scoringResult.finalScore})`,
        );
      }

      const savedApplication = await this.applicationRepository.save(application);

      this.logger.log(
        `Credit score calculated for application ${application.applicationNumber}: ${scoringResult.finalScore} (${scoringResult.riskTier} risk)`,
      );

      return savedApplication;
    } catch (error) {
      this.logger.error(
        `Failed to calculate credit score for application ${application.applicationNumber}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Auto-approve application based on credit score (if enabled)
   */
  async autoApproveIfEligible(
    applicationId: string,
    companyId: string,
  ): Promise<LoanApplication | null> {
    const application = await this.findOne(applicationId, companyId);

    // Only auto-approve if score is available and high enough
    if (!application.creditScore || application.creditScore < 750) {
      return null; // Not eligible for auto-approval
    }

    // Check if already approved or rejected
    if (
      application.status === ApplicationStatus.APPROVED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      return null;
    }

    // Auto-approve high-scoring applications
    if (application.creditScore >= 750 && application.status === ApplicationStatus.UNDER_REVIEW) {
      this.logger.log(
        `Auto-approving application ${application.applicationNumber} based on high credit score (${application.creditScore})`,
      );

      return await this.approve(applicationId, companyId, undefined, undefined, 'Auto-approved based on high credit score');
    }

    return null;
  }

  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `APP-${year}-`;

    // Find the maximum existing application number for this year
    const result = await this.applicationRepository
      .createQueryBuilder('app')
      .select('MAX(app.applicationNumber)', 'maxNumber')
      .where('app.applicationNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();

    let sequence = 1;
    if (result?.maxNumber) {
      // Extract the sequence number from the existing max number
      const match = result.maxNumber.match(/APP-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    // Generate the candidate number and verify uniqueness
    let candidateNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.applicationRepository.findOne({
        where: { applicationNumber: candidateNumber },
      });

      if (!existing) {
        return candidateNumber;
      }

      // Number exists, increment and try again
      sequence++;
      candidateNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
      attempts++;
    }

    // Fallback: add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }

  private async generateLoanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LOAN-${year}-`;

    // Find the maximum existing loan number for this year
    const result = await this.loanRepository
      .createQueryBuilder('loan')
      .select('MAX(loan.loanNumber)', 'maxNumber')
      .where('loan.loanNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();

    let sequence = 1;
    if (result?.maxNumber) {
      // Extract the sequence number from the existing max number
      const match = result.maxNumber.match(/LOAN-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    // Generate the candidate number and verify uniqueness
    let candidateNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.loanRepository.findOne({
        where: { loanNumber: candidateNumber },
      });

      if (!existing) {
        return candidateNumber;
      }

      // Number exists, increment and try again
      sequence++;
      candidateNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
      attempts++;
    }

    // Fallback: add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }

  async performWorkflowAction(
    id: string,
    companyId: string,
    action: string,
    userId: string,
    userRoles?: string[],
    comments?: string,
  ) {
    const application = await this.findOne(id, companyId); // Verify company access
    const result = await this.workflowIntegrationService.performWorkflowAction(
      'Loan Application',
      application.id,
      application.status,
      action,
      userId,
      undefined,
      comments,
      userRoles,
    );
    application.status = result.newState as ApplicationStatus;
    return await this.applicationRepository.save(application);
  }

  async getAvailableActions(id: string, companyId: string) {
    const application = await this.findOne(id, companyId); // Verify company access
    return await this.workflowIntegrationService.getAvailableActions(
      'Loan Application',
      application.status as string,
    );
  }

  async getWorkflowHistory(id: string, companyId: string) {
    // Verify application belongs to company before returning history
    await this.findOne(id, companyId); // Verify company access
    return await this.workflowIntegrationService.getWorkflowHistory(
      'Loan Application',
      id,
    );
  }

  /**
   * Determine customer segment based on application data
   * Can be enhanced to use loan product type, amount, or other factors
   */
  private determineSegment(application: LoanApplication): 'MICRO' | 'SME' | 'ENTERPRISE' {
    // Simple heuristic: use loan amount to determine segment
    // In production, this could use loan product type, customer type, etc.
    if (application.requestedAmount < 10000) {
      return 'MICRO';
    } else if (application.requestedAmount < 100000) {
      return 'SME';
    } else {
      return 'ENTERPRISE';
    }
  }
}

