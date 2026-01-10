import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { PreApproval, PreApprovalStatus } from '../entities/pre-approval.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { CreatePreApprovalDto, PreApprovalResult } from '../dto/pre-approval.dto';
import { ApprovalPredictorService } from '../../approval-predictor/services/approval-predictor.service';
import { FinancialHealthService } from '../../financial-health/services/financial-health.service';

@Injectable()
export class PreApprovalService {
  private readonly logger = new Logger(PreApprovalService.name);

  constructor(
    @InjectRepository(PreApproval)
    private readonly preApprovalRepository: Repository<PreApproval>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    private readonly approvalPredictor: ApprovalPredictorService,
    private readonly financialHealthService: FinancialHealthService,
  ) {}

  /**
   * Create a pre-approval
   */
  async createPreApproval(
    dto: CreatePreApprovalDto,
    companyId: string,
  ): Promise<PreApprovalResult> {
    this.logger.log(`Creating pre-approval for applicant ${dto.applicantId}`);

    // Validate loan product
    const product = await this.loanProductRepository.findOne({
      where: { id: dto.loanProductId, companyId },
    });

    if (!product) {
      throw new NotFoundException('Loan product not found or access denied');
    }

    // Calculate financial health
    const healthScore = await this.financialHealthService.calculateFinancialHealth(
      {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType,
        includeCreditScore: true,
        includeLoanHistory: true,
        includePaymentBehavior: true,
      },
      companyId,
    );

    // Predict approval probability
    const prediction = await this.approvalPredictor.predictApproval(
      {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType,
        loanProductId: dto.loanProductId,
        requestedAmount: dto.requestedAmount || healthScore.eligibleLoanAmount || 100000,
        monthlyIncome: dto.monthlyIncome,
        creditScore: dto.creditScore,
        employmentType: dto.employmentType,
        hasCollateral: dto.hasCollateral,
      },
      companyId,
    );

    // Determine pre-approval eligibility
    const isPreApproved = prediction.predictedOutcome === 'LIKELY_APPROVED' && prediction.probability >= 0.7;

    if (!isPreApproved) {
      throw new BadRequestException(
        `Not eligible for pre-approval. Approval probability: ${prediction.probabilityPercentage}%. ${prediction.recommendations.join(' ')}`,
      );
    }

    // Calculate pre-approved amount (typically 80-100% of requested or eligible)
    const requestedAmount = dto.requestedAmount || healthScore.eligibleLoanAmount || 100000;
    const preApprovedAmount = Math.min(
      Math.floor(prediction.estimatedApprovedAmount || requestedAmount * 0.9),
      product.maximumLoanAmount || Infinity,
    );

    // Calculate pre-approved rate
    const preApprovedRate = prediction.estimatedInterestRate || healthScore.recommendedRateRange?.likely || Number(product.rateOfInterest);

    // Default tenure (can be customized)
    const preApprovedTenure = 24; // Default 24 months

    // Generate pre-approval code
    const preApprovalCode = await this.generatePreApprovalCode(companyId);

    // Set validity (default 30 days)
    const validityDays = 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    // Create pre-approval record
    const preApproval = this.preApprovalRepository.create({
      preApprovalCode,
      companyId,
      applicantType: dto.applicantType,
      applicantId: dto.applicantId,
      loanProductId: dto.loanProductId,
      preApprovedAmount,
      preApprovedRate,
      preApprovedTenure,
      status: PreApprovalStatus.ACTIVE,
      validityDays,
      expiryDate,
      conditions: prediction.recommendations,
      metadata: {
        creditScore: dto.creditScore,
        monthlyIncome: dto.monthlyIncome,
        employmentType: dto.employmentType,
        hasCollateral: dto.hasCollateral,
        approvalProbability: prediction.probability,
        financialHealthScore: healthScore.overallScore,
      },
    });

    const saved = await this.preApprovalRepository.save(preApproval);

    // Determine next steps
    const nextSteps = [
      'Submit a formal loan application using the pre-approval code',
      'Provide required documents (ID, income proof, etc.)',
      'Complete KYC verification',
      'Final approval will be subject to document verification',
    ];

    return {
      preApprovalId: saved.id,
      isPreApproved: true,
      preApprovedAmount,
      preApprovedRate,
      preApprovedTenure,
      validityDays,
      expiryDate: expiryDate.toISOString().split('T')[0],
      preApprovalCode,
      conditions: prediction.recommendations,
      nextSteps,
    };
  }

  /**
   * Get pre-approval by code
   */
  async getPreApprovalByCode(
    preApprovalCode: string,
    companyId: string,
  ): Promise<PreApproval> {
    const preApproval = await this.preApprovalRepository.findOne({
      where: { preApprovalCode, companyId },
    });

    if (!preApproval) {
      throw new NotFoundException('Pre-approval not found');
    }

    // Check if expired
    if (preApproval.expiryDate < new Date() && preApproval.status === PreApprovalStatus.ACTIVE) {
      preApproval.status = PreApprovalStatus.EXPIRED;
      await this.preApprovalRepository.save(preApproval);
    }

    return preApproval;
  }

  /**
   * Use pre-approval in application
   */
  async usePreApproval(
    preApprovalCode: string,
    applicationId: string,
    companyId: string,
  ): Promise<void> {
    const preApproval = await this.getPreApprovalByCode(preApprovalCode, companyId);

    if (preApproval.status !== PreApprovalStatus.ACTIVE) {
      throw new BadRequestException(`Pre-approval is ${preApproval.status}`);
    }

    if (preApproval.expiryDate < new Date()) {
      throw new BadRequestException('Pre-approval has expired');
    }

    // Verify application exists and matches
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, companyId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (
      application.applicantId !== preApproval.applicantId ||
      application.loanProductId !== preApproval.loanProductId
    ) {
      throw new BadRequestException('Application does not match pre-approval');
    }

    // Mark pre-approval as used
    preApproval.status = PreApprovalStatus.USED;
    preApproval.usedInApplicationId = applicationId;
    preApproval.usedAt = new Date();

    await this.preApprovalRepository.save(preApproval);

    this.logger.log(`Pre-approval ${preApprovalCode} used in application ${applicationId}`);
  }

  /**
   * Get active pre-approvals for applicant
   */
  async getActivePreApprovals(
    applicantId: string,
    applicantType: string,
    companyId: string,
  ): Promise<PreApproval[]> {
    return await this.preApprovalRepository.find({
      where: {
        applicantId,
        applicantType: applicantType as any,
        companyId,
        status: PreApprovalStatus.ACTIVE,
        expiryDate: MoreThan(new Date()) as any,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Expire old pre-approvals (cron job)
   */
  async expireOldPreApprovals(): Promise<void> {
    const expired = await this.preApprovalRepository.find({
      where: {
        status: PreApprovalStatus.ACTIVE,
        expiryDate: LessThan(new Date()),
      },
    });

    for (const preApproval of expired) {
      preApproval.status = PreApprovalStatus.EXPIRED;
      await this.preApprovalRepository.save(preApproval);
    }

    this.logger.log(`Expired ${expired.length} pre-approvals`);
  }

  /**
   * Generate unique pre-approval code
   */
  private async generatePreApprovalCode(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.preApprovalRepository.count({
      where: {
        companyId,
        createdAt: new Date(year, 0, 1) as any,
      } as any,
    });

    const sequence = (count + 1).toString().padStart(6, '0');
    return `PRE-${year}-${sequence}`;
  }
}

