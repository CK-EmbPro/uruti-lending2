import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdverseActionNotice, NoticeStatus } from '../entities/adverse-action-notice.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { CreditDecision, DecisionOutcome } from '../entities/credit-decision.entity';
import { CreateAdverseActionNoticeDto, UpdateAdverseActionNoticeDto } from '../dto/adverse-action-notice.dto';

/**
 * Service for adverse action notices
 * UC-010: Adverse Action Notice
 */
@Injectable()
export class AdverseActionService {
  private readonly logger = new Logger(AdverseActionService.name);

  constructor(
    @InjectRepository(AdverseActionNotice)
    private readonly noticeRepository: Repository<AdverseActionNotice>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
  ) {}

  /**
   * Generate adverse action notice for declined application
   */
  async generateAdverseActionNotice(
    applicationId: string,
    createDto?: CreateAdverseActionNoticeDto,
  ): Promise<AdverseActionNotice> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Check if application is declined
    const isRejected = application.status === ApplicationStatus.REJECTED;
    
    if (!isRejected) {
      throw new NotFoundException('Application must be declined to generate adverse action notice');
    }

    // Check if notice already exists
    const existingNotice = await this.noticeRepository.findOne({
      where: { applicationId },
    });

    if (existingNotice) {
      return existingNotice;
    }

    // Get credit decision
    const creditDecision = await this.creditDecisionRepository.findOne({
      where: { applicationId },
      order: { decisionDate: 'DESC' },
    });

    if (!creditDecision) {
      throw new NotFoundException('No credit decision found for this application');
    }

    // Extract adverse factors from decision
    const adverseFactors = this.extractAdverseFactors(creditDecision);
    const reasonForDecline = this.determineReasonForDecline(creditDecision, adverseFactors);

    // Generate notice number
    const noticeNumber = await this.generateNoticeNumber();

    // Create notice
    const notice = this.noticeRepository.create({
      applicationId: application.id,
      noticeNumber,
      status: NoticeStatus.GENERATED,
      creditScore: createDto?.creditScore || creditDecision.creditScore,
      adverseFactors: createDto?.adverseFactors || adverseFactors,
      reasonForDecline: createDto?.reasonForDecline || reasonForDecline,
      creditBureauInfo: createDto?.creditBureauInfo || this.getCreditBureauInfo(creditDecision),
      counteroffer: createDto?.counteroffer || this.generateCounteroffer(creditDecision),
      reconsiderationInstructions:
        createDto?.reconsiderationInstructions || this.generateReconsiderationInstructions(creditDecision),
      generatedDate: new Date(),
    });

    const savedNotice = await this.noticeRepository.save(notice);

    this.logger.log(`Adverse action notice generated for application ${application.applicationNumber}`);

    return savedNotice;
  }

  /**
   * Send adverse action notice to applicant
   */
  async sendNotice(noticeId: string, deliveryMethod: 'Email' | 'Mail' | 'Portal' = 'Email'): Promise<AdverseActionNotice> {
    const notice = await this.noticeRepository.findOne({
      where: { id: noticeId },
      relations: ['application'],
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    notice.status = NoticeStatus.SENT;
    notice.sentDate = new Date();
    notice.deliveryMethod = deliveryMethod;

    const savedNotice = await this.noticeRepository.save(notice);

    // In production, this would send email/mail/portal notification
    this.logger.log(`Adverse action notice ${notice.noticeNumber} sent via ${deliveryMethod}`);

    // Mark as delivered (in production, this would be updated when delivery is confirmed)
    savedNotice.status = NoticeStatus.DELIVERED;
    savedNotice.deliveredDate = new Date();

    return await this.noticeRepository.save(savedNotice);
  }

  /**
   * Log compliance for adverse action notice
   */
  async logCompliance(noticeId: string): Promise<AdverseActionNotice> {
    const notice = await this.noticeRepository.findOne({ where: { id: noticeId } });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    notice.complianceLogged = true;
    notice.complianceLogDate = new Date();

    const savedNotice = await this.noticeRepository.save(notice);

    // In production, this would log to a compliance/regulatory system
    this.logger.log(`Compliance logged for adverse action notice ${notice.noticeNumber}`);

    return savedNotice;
  }

  /**
   * Extract adverse factors from credit decision
   */
  private extractAdverseFactors(decision: CreditDecision): string[] {
    const factors: string[] = [];

    if (decision.creditScore < 600) {
      factors.push('Credit score below minimum threshold');
    }

    if (decision.debtToIncomeRatio && decision.debtToIncomeRatio > 0.5) {
      factors.push('Debt-to-income ratio too high');
    }

    if (decision.riskFactors) {
      if (decision.riskFactors.lowCreditScore) {
        factors.push('Low credit score');
      }
      if (decision.riskFactors.highDelinquencies) {
        factors.push('History of delinquencies');
      }
      if (decision.riskFactors.highUtilization) {
        factors.push('High credit utilization');
      }
      if (decision.riskFactors.publicRecords) {
        factors.push('Public records on credit report');
      }
      if (decision.riskFactors.highLoanAmount) {
        factors.push('Requested amount exceeds qualification');
      }
    }

    return factors.length > 0 ? factors : ['Credit profile does not meet minimum requirements'];
  }

  /**
   * Determine primary reason for decline
   */
  private determineReasonForDecline(decision: CreditDecision, factors: string[]): string {
    if (factors.length === 0) {
      return 'Application does not meet credit criteria';
    }

    // Primary reason is usually the first factor
    return factors[0];
  }

  /**
   * Get credit bureau information
   */
  private getCreditBureauInfo(decision: CreditDecision): Record<string, any> {
    return {
      bureau: 'Equifax', // In production, this would come from actual credit pull
      score: decision.creditScore,
      date: decision.decisionDate.toISOString(),
      model: 'FICO Score 8',
    };
  }

  /**
   * Generate counteroffer if applicable
   */
  private generateCounteroffer(decision: CreditDecision): string | null {
    // Generate counteroffer if score is close to threshold
    if (decision.creditScore >= 580 && decision.creditScore < 600) {
      const counterofferAmount = decision.approvedAmount ? decision.approvedAmount * 0.7 : null;
      if (counterofferAmount) {
        return `We can approve you for $${counterofferAmount.toLocaleString()} at ${(decision.approvedInterestRate || 0) + 2}% interest rate`;
      }
    }
    return null;
  }

  /**
   * Generate reconsideration instructions
   */
  private generateReconsiderationInstructions(decision: CreditDecision): string {
    const instructions: string[] = [];

    if (decision.creditScore < 600) {
      instructions.push('Improve your credit score by paying bills on time and reducing debt');
    }

    if (decision.debtToIncomeRatio && decision.debtToIncomeRatio > 0.5) {
      instructions.push('Reduce your debt-to-income ratio by paying down existing debts');
    }

    if (decision.riskFactors?.highUtilization) {
      instructions.push('Reduce credit card balances to lower your credit utilization');
    }

    if (instructions.length === 0) {
      return 'You may reapply after improving your credit profile. Consider working with a credit counselor.';
    }

    return `To improve your chances of approval: ${instructions.join('; ')}. You may reapply after making these improvements.`;
  }

  /**
   * Generate unique notice number
   */
  private async generateNoticeNumber(): Promise<string> {
    const prefix = 'AAN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get notice by ID
   */
  async getNotice(noticeId: string): Promise<AdverseActionNotice> {
    const notice = await this.noticeRepository.findOne({
      where: { id: noticeId },
      relations: ['application'],
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    return notice;
  }

  /**
   * Get notice for an application
   */
  async getNoticeForApplication(applicationId: string): Promise<AdverseActionNotice | null> {
    return await this.noticeRepository.findOne({
      where: { applicationId },
      order: { generatedDate: 'DESC' },
    });
  }

  /**
   * Get all notices
   */
  async getAllNotices(): Promise<AdverseActionNotice[]> {
    return await this.noticeRepository.find({
      order: { generatedDate: 'DESC' },
      relations: ['application'],
    });
  }

  /**
   * Update notice
   */
  async updateNotice(noticeId: string, updateDto: UpdateAdverseActionNoticeDto): Promise<AdverseActionNotice> {
    const notice = await this.noticeRepository.findOne({ where: { id: noticeId } });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${noticeId} not found`);
    }

    Object.assign(notice, updateDto);
    return await this.noticeRepository.save(notice);
  }
}

