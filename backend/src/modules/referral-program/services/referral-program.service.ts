import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CreateReferralDto, ReferralResult, GetReferralStatsDto, ReferralStatsResult } from '../dto/referral-program.dto';

@Injectable()
export class ReferralProgramService {
  private readonly logger = new Logger(ReferralProgramService.name);

  // Reward configuration
  private readonly REWARD_CONFIG = {
    SIGNED_UP: 0, // No reward for just signing up
    APPLICATION_SUBMITTED: 100, // $100 for application submission
    LOAN_APPROVED: 200, // $200 for loan approval
    LOAN_DISBURSED: 500, // $500 for loan disbursement
  };

  private readonly REFERRAL_EXPIRY_DAYS = 90; // Referral expires after 90 days

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Create a new referral
   */
  async createReferral(
    dto: CreateReferralDto,
    companyId: string,
  ): Promise<ReferralResult> {
    this.logger.log(`Creating referral for referrer ${dto.referrerId}`);

    // Generate referral code if not provided
    const referralCode = dto.referralCode || this.generateReferralCode();

    // Check if referral code already exists
    const existing = await this.referralRepository.findOne({
      where: { referralCode },
    });

    if (existing) {
      throw new Error('Referral code already exists');
    }

    // Check if email already referred
    const existingReferral = await this.referralRepository.findOne({
      where: { referredEmail: dto.referredEmail },
    });

    if (existingReferral) {
      throw new Error('This email has already been referred');
    }

    // Create referral
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.REFERRAL_EXPIRY_DAYS);

    const referral = this.referralRepository.create({
      referrerId: dto.referrerId,
      referralCode,
      referredEmail: dto.referredEmail,
      referredPhone: dto.referredPhone,
      status: ReferralStatus.PENDING,
      expiryDate,
    });

    const savedReferral = await this.referralRepository.save(referral);

    // Generate referral link
    const referralLink = this.generateReferralLink(referralCode);

    return {
      id: savedReferral.id,
      referralCode: savedReferral.referralCode,
      referrerId: savedReferral.referrerId,
      referredEmail: savedReferral.referredEmail,
      status: savedReferral.status,
      referralLink,
    };
  }

  /**
   * Track referral signup
   */
  async trackSignup(
    referralCode: string,
    customerId: string,
    companyId: string,
  ): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referralCode },
    });

    if (!referral) {
      this.logger.warn(`Referral code ${referralCode} not found`);
      return;
    }

    if (referral.status !== ReferralStatus.PENDING) {
      this.logger.warn(`Referral ${referralCode} already processed`);
      return;
    }

    referral.status = ReferralStatus.SIGNED_UP;
    referral.referredCustomerId = customerId;
    referral.signedUpDate = new Date();

    await this.referralRepository.save(referral);
  }

  /**
   * Track referral application
   */
  async trackApplication(
    referralCode: string,
    applicationId: string,
    companyId: string,
  ): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referralCode },
    });

    if (!referral) {
      return;
    }

    if (referral.status === ReferralStatus.REWARDED || referral.status === ReferralStatus.EXPIRED) {
      return;
    }

    referral.status = ReferralStatus.APPLICATION_SUBMITTED;
    referral.applicationId = applicationId;
    referral.rewardAmount = this.REWARD_CONFIG.APPLICATION_SUBMITTED;

    await this.referralRepository.save(referral);
  }

  /**
   * Track referral loan approval
   */
  async trackLoanApproval(
    referralCode: string,
    applicationId: string,
    companyId: string,
  ): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referralCode, applicationId },
    });

    if (!referral) {
      return;
    }

    if (referral.status === ReferralStatus.REWARDED || referral.status === ReferralStatus.EXPIRED) {
      return;
    }

    referral.status = ReferralStatus.LOAN_APPROVED;
    referral.rewardAmount = this.REWARD_CONFIG.LOAN_APPROVED;

    await this.referralRepository.save(referral);
  }

  /**
   * Track referral loan disbursement
   */
  async trackLoanDisbursement(
    referralCode: string,
    loanId: string,
    companyId: string,
  ): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { referralCode },
    });

    if (!referral) {
      return;
    }

    if (referral.status === ReferralStatus.REWARDED || referral.status === ReferralStatus.EXPIRED) {
      return;
    }

    referral.status = ReferralStatus.LOAN_DISBURSED;
    referral.loanId = loanId;
    referral.rewardAmount = this.REWARD_CONFIG.LOAN_DISBURSED;

    await this.referralRepository.save(referral);

    // Auto-pay reward (in production, integrate with payment system)
    await this.payReward(referral.id, companyId);
  }

  /**
   * Pay referral reward
   */
  async payReward(referralId: string, companyId: string): Promise<void> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
    });

    if (!referral || referral.rewardPaid) {
      return;
    }

    // In production, integrate with payment system
    // For now, just mark as paid
    referral.rewardPaid = true;
    referral.rewardPaidDate = new Date();
    referral.status = ReferralStatus.REWARDED;

    await this.referralRepository.save(referral);

    this.logger.log(`Reward paid for referral ${referralId}: $${referral.rewardAmount}`);
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(
    dto: GetReferralStatsDto,
    companyId: string,
  ): Promise<ReferralStatsResult> {
    const referrals = await this.referralRepository.find({
      where: { referrerId: dto.customerId },
    });

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(
      (r) => r.status !== ReferralStatus.EXPIRED && r.status !== ReferralStatus.REWARDED,
    ).length;
    const successfulReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.LOAN_DISBURSED || r.status === ReferralStatus.REWARDED,
    ).length;

    const totalRewardsEarned = referrals
      .filter((r) => r.rewardPaid)
      .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

    const pendingRewards = referrals
      .filter((r) => !r.rewardPaid && r.rewardAmount > 0)
      .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

    const breakdownByStatus: Record<ReferralStatus, number> = {
      [ReferralStatus.PENDING]: 0,
      [ReferralStatus.SIGNED_UP]: 0,
      [ReferralStatus.APPLICATION_SUBMITTED]: 0,
      [ReferralStatus.LOAN_APPROVED]: 0,
      [ReferralStatus.LOAN_DISBURSED]: 0,
      [ReferralStatus.REWARDED]: 0,
      [ReferralStatus.EXPIRED]: 0,
    };

    for (const referral of referrals) {
      breakdownByStatus[referral.status]++;
    }

    return {
      totalReferrals,
      activeReferrals,
      successfulReferrals,
      totalRewardsEarned: Math.round(totalRewardsEarned * 100) / 100,
      pendingRewards: Math.round(pendingRewards * 100) / 100,
      breakdownByStatus,
    };
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    const prefix = 'REF';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  }

  /**
   * Generate referral link
   */
  private generateReferralLink(referralCode: string): string {
    // In production, use actual domain from config
    const baseUrl = process.env.FRONTEND_URL || 'https://app.example.com';
    return `${baseUrl}/signup?ref=${referralCode}`;
  }

  /**
   * Get referral by code
   */
  async getReferralByCode(referralCode: string): Promise<Referral | null> {
    return await this.referralRepository.findOne({
      where: { referralCode },
    });
  }
}

