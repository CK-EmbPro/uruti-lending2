import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnderwritingReview, ReviewStatus, ReviewPriority } from '../entities/underwriting-review.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { CreditDecision, DecisionOutcome, DecisionType } from '../entities/credit-decision.entity';
import { CreateUnderwritingReviewDto, UpdateUnderwritingReviewDto } from '../dto/underwriting-review.dto';

/**
 * Service for manual underwriting review
 * UC-007: Manual Underwriting Review
 */
@Injectable()
export class UnderwritingService {
  private readonly logger = new Logger(UnderwritingService.name);

  constructor(
    @InjectRepository(UnderwritingReview)
    private readonly reviewRepository: Repository<UnderwritingReview>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
  ) {}

  /**
   * Route complex application to underwriter
   */
  async routeToUnderwriter(
    applicationId: string,
    reviewerId: string,
    priority: ReviewPriority = ReviewPriority.MEDIUM,
  ): Promise<UnderwritingReview> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: { applicationId, status: ReviewStatus.PENDING },
    });

    if (existingReview) {
      throw new BadRequestException('Application already has a pending review');
    }

    // Determine priority based on application characteristics
    const calculatedPriority = this.calculatePriority(application, priority);

    const review = this.reviewRepository.create({
      applicationId: application.id,
      reviewerId,
      status: ReviewStatus.PENDING,
      priority: calculatedPriority,
      assignedDate: new Date(),
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update application status
    application.status = ApplicationStatus.UNDER_REVIEW;
    await this.applicationRepository.save(application);

    this.logger.log(`Application ${application.applicationNumber} routed to underwriter ${reviewerId}`);

    return savedReview;
  }

  /**
   * Start underwriting review
   */
  async startReview(reviewId: string, reviewerId: string): Promise<UnderwritingReview> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    if (review.reviewerId !== reviewerId) {
      throw new BadRequestException('You are not assigned to this review');
    }

    review.status = ReviewStatus.IN_PROGRESS;
    return await this.reviewRepository.save(review);
  }

  /**
   * Update underwriting review
   */
  async updateReview(reviewId: string, updateDto: UpdateUnderwritingReviewDto): Promise<UnderwritingReview> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    Object.assign(review, updateDto);
    return await this.reviewRepository.save(review);
  }

  /**
   * Complete underwriting review and make decision
   */
  async completeReview(
    reviewId: string,
    decision: 'Approve' | 'Conditionally Approve' | 'Decline',
    rationale: string,
    approvedAmount?: number,
    approvedInterestRate?: number,
    approvedTerm?: number,
    conditions?: string,
  ): Promise<{ review: UnderwritingReview; decision: CreditDecision }> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['application'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    review.status = ReviewStatus.COMPLETED;
    review.completedDate = new Date();
    review.decision = decision;
    review.decisionRationale = rationale;

    const savedReview = await this.reviewRepository.save(review);

    // Create credit decision
    let decisionOutcome: DecisionOutcome;
    if (decision === 'Approve') {
      decisionOutcome = DecisionOutcome.APPROVED;
    } else if (decision === 'Conditionally Approve') {
      decisionOutcome = DecisionOutcome.CONDITIONALLY_APPROVED;
    } else {
      decisionOutcome = DecisionOutcome.DECLINED;
    }

    const application = review.application;
    
    // Get existing credit decision for score if available
    const existingDecision = await this.creditDecisionRepository.findOne({
      where: { applicationId: application.id },
      order: { decisionDate: 'DESC' },
    });

    const creditDecision = this.creditDecisionRepository.create({
      applicationId: application.id,
      decisionType: DecisionType.MANUAL,
      outcome: decisionOutcome,
      creditScore: existingDecision?.creditScore || 0, // Use existing score if available
      approvedAmount: approvedAmount || application.requestedAmount,
      approvedInterestRate: approvedInterestRate,
      approvedTerm: approvedTerm || application.repaymentPeriods,
      decisionRationale: rationale,
      riskFactors: review.riskFactors || {},
      decisionDate: new Date(),
      decisionBy: review.reviewerId,
      conditions,
    });

    const savedDecision = await this.creditDecisionRepository.save(creditDecision);

    // Update application status
    if (decision === 'Approve' || decision === 'Conditionally Approve') {
      application.status = ApplicationStatus.APPROVED;
      application.approvalDate = new Date();
      application.approvedBy = review.reviewerId;
      application.approvedAmount = approvedAmount || application.requestedAmount;
    } else {
      application.status = ApplicationStatus.REJECTED;
      application.rejectionDate = new Date();
      application.rejectedBy = review.reviewerId;
    }

    await this.applicationRepository.save(application);

    this.logger.log(`Underwriting review ${reviewId} completed with decision: ${decision}`);

    return { review: savedReview, decision: savedDecision };
  }

  /**
   * Escalate review to senior underwriter
   */
  async escalateReview(reviewId: string, escalatedTo: string, reason: string): Promise<UnderwritingReview> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    review.status = ReviewStatus.ESCALATED;
    review.escalatedTo = escalatedTo;
    review.escalationReason = reason;
    review.reviewerId = escalatedTo; // Transfer to new reviewer

    return await this.reviewRepository.save(review);
  }

  /**
   * Request peer review
   */
  async requestPeerReview(reviewId: string, peerReviewerId: string): Promise<UnderwritingReview> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    review.requiresPeerReview = true;
    review.peerReviewerId = peerReviewerId;

    return await this.reviewRepository.save(review);
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<UnderwritingReview> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['application'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    return review;
  }

  /**
   * Get reviews for an application
   */
  async getReviewsForApplication(applicationId: string): Promise<UnderwritingReview[]> {
    return await this.reviewRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
      relations: ['application'],
    });
  }

  /**
   * Get reviews assigned to a reviewer
   */
  async getReviewsForReviewer(reviewerId: string): Promise<UnderwritingReview[]> {
    return await this.reviewRepository.find({
      where: { reviewerId },
      order: { priority: 'DESC', createdAt: 'DESC' },
      relations: ['application'],
    });
  }

  /**
   * Calculate review priority based on application characteristics
   */
  private calculatePriority(application: LoanApplication, defaultPriority: ReviewPriority): ReviewPriority {
    // High priority for large amounts
    if (application.requestedAmount > 200000) {
      return ReviewPriority.HIGH;
    }

    // Urgent for very large amounts
    if (application.requestedAmount > 500000) {
      return ReviewPriority.URGENT;
    }

    return defaultPriority;
  }
}

