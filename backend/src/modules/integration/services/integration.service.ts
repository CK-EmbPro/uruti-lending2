import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ThirdPartyPlatform, PlatformStatus } from '../entities/third-party-platform.entity';
import { ExternalLoanApplication, ExternalApplicationStatus } from '../entities/external-loan-application.entity';
import { ExternalRepayment, ExternalRepaymentStatus } from '../entities/external-repayment.entity';
import { WebhookDelivery, WebhookDeliveryStatus, WebhookEventType } from '../entities/webhook-delivery.entity';
import { IntegrationAuditLog, AuditActionType } from '../entities/integration-audit-log.entity';
import { CreateExternalLoanApplicationDto } from '../dto/create-external-loan-application.dto';
import { PostExternalRepaymentDto } from '../dto/post-external-repayment.dto';
import { CreateThirdPartyPlatformDto } from '../dto/create-platform.dto';
import { UpdateThirdPartyPlatformDto } from '../dto/update-platform.dto';
import { LoanApplicationService } from '../../loan-application/loan-application.service';
import { LoanService } from '../../loan/loan.service';
import { LoanRepaymentService } from '../../loan-repayment/loan-repayment.service';
import { CustomerService } from '../../customer/customer.service';
import { LoanProductService } from '../../loan-product/loan-product.service';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanStatus } from '../../loan/entities/loan.entity';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(ThirdPartyPlatform)
    private readonly platformRepository: Repository<ThirdPartyPlatform>,
    @InjectRepository(ExternalLoanApplication)
    private readonly externalApplicationRepository: Repository<ExternalLoanApplication>,
    @InjectRepository(ExternalRepayment)
    private readonly externalRepaymentRepository: Repository<ExternalRepayment>,
    @InjectRepository(WebhookDelivery)
    private readonly webhookDeliveryRepository: Repository<WebhookDelivery>,
    @InjectRepository(IntegrationAuditLog)
    private readonly auditLogRepository: Repository<IntegrationAuditLog>,
    @Inject(forwardRef(() => LoanApplicationService))
    private readonly loanApplicationService: LoanApplicationService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    private readonly loanRepaymentService: LoanRepaymentService,
    private readonly customerService: CustomerService,
    private readonly loanProductService: LoanProductService,
  ) {}

  /**
   * Authenticate third-party platform using API key
   */
  async authenticatePlatform(apiKey: string): Promise<ThirdPartyPlatform> {
    const platform = await this.platformRepository.findOne({
      where: { apiKey, status: PlatformStatus.ACTIVE },
    });

    if (!platform) {
      throw new UnauthorizedException('Invalid API key or platform is inactive');
    }

    return platform;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature),
    );
  }

  /**
   * Create loan application from external platform
   */
  async createExternalLoanApplication(
    platformId: string,
    dto: CreateExternalLoanApplicationDto,
  ): Promise<ExternalLoanApplication> {
    const platform = await this.platformRepository.findOne({
      where: { id: platformId },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${platformId} not found`);
    }

    if (!platform.canCreateApplications) {
      throw new BadRequestException('Platform is not authorized to create applications');
    }

    // Check if external application already exists
    const existing = await this.externalApplicationRepository.findOne({
      where: {
        externalReferenceId: dto.externalReferenceId,
        platformId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Application with external reference ${dto.externalReferenceId} already exists`,
      );
    }

    // Create or find customer from external customer data
    // This method handles customer creation/mapping and can be extended
    // when a Customer entity is added to the system
    const customerId = await this.customerService.createOrFindExternalCustomer(
      dto.customer.externalCustomerId,
      {
        firstName: dto.customer.firstName,
        lastName: dto.customer.lastName,
        email: dto.customer.email,
        phone: dto.customer.phone,
        kycStatus: dto.customer.kycStatus,
        creditScore: dto.customer.creditScore,
        metadata: dto.customer.metadata,
      },
      platformId,
    );

    // Get loan product by code
    const loanProduct = await this.loanProductService.findByProductCode(
      dto.loanProductCode,
    );

    // Verify company matches
    if (loanProduct.companyId !== dto.companyId) {
      throw new BadRequestException(
        `Loan product ${dto.loanProductCode} does not belong to company ${dto.companyId}`,
      );
    }

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan product with code ${dto.loanProductCode} not found`,
      );
    }

    // Create internal loan application
    let loanApplicationId: string;
    try {
      const application = await this.loanApplicationService.create({
        companyId: dto.companyId,
        applicantType: ApplicantType.CUSTOMER,
        applicantId: customerId,
        loanProductId: loanProduct.id,
        requestedAmount: dto.requestedAmount,
        applicationDate: new Date().toISOString().split('T')[0],
        // Snapshot mandatory fields
        fullName: [dto.customer.firstName, dto.customer.lastName].filter(Boolean).join(' ') || 'External Applicant',
        email: dto.customer.email || '',
        phoneNumber: dto.customer.phone || '',
        dateOfBirth: dto.customer.dateOfBirth || '',
        address: dto.customer.address || '',
        status: ApplicationStatus.SUBMITTED,
      }, dto.companyId);

      // Set initial status to PENDING for external applications
      application.status = ApplicationStatus.DRAFT;
      await this.loanApplicationService.update(application.id, {
        remarks: `Created from external platform: ${platform.platformName}. External Reference: ${dto.externalReferenceId}`,
      }, dto.companyId);

      loanApplicationId = application.id;
    } catch (error) {
      this.logger.error(`Failed to create loan application: ${error.message}`);
      throw new BadRequestException(
        `Failed to create loan application: ${error.message}`,
      );
    }

    // Create external application record
    const externalApplication = this.externalApplicationRepository.create({
      platformId,
      externalReferenceId: dto.externalReferenceId,
      externalCustomerId: dto.customer.externalCustomerId,
      loanApplicationId,
      status: ExternalApplicationStatus.PENDING,
      tripId: dto.tripId,
      cargoOwnerId: dto.cargoOwnerId,
      transporterId: dto.transporterId,
      tripRevenue: dto.tripRevenue,
      advanceAmount: dto.advanceAmount,
      tripStartDate: dto.tripStartDate ? new Date(dto.tripStartDate) : null,
      tripEndDate: dto.tripEndDate ? new Date(dto.tripEndDate) : null,
      expectedRevenueDate: dto.expectedRevenueDate
        ? new Date(dto.expectedRevenueDate)
        : null,
      externalData: dto.externalData || {},
    });

    const saved = await this.externalApplicationRepository.save(externalApplication);

    this.logger.log(
      `Created external loan application ${saved.id} for platform ${platform.platformName}`,
    );

    return saved;
  }

  /**
   * Post repayment from external platform
   */
  async postExternalRepayment(
    platformId: string,
    dto: PostExternalRepaymentDto,
  ): Promise<ExternalRepayment> {
    const platform = await this.platformRepository.findOne({
      where: { id: platformId },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${platformId} not found`);
    }

    if (!platform.canPostRepayments) {
      throw new BadRequestException('Platform is not authorized to post repayments');
    }

    // Find loan by reference (could be loanNumber or externalReferenceId)
    let loan;
    let companyId: string;
    try {
      // Try to find by external application first to get companyId
      const externalApp = await this.externalApplicationRepository.findOne({
        where: {
          externalReferenceId: dto.loanReference,
          platformId,
        },
        relations: ['loan'],
      });
      if (externalApp?.loan) {
        loan = externalApp.loan;
        companyId = loan.companyId;
      } else {
        // If not found, we need companyId to search - this is a limitation
        // For now, we'll need to pass companyId in the DTO or get it from platform
        throw new NotFoundException('Loan not found via external reference');
      }
    } catch {
      // Try finding by loan number - but we need companyId
      // This is a design issue - we need companyId to search
      throw new BadRequestException('Cannot find loan without companyId');
    }

    if (!loan) {
      throw new NotFoundException(
        `Loan with reference ${dto.loanReference} not found`,
      );
    }

    companyId = loan.companyId;

    // Check if external repayment already exists
    const existing = await this.externalRepaymentRepository.findOne({
      where: {
        externalReferenceId: dto.externalReferenceId,
        platformId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Repayment with external reference ${dto.externalReferenceId} already exists`,
      );
    }

    // Create internal repayment
    let repaymentId: string;
    try {
      const repayment = await this.loanRepaymentService.create({
        loanId: loan.id,
        postingDate: dto.paymentDate,
        amountPaid: dto.amount,
        repaymentType: RepaymentType.NORMAL_REPAYMENT,
      }, companyId);

      repaymentId = repayment.id;
    } catch (error) {
      this.logger.error(`Failed to create repayment: ${error.message}`);
      throw new BadRequestException(
        `Failed to create repayment: ${error.message}`,
      );
    }

    // Create external repayment record
    const externalRepayment = this.externalRepaymentRepository.create({
      platformId,
      externalReferenceId: dto.externalReferenceId,
      loanId: loan.id,
      repaymentId,
      status: ExternalRepaymentStatus.PROCESSED,
      amount: dto.amount,
      paymentDate: new Date(dto.paymentDate),
      tripId: dto.tripId,
      revenueTransactionId: dto.revenueTransactionId,
      totalTripRevenue: dto.totalTripRevenue,
      repaymentPercentage: dto.repaymentPercentage,
      processingNotes: dto.processingNotes,
      externalData: dto.externalData || {},
      processedAt: new Date(),
    });

    const saved = await this.externalRepaymentRepository.save(externalRepayment);

    // Update external application status if fully repaid
    const externalApp = await this.externalApplicationRepository.findOne({
      where: { loanId: loan.id, platformId },
    });

    if (externalApp) {
      // Calculate outstanding balance
      const outstandingBalance =
        loan.loanAmount -
        loan.totalPrincipalPaid -
        loan.totalInterestPaid -
        loan.totalPenaltyPaid +
        loan.debitAdjustmentAmount -
        loan.creditAdjustmentAmount;

      if (outstandingBalance <= 0) {
        externalApp.status = ExternalApplicationStatus.REPAID;
      } else {
        externalApp.status = ExternalApplicationStatus.PARTIAL;
      }
      await this.externalApplicationRepository.save(externalApp);
    }

    this.logger.log(
      `Posted external repayment ${saved.id} for loan ${loan.loanNumber} from platform ${platform.platformName}`,
    );

    return saved;
  }

  /**
   * Send webhook notification to platform
   */
  async sendWebhookNotification(
    platform: ThirdPartyPlatform,
    event: string,
    data: any,
  ): Promise<boolean> {
    if (!platform.webhookUrl) {
      this.logger.warn(`No webhook URL configured for platform ${platform.platformCode}`);
      return false;
    }

    try {
      const payload = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      });

      const signature = crypto
        .createHmac('sha256', platform.webhookSecret || '')
        .update(payload)
        .digest('hex');

      // Create webhook delivery record
      const delivery = this.webhookDeliveryRepository.create({
        platformId: platform.id,
        eventType: event as WebhookEventType,
        payload: data,
        status: WebhookDeliveryStatus.PENDING,
        attemptCount: 0,
        maxAttempts: 3,
        webhookUrl: platform.webhookUrl,
      });
      await this.webhookDeliveryRepository.save(delivery);

      const response = await fetch(platform.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Platform-Code': platform.platformCode,
          'X-Webhook-Event': event,
        },
        body: payload,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      delivery.responseStatus = response.status;
      delivery.attemptCount = 1;

      if (response.ok) {
        delivery.status = WebhookDeliveryStatus.SUCCESS;
        delivery.deliveredAt = new Date();
        const responseText = await response.text();
        delivery.responseBody = responseText.substring(0, 1000); // Limit response body
        this.logger.log(
          `Webhook notification sent successfully to ${platform.platformCode} for event ${event}`,
        );
      } else {
        delivery.status = WebhookDeliveryStatus.FAILED;
        const responseText = await response.text();
        delivery.responseBody = responseText.substring(0, 1000);
        delivery.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        this.logger.warn(
          `Webhook failed for ${platform.platformCode}: HTTP ${response.status}`,
        );
      }

      delivery.updatedAt = new Date();
      await this.webhookDeliveryRepository.save(delivery);

      return response.ok;
    } catch (error: any) {
      // Update delivery record with error
      const deliveries = await this.webhookDeliveryRepository.find({
        where: { platformId: platform.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (deliveries.length > 0) {
        const delivery = deliveries[0];
        delivery.status = WebhookDeliveryStatus.FAILED;
        delivery.errorMessage = error.message || 'Network error';
        delivery.attemptCount = (delivery.attemptCount || 0) + 1;
        delivery.updatedAt = new Date();
        await this.webhookDeliveryRepository.save(delivery);
      }

      this.logger.error(
        `Failed to send webhook to ${platform.platformCode}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Update external application status when loan status changes
   */
  async updateExternalApplicationStatus(
    loanId: string,
    loanStatus: LoanStatus,
  ): Promise<void> {
    const externalApps = await this.externalApplicationRepository.find({
      where: { loanId },
      relations: ['platform'],
    });

    for (const app of externalApps) {
      let newStatus: ExternalApplicationStatus;
      switch (loanStatus) {
        case LoanStatus.SANCTIONED:
        case LoanStatus.DISBURSED:
          newStatus = ExternalApplicationStatus.DISBURSED;
          break;
        case LoanStatus.CLOSED:
          newStatus = ExternalApplicationStatus.REPAID;
          break;
        default:
          continue;
      }

      if (app.status !== newStatus) {
        app.status = newStatus;
        await this.externalApplicationRepository.save(app);

        // Send webhook notification
        await this.sendWebhookNotification(app.platform, 'loan.status.updated', {
          externalReferenceId: app.externalReferenceId,
          loanId,
          status: newStatus,
        });
      }
    }
  }

  /**
   * Get loan status by reference
   */
  async getLoanStatus(platformId: string, loanReference: string): Promise<{
    loanReference: string;
    loanId?: string;
    status: string;
    loanAmount?: number;
    outstandingBalance?: number;
    nextPaymentDate?: Date;
    nextPaymentAmount?: number;
    externalReferenceId?: string;
  }> {
    // Try to find by loan number first - but we need companyId
    // This method needs to be refactored to accept companyId
    let loan;
    let companyId: string | undefined;
    try {
      // Try finding by external reference first to get companyId
      const externalApp = await this.externalApplicationRepository.findOne({
        where: {
          externalReferenceId: loanReference,
          platformId,
        },
        relations: ['loan'],
      });
      if (externalApp?.loan) {
        loan = externalApp.loan;
        companyId = loan.companyId;
      }
    } catch {
      // Try finding by external reference
      const externalApp = await this.externalApplicationRepository.findOne({
        where: {
          externalReferenceId: loanReference,
          platformId,
        },
        relations: ['loan'],
      });
      if (externalApp?.loan) {
        loan = externalApp.loan;
      }
    }

    if (!loan) {
      throw new NotFoundException(`Loan with reference ${loanReference} not found`);
    }

    return {
      loanReference,
      loanId: loan.id,
      status: loan.status,
      loanAmount: Number(loan.loanAmount || 0),
      outstandingBalance: Number(loan.outstandingBalance || 0),
      nextPaymentDate: loan.nextPaymentDate,
      nextPaymentAmount: loan.nextPaymentAmount ? Number(loan.nextPaymentAmount) : undefined,
    };
  }

  /**
   * Get external application status
   */
  async getExternalApplicationStatus(
    platformId: string,
    externalReferenceId: string,
  ): Promise<{
    externalReferenceId: string;
    status: string;
    loanApplicationId?: string;
    loanId?: string;
    requestedAmount?: number;
    approvedAmount?: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const externalApp = await this.externalApplicationRepository.findOne({
      where: {
        externalReferenceId,
        platformId,
      },
      relations: ['loan', 'loanApplication'],
    });

    if (!externalApp) {
      throw new NotFoundException(
        `External application with reference ${externalReferenceId} not found for this platform`,
      );
    }

    return {
      externalReferenceId: externalApp.externalReferenceId,
      status: externalApp.status,
      loanApplicationId: externalApp.loanApplicationId,
      loanId: externalApp.loanId,
      requestedAmount: externalApp.loanApplication?.requestedAmount ? Number(externalApp.loanApplication.requestedAmount) : undefined,
      approvedAmount: externalApp.loan?.loanAmount ? Number(externalApp.loan.loanAmount) : undefined,
      createdAt: externalApp.createdAt,
      updatedAt: externalApp.updatedAt,
    };
  }

  /**
   * Find external application by loan application ID
   * Used to check if a loan application came from an external platform
   */
  async findExternalApplicationByLoanApplicationId(
    loanApplicationId: string,
  ): Promise<ExternalLoanApplication | null> {
    return await this.externalApplicationRepository.findOne({
      where: { loanApplicationId },
      relations: ['platform', 'loanApplication'],
    });
  }

  /**
   * Notify external platform when application is approved
   */
  async notifyApplicationApproved(
    loanApplicationId: string,
    approvedAmount?: number,
  ): Promise<void> {
    const externalApp = await this.findExternalApplicationByLoanApplicationId(loanApplicationId);
    
    if (!externalApp) {
      // Not an external application, no webhook needed
      return;
    }

    // Update external application status
    externalApp.status = ExternalApplicationStatus.APPROVED;
    await this.externalApplicationRepository.save(externalApp);

    // Send webhook notification
    await this.sendWebhookNotification(externalApp.platform, 'application.approved', {
      externalReferenceId: externalApp.externalReferenceId,
      loanApplicationId: externalApp.loanApplicationId,
      approvedAmount: approvedAmount || externalApp.loanApplication?.requestedAmount || 0,
    });

    this.logger.log(
      `Sent application.approved webhook for external application ${externalApp.externalReferenceId}`,
    );
  }

  /**
   * Notify external platform when application is rejected
   */
  async notifyApplicationRejected(
    loanApplicationId: string,
    rejectionReason?: string,
  ): Promise<void> {
    const externalApp = await this.findExternalApplicationByLoanApplicationId(loanApplicationId);
    
    if (!externalApp) {
      // Not an external application, no webhook needed
      return;
    }

    // Update external application status
    externalApp.status = ExternalApplicationStatus.REJECTED;
    await this.externalApplicationRepository.save(externalApp);

    // Send webhook notification
    await this.sendWebhookNotification(externalApp.platform, 'application.rejected', {
      externalReferenceId: externalApp.externalReferenceId,
      loanApplicationId: externalApp.loanApplicationId,
      rejectionReason: rejectionReason || 'Application rejected',
    });

    this.logger.log(
      `Sent application.rejected webhook for external application ${externalApp.externalReferenceId}`,
    );
  }

  /**
   * Find external application by loan ID
   */
  async findExternalApplicationByLoanId(
    loanId: string,
  ): Promise<ExternalLoanApplication | null> {
    return await this.externalApplicationRepository.findOne({
      where: { loanId },
      relations: ['platform'],
    });
  }

  /**
   * Notify external platform when repayment is posted
   * This is called when a repayment is created internally (not from external platform)
   */
  async notifyRepaymentPosted(
    loanId: string,
    repaymentId: string,
    amount: number,
    paymentDate: Date,
  ): Promise<void> {
    const externalApp = await this.findExternalApplicationByLoanId(loanId);
    
    if (!externalApp) {
      // Not an external loan, no webhook needed
      return;
    }

    // Send webhook notification
    await this.sendWebhookNotification(externalApp.platform, 'repayment.posted', {
      externalReferenceId: externalApp.externalReferenceId,
      loanReference: externalApp.loan?.loanNumber || loanId,
      loanId,
      repaymentId,
      amount,
      paymentDate: paymentDate.toISOString().split('T')[0],
    });

    this.logger.log(
      `Sent repayment.posted webhook for external loan ${externalApp.externalReferenceId}`,
    );
  }

  /**
   * Create a new third-party platform
   */
  async createPlatform(dto: CreateThirdPartyPlatformDto, createdBy: string): Promise<ThirdPartyPlatform> {
    // Check if platform code already exists
    const existing = await this.platformRepository.findOne({
      where: { platformCode: dto.platformCode },
    });

    if (existing) {
      throw new ConflictException(`Platform with code ${dto.platformCode} already exists`);
    }

    // Generate API key and secret
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');
    const webhookSecret = dto.webhookSecret || crypto.randomBytes(32).toString('hex');

    const platform = this.platformRepository.create({
      ...dto,
      apiKey,
      apiSecret,
      webhookSecret: dto.webhookSecret || webhookSecret,
      status: dto.status || PlatformStatus.ACTIVE,
      canCreateCustomers: dto.canCreateCustomers ?? true,
      canCreateApplications: dto.canCreateApplications ?? true,
      canPostRepayments: dto.canPostRepayments ?? true,
      canQueryLoanStatus: dto.canQueryLoanStatus ?? true,
      rateLimitPerMinute: dto.rateLimitPerMinute || 1000,
      createdBy,
    });

    const savedPlatform = await this.platformRepository.save(platform);

    this.logger.log(`Third-party platform created: ${savedPlatform.platformCode} by ${createdBy}`);

    return savedPlatform;
  }

  /**
   * Get all platforms
   */
  async getAllPlatforms(): Promise<ThirdPartyPlatform[]> {
    return this.platformRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['externalApplications'],
    });
  }

  /**
   * Get platform by ID
   */
  async getPlatformById(id: string): Promise<ThirdPartyPlatform> {
    const platform = await this.platformRepository.findOne({
      where: { id },
      relations: ['externalApplications'],
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    return platform;
  }

  /**
   * Update platform
   */
  async updatePlatform(id: string, dto: UpdateThirdPartyPlatformDto, updatedBy: string): Promise<ThirdPartyPlatform> {
    const platform = await this.platformRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    // Capture old values for audit log
    const oldValues = {
      platformName: platform.platformName,
      description: platform.description,
      status: platform.status,
      webhookUrl: platform.webhookUrl,
      canCreateCustomers: platform.canCreateCustomers,
      canCreateApplications: platform.canCreateApplications,
      canPostRepayments: platform.canPostRepayments,
      canQueryLoanStatus: platform.canQueryLoanStatus,
      rateLimitPerMinute: platform.rateLimitPerMinute,
      contactEmail: platform.contactEmail,
      contactPhone: platform.contactPhone,
    };

    // Update fields
    if (dto.platformName !== undefined) platform.platformName = dto.platformName;
    if (dto.description !== undefined) platform.description = dto.description;
    if (dto.status !== undefined) platform.status = dto.status;
    if (dto.webhookUrl !== undefined) platform.webhookUrl = dto.webhookUrl;
    if (dto.webhookSecret !== undefined) platform.webhookSecret = dto.webhookSecret;
    if (dto.canCreateCustomers !== undefined) platform.canCreateCustomers = dto.canCreateCustomers;
    if (dto.canCreateApplications !== undefined) platform.canCreateApplications = dto.canCreateApplications;
    if (dto.canPostRepayments !== undefined) platform.canPostRepayments = dto.canPostRepayments;
    if (dto.canQueryLoanStatus !== undefined) platform.canQueryLoanStatus = dto.canQueryLoanStatus;
    if (dto.rateLimitPerMinute !== undefined) platform.rateLimitPerMinute = dto.rateLimitPerMinute;
    if (dto.contactEmail !== undefined) platform.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) platform.contactPhone = dto.contactPhone;
    if (dto.metadata !== undefined) platform.metadata = dto.metadata;

    platform.updatedBy = updatedBy;

    const updated = await this.platformRepository.save(platform);

    this.logger.log(`Platform ${platform.platformCode} updated by ${updatedBy}`);

    // Capture new values for audit log
    const newValues = {
      platformName: updated.platformName,
      description: updated.description,
      status: updated.status,
      webhookUrl: updated.webhookUrl,
      canCreateCustomers: updated.canCreateCustomers,
      canCreateApplications: updated.canCreateApplications,
      canPostRepayments: updated.canPostRepayments,
      canQueryLoanStatus: updated.canQueryLoanStatus,
      rateLimitPerMinute: updated.rateLimitPerMinute,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
    };

    // Log audit event
    await this.logAuditEvent(
      AuditActionType.PLATFORM_UPDATED,
      updatedBy,
      'System',
      'system@example.com',
      platform.id,
      oldValues,
      newValues,
      `Platform ${platform.platformCode} updated`,
    );

    return updated;
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(id: string, updatedBy: string): Promise<{ apiKey: string; apiSecret: string }> {
    const platform = await this.platformRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    const newApiKey = crypto.randomBytes(32).toString('hex');
    const newApiSecret = crypto.randomBytes(32).toString('hex');

    platform.apiKey = newApiKey;
    platform.apiSecret = newApiSecret;
    platform.updatedBy = updatedBy;

    await this.platformRepository.save(platform);

    this.logger.log(`API key regenerated for platform ${platform.platformCode} by ${updatedBy}`);

    return { apiKey: newApiKey, apiSecret: newApiSecret };
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateWebhookSecret(id: string, updatedBy: string): Promise<{ webhookSecret: string }> {
    const platform = await this.platformRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    const newWebhookSecret = crypto.randomBytes(32).toString('hex');

    platform.webhookSecret = newWebhookSecret;
    platform.updatedBy = updatedBy;

    await this.platformRepository.save(platform);

    this.logger.log(`Webhook secret regenerated for platform ${platform.platformCode} by ${updatedBy}`);

    return { webhookSecret: newWebhookSecret };
  }

  /**
   * Delete platform
   */
  async deletePlatform(id: string, deletedBy: string): Promise<void> {
    const platform = await this.platformRepository.findOne({
      where: { id },
      relations: ['externalApplications'],
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    // Check if platform has active applications
    if (platform.externalApplications && platform.externalApplications.length > 0) {
      throw new BadRequestException(
        `Cannot delete platform with ${platform.externalApplications.length} associated applications. Please archive or remove applications first.`,
      );
    }

    await this.platformRepository.remove(platform);

    this.logger.log(`Platform ${platform.platformCode} deleted by ${deletedBy}`);
  }

  /**
   * Get platform statistics
   */
  async getPlatformStatistics(id: string): Promise<{
    totalApplications: number;
    activeApplications: number;
    totalRepayments: number;
    totalRepaymentAmount: number;
    lastActivity: Date | null;
  }> {
    const platform = await this.platformRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    const [applications, repayments] = await Promise.all([
      this.externalApplicationRepository.find({
        where: { platformId: id },
      }),
      this.externalRepaymentRepository.find({
        where: { platformId: id },
      }),
    ]);

    const totalApplications = applications.length;
    const activeApplications = applications.filter(
      (app) => app.status === ExternalApplicationStatus.PENDING || app.status === ExternalApplicationStatus.APPROVED,
    ).length;

    const totalRepayments = repayments.length;
    const totalRepaymentAmount = repayments.reduce((sum, repayment) => sum + Number(repayment.amount || 0), 0);

    const lastActivity = applications.length > 0
      ? new Date(Math.max(...applications.map((app) => new Date(app.createdAt).getTime())))
      : null;

    return {
      totalApplications,
      activeApplications,
      totalRepayments,
      totalRepaymentAmount,
      lastActivity,
    };
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(
    platformId: string,
    dto: { eventType: WebhookEventType; payload?: Record<string, any>; webhookUrl?: string },
  ): Promise<WebhookDelivery> {
    const platform = await this.platformRepository.findOne({
      where: { id: platformId },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${platformId} not found`);
    }

    if (!platform.webhookUrl && !dto.webhookUrl) {
      throw new BadRequestException('Platform does not have a webhook URL configured');
    }

    const webhookUrl = dto.webhookUrl || platform.webhookUrl;
    const payload = dto.payload || this.getDefaultWebhookPayload(dto.eventType);

    // Create webhook delivery record
    const delivery = this.webhookDeliveryRepository.create({
      platformId,
      eventType: dto.eventType,
      payload,
      status: WebhookDeliveryStatus.PENDING,
      attemptCount: 0,
      maxAttempts: 1, // Test webhooks only attempt once
      webhookUrl,
    });

    await this.webhookDeliveryRepository.save(delivery);

    // Send webhook
    try {
      const signature = this.generateWebhookSignature(JSON.stringify(payload), platform.webhookSecret || '');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': dto.eventType,
        },
        body: JSON.stringify({
          event: dto.eventType,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      delivery.responseStatus = response.status;
      delivery.attemptCount = 1;

      if (response.ok) {
        delivery.status = WebhookDeliveryStatus.SUCCESS;
        delivery.deliveredAt = new Date();
        const responseText = await response.text();
        delivery.responseBody = responseText.substring(0, 1000); // Limit response body
      } else {
        delivery.status = WebhookDeliveryStatus.FAILED;
        const responseText = await response.text();
        delivery.responseBody = responseText.substring(0, 1000);
        delivery.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      delivery.status = WebhookDeliveryStatus.FAILED;
      delivery.errorMessage = error.message || 'Network error';
      this.logger.error(`Webhook test failed: ${error.message}`, error.stack);
    }

    delivery.updatedAt = new Date();
    await this.webhookDeliveryRepository.save(delivery);

    return delivery;
  }

  /**
   * Get default webhook payload for event type
   */
  private getDefaultWebhookPayload(eventType: WebhookEventType): Record<string, any> {
    const defaults: Record<WebhookEventType, Record<string, any>> = {
      [WebhookEventType.LOAN_STATUS_UPDATED]: {
        externalReferenceId: 'TEST-TRIP-123',
        loanId: 'test-loan-id',
        status: 'Disbursed',
      },
      [WebhookEventType.APPLICATION_APPROVED]: {
        externalReferenceId: 'TEST-TRIP-123',
        loanApplicationId: 'test-app-id',
        approvedAmount: 50000,
      },
      [WebhookEventType.APPLICATION_REJECTED]: {
        externalReferenceId: 'TEST-TRIP-123',
        loanApplicationId: 'test-app-id',
        rejectionReason: 'Test rejection',
      },
      [WebhookEventType.REPAYMENT_POSTED]: {
        externalReferenceId: 'TEST-PAYMENT-123',
        loanReference: 'TEST-LOAN-001',
        amount: 55000,
        paymentDate: new Date().toISOString(),
      },
      [WebhookEventType.CUSTOMER_CREATED]: {
        externalCustomerId: 'TEST-CUST-001',
        customerId: 'test-customer-id',
        email: 'test@example.com',
      },
    };

    return defaults[eventType] || {};
  }

  /**
   * Generate webhook signature
   */
  private generateWebhookSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payload).digest('hex');
  }

  /**
   * Log audit event
   */
  async logAuditEvent(
    actionType: AuditActionType,
    userId: string,
    userName: string,
    userEmail: string,
    platformId: string | null,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    description: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IntegrationAuditLog> {
    const log = this.auditLogRepository.create({
      actionType,
      userId,
      userName,
      userEmail,
      platformId,
      oldValues,
      newValues,
      description,
      ipAddress,
      userAgent,
    });

    return this.auditLogRepository.save(log);
  }

  /**
   * Get audit logs for a platform
   */
  async getAuditLogs(
    platformId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: IntegrationAuditLog[]; total: number }> {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (platformId) {
      query.where('log.platformId = :platformId', { platformId });
    }

    const [logs, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(
    platformId: string,
    status?: WebhookDeliveryStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    const query = this.webhookDeliveryRepository.createQueryBuilder('delivery')
      .where('delivery.platformId = :platformId', { platformId });

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    const [deliveries, total] = await query
      .orderBy('delivery.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { deliveries, total };
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(platformId?: string, days: number = 30): Promise<{
    totalPlatforms: number;
    activePlatforms: number;
    totalWebhooks: number;
    successfulWebhooks: number;
    failedWebhooks: number;
    webhookSuccessRate: number;
    totalApplications: number;
    totalRepayments: number;
    totalRepaymentAmount: number;
    webhookDeliveriesByDay: Array<{ date: string; success: number; failed: number }>;
    topEvents: Array<{ eventType: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Platform stats
    const platformQuery = this.platformRepository.createQueryBuilder('platform');
    if (platformId) {
      platformQuery.where('platform.id = :platformId', { platformId });
    }
    const totalPlatforms = await platformQuery.getCount();
    const activePlatforms = await platformQuery
      .andWhere('platform.status = :status', { status: PlatformStatus.ACTIVE })
      .getCount();

    // Webhook stats
    const webhookQuery = this.webhookDeliveryRepository.createQueryBuilder('delivery')
      .where('delivery.createdAt >= :startDate', { startDate });
    if (platformId) {
      webhookQuery.andWhere('delivery.platformId = :platformId', { platformId });
    }

    const totalWebhooks = await webhookQuery.getCount();
    const successfulWebhooks = await webhookQuery
      .clone()
      .andWhere('delivery.status = :status', { status: WebhookDeliveryStatus.SUCCESS })
      .getCount();
    const failedWebhooks = await webhookQuery
      .clone()
      .andWhere('delivery.status = :status', { status: WebhookDeliveryStatus.FAILED })
      .getCount();

    const webhookSuccessRate = totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks) * 100 : 0;

    // Application and repayment stats
    const appQuery = this.externalApplicationRepository.createQueryBuilder('app')
      .where('app.createdAt >= :startDate', { startDate });
    if (platformId) {
      appQuery.andWhere('app.platformId = :platformId', { platformId });
    }
    const totalApplications = await appQuery.getCount();

    const repaymentQuery = this.externalRepaymentRepository.createQueryBuilder('repayment')
      .where('repayment.createdAt >= :startDate', { startDate });
    if (platformId) {
      repaymentQuery.andWhere('repayment.platformId = :platformId', { platformId });
    }
    const repayments = await repaymentQuery.getMany();
    const totalRepayments = repayments.length;
    const totalRepaymentAmount = repayments.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // Webhook deliveries by day
    const deliveriesByDay = await this.webhookDeliveryRepository
      .createQueryBuilder('delivery')
      .select("DATE(delivery.createdAt)", "date")
      .addSelect("SUM(CASE WHEN delivery.status = 'Success' THEN 1 ELSE 0 END)", "success")
      .addSelect("SUM(CASE WHEN delivery.status = 'Failed' THEN 1 ELSE 0 END)", "failed")
      .where('delivery.createdAt >= :startDate', { startDate })
      .groupBy("DATE(delivery.createdAt)")
      .orderBy("date", "ASC")
      .getRawMany();

    const webhookDeliveriesByDay = deliveriesByDay.map((row: any) => ({
      date: row.date,
      success: parseInt(row.success) || 0,
      failed: parseInt(row.failed) || 0,
    }));

    // Top events
    const topEvents = await this.webhookDeliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('delivery.createdAt >= :startDate', { startDate })
      .groupBy('delivery.eventType')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalPlatforms,
      activePlatforms,
      totalWebhooks,
      successfulWebhooks,
      failedWebhooks,
      webhookSuccessRate: Math.round(webhookSuccessRate * 100) / 100,
      totalApplications,
      totalRepayments,
      totalRepaymentAmount,
      webhookDeliveriesByDay,
      topEvents: topEvents.map((row: any) => ({
        eventType: row.eventType,
        count: parseInt(row.count) || 0,
      })),
    };
  }

  /**
   * Get integration health status
   */
  async getIntegrationHealth(platformId: string): Promise<{
    platformId: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastWebhookSuccess: Date | null;
    lastWebhookFailure: Date | null;
    recentFailureRate: number;
    webhookResponseTime: number | null;
    issues: string[];
  }> {
    const platform = await this.platformRepository.findOne({
      where: { id: platformId },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${platformId} not found`);
    }

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Get recent webhook deliveries
    const recentDeliveries = await this.webhookDeliveryRepository.find({
      where: { platformId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const last24HourDeliveries = recentDeliveries.filter(
      (d) => new Date(d.createdAt) >= last24Hours,
    );

    const lastSuccess = recentDeliveries.find((d) => d.status === WebhookDeliveryStatus.SUCCESS);
    const lastFailure = recentDeliveries.find((d) => d.status === WebhookDeliveryStatus.FAILED);

    const failures = last24HourDeliveries.filter((d) => d.status === WebhookDeliveryStatus.FAILED);
    const recentFailureRate =
      last24HourDeliveries.length > 0 ? (failures.length / last24HourDeliveries.length) * 100 : 0;

    // Calculate average response time (if available)
    const successfulDeliveries = recentDeliveries.filter((d) => d.status === WebhookDeliveryStatus.SUCCESS);
    // Note: We don't track response time currently, but this is a placeholder for future enhancement

    const issues: string[] = [];

    if (platform.status !== PlatformStatus.ACTIVE) {
      issues.push(`Platform status is ${platform.status}`);
    }

    if (!platform.webhookUrl) {
      issues.push('Webhook URL not configured');
    }

    if (recentFailureRate > 50) {
      issues.push(`High failure rate: ${recentFailureRate.toFixed(1)}%`);
    }

    if (lastFailure && (!lastSuccess || new Date(lastFailure.createdAt) > new Date(lastSuccess.createdAt))) {
      const hoursSinceFailure = (Date.now() - new Date(lastFailure.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceFailure < 1) {
        issues.push('Recent webhook failures detected');
      }
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0 || recentFailureRate > 30) {
      status = recentFailureRate > 50 ? 'unhealthy' : 'degraded';
    }

    return {
      platformId,
      status,
      lastWebhookSuccess: lastSuccess ? new Date(lastSuccess.deliveredAt || lastSuccess.createdAt) : null,
      lastWebhookFailure: lastFailure ? new Date(lastFailure.createdAt) : null,
      recentFailureRate: Math.round(recentFailureRate * 100) / 100,
      webhookResponseTime: null, // Placeholder for future enhancement
      issues,
    };
  }
}

