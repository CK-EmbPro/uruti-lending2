import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { PreApprovedOffer } from '../entities/pre-approved-offer.entity';
import { CampaignResponse } from '../entities/campaign-response.entity';
import { CrossSellOpportunity } from '../entities/cross-sell-opportunity.entity';
import { Referral } from '../entities/referral.entity';
import { ReferralBonus } from '../entities/referral-bonus.entity';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { OfferStatus } from '../../../common/enums/offer-status.enum';
import { OpportunityStatus } from '../../../common/enums/opportunity-status.enum';
import { ReferralStatus } from '../../../common/enums/referral-status.enum';
import { CreateCampaignDto, UpdateCampaignDto, LaunchCampaignDto, QueryCampaignsDto } from '../dto/campaign.dto';
import { GenerateOffersDto, SendOfferDto, TrackOfferResponseDto, AcceptOfferDto, DeclineOfferDto, QueryOffersDto } from '../dto/pre-approved-offer.dto';
import { IdentifyOpportunitiesDto, AssignOpportunityDto, ContactCustomerDto, PresentOfferDto, UpdateOpportunityStatusDto, QueryOpportunitiesDto } from '../dto/cross-sell-opportunity.dto';
import { CreateReferralDto, UpdateReferralStatusDto, CreditReferralBonusDto, QueryReferralsDto, QueryReferralBonusesDto, UpdateReferralBonusStatusDto } from '../dto/referral.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PreApprovedOffer)
    private readonly offerRepository: Repository<PreApprovedOffer>,
    @InjectRepository(CampaignResponse)
    private readonly responseRepository: Repository<CampaignResponse>,
    @InjectRepository(CrossSellOpportunity)
    private readonly opportunityRepository: Repository<CrossSellOpportunity>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(ReferralBonus)
    private readonly bonusRepository: Repository<ReferralBonus>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * UC-058: Pre-Approved Offer Campaign
   */

  async createCampaign(dto: CreateCampaignDto, userId: string, userName: string): Promise<Campaign> {
    // Estimate eligible count based on target criteria
    const estimatedCount = await this.estimateEligibleCustomers(dto.targetCriteria);

    const campaign = this.campaignRepository.create({
      ...dto,
      createdBy: userId,
      createdByName: userName,
      estimatedEligibleCount: estimatedCount,
      status: CampaignStatus.DRAFT,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);
    this.logger.log(`Campaign created: ${savedCampaign.campaignName} by ${userName}`);
    return savedCampaign;
  }

  private async estimateEligibleCustomers(criteria: Record<string, any>): Promise<number> {
    // Simplified estimation - in production, this would query based on criteria
    if (criteria.loanStatus) {
      const count = await this.loanRepository.count({ where: { status: criteria.loanStatus } });
      return count;
    }
    // Default estimation
    return 0;
  }

  async generatePreApprovedOffers(dto: GenerateOffersDto, userId: string, userName: string): Promise<PreApprovedOffer[]> {
    const campaign = await this.campaignRepository.findOne({ where: { id: dto.campaignId } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    // Identify eligible customers based on target criteria
    const eligibleCustomers = await this.identifyEligibleCustomers(campaign.targetCriteria, dto.limit);

    const offers: PreApprovedOffer[] = [];

    for (const customer of eligibleCustomers) {
      const offerCode = this.generateOfferCode(campaign.id, customer.id);

      const offer = this.offerRepository.create({
        campaignId: campaign.id,
        customerId: customer.id,
        offerCode,
        approvedAmount: campaign.offerDetails.approvedAmount || 10000,
        interestRate: campaign.offerDetails.interestRate || 5.5,
        termMonths: campaign.offerDetails.termMonths || 36,
        additionalTerms: campaign.offerDetails.additionalTerms || {},
        status: OfferStatus.PENDING,
        distributionChannel: campaign.distributionChannel,
        expiryDate: campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      });

      offers.push(offer);
    }

    const savedOffers = await this.offerRepository.save(offers);

    // Update campaign counts
    campaign.actualEligibleCount = savedOffers.length;
    await this.campaignRepository.save(campaign);

    this.logger.log(`Generated ${savedOffers.length} pre-approved offers for campaign ${dto.campaignId}`);
    return savedOffers;
  }

  private async identifyEligibleCustomers(criteria: Record<string, any>, limit?: number): Promise<any[]> {
    // Simplified - in production, this would query based on criteria
    if (criteria.loanStatus) {
      const loans = await this.loanRepository.find({
        where: { status: criteria.loanStatus as any },
        take: limit,
      });
      // Return unique customer IDs or loan IDs as fallback
      const customerIds = new Set<string>();
      loans.forEach((loan) => {
        // Assuming loan has some identifier - using loan.id as fallback
        const id = (loan as any).customerId || loan.id;
        customerIds.add(id);
      });
      return Array.from(customerIds).map((id) => ({ id }));
    }
    return [];
  }

  private generateOfferCode(campaignId: string, customerId: string): string {
    const timestamp = Date.now().toString(36);
    const shortCampaignId = campaignId.substring(0, 8);
    const shortCustomerId = customerId.substring(0, 8);
    return `OFFER-${shortCampaignId}-${shortCustomerId}-${timestamp}`.toUpperCase();
  }

  async sendOffer(dto: SendOfferDto, userId: string, userName: string): Promise<PreApprovedOffer> {
    const offer = await this.offerRepository.findOne({ where: { id: dto.offerId } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${dto.offerId} not found`);
    }

    offer.status = OfferStatus.SENT;
    offer.sentAt = new Date();
    if (dto.channel) {
      offer.distributionChannel = dto.channel;
    }

    const updatedOffer = await this.offerRepository.save(offer);

    // Update campaign stats
    const campaign = await this.campaignRepository.findOne({ where: { id: offer.campaignId } });
    if (campaign) {
      campaign.offersSent = (campaign.offersSent || 0) + 1;
      await this.campaignRepository.save(campaign);
    }

    // Create response record
    await this.createCampaignResponse({
      campaignId: offer.campaignId,
      offerId: offer.id,
      customerId: offer.customerId,
      responseType: 'sent',
      responseDate: new Date().toISOString(),
    });

    this.logger.log(`Offer ${dto.offerId} sent via ${offer.distributionChannel}`);
    return updatedOffer;
  }

  async trackOfferResponse(dto: TrackOfferResponseDto, userId: string, userName: string): Promise<CampaignResponse> {
    const offer = await this.offerRepository.findOne({ where: { id: dto.offerId } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${dto.offerId} not found`);
    }

    // Update offer status based on response type
    if (dto.responseType === 'viewed' && offer.status === OfferStatus.SENT) {
      offer.status = OfferStatus.VIEWED;
      offer.viewedAt = new Date();
      offer.viewCount = (offer.viewCount || 0) + 1;

      const campaign = await this.campaignRepository.findOne({ where: { id: offer.campaignId } });
      if (campaign) {
        campaign.offersViewed = (campaign.offersViewed || 0) + 1;
        await this.campaignRepository.save(campaign);
      }
    }

    await this.offerRepository.save(offer);

    // Create response record
    const response = this.responseRepository.create({
      campaignId: offer.campaignId,
      offerId: offer.id,
      customerId: offer.customerId,
      responseType: dto.responseType,
      responseDate: new Date(),
      responseData: dto.responseData,
      remarks: dto.remarks,
    });

    const savedResponse = await this.responseRepository.save(response);
    this.logger.log(`Tracked ${dto.responseType} response for offer ${dto.offerId}`);
    return savedResponse;
  }

  async acceptOffer(offerId: string, dto: AcceptOfferDto, userId: string, userName: string): Promise<PreApprovedOffer> {
    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    if (offer.status === OfferStatus.EXPIRED) {
      throw new BadRequestException('Cannot accept an expired offer');
    }

    offer.status = OfferStatus.ACCEPTED;
    offer.acceptedAt = new Date();

    const updatedOffer = await this.offerRepository.save(offer);

    // Update campaign stats
    const campaign = await this.campaignRepository.findOne({ where: { id: offer.campaignId } });
    if (campaign) {
      campaign.offersAccepted = (campaign.offersAccepted || 0) + 1;
      await this.campaignRepository.save(campaign);
    }

    // Create response record
    await this.createCampaignResponse({
      campaignId: offer.campaignId,
      offerId: offer.id,
      customerId: offer.customerId,
      responseType: 'accepted',
      responseDate: new Date().toISOString(),
      remarks: dto.remarks,
    });

    this.logger.log(`Offer ${offerId} accepted by customer`);
    return updatedOffer;
  }

  async declineOffer(offerId: string, dto: DeclineOfferDto, userId: string, userName: string): Promise<PreApprovedOffer> {
    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    offer.status = OfferStatus.DECLINED;
    offer.declinedAt = new Date();
    offer.declineReason = dto.declineReason;

    const updatedOffer = await this.offerRepository.save(offer);

    // Create response record
    await this.createCampaignResponse({
      campaignId: offer.campaignId,
      offerId: offer.id,
      customerId: offer.customerId,
      responseType: 'declined',
      responseDate: new Date().toISOString(),
      responseData: { declineReason: dto.declineReason },
    });

    this.logger.log(`Offer ${offerId} declined by customer`);
    return updatedOffer;
  }

  async convertOffer(offerId: string, applicationId: string, userId: string, userName: string): Promise<PreApprovedOffer> {
    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    offer.converted = true;
    offer.status = OfferStatus.CONVERTED;
    offer.convertedLoanApplicationId = applicationId;
    offer.convertedAt = new Date();

    const updatedOffer = await this.offerRepository.save(offer);

    // Update campaign stats
    const campaign = await this.campaignRepository.findOne({ where: { id: offer.campaignId } });
    if (campaign) {
      campaign.offersConverted = (campaign.offersConverted || 0) + 1;
      await this.campaignRepository.save(campaign);
    }

    // Create response record
    await this.createCampaignResponse({
      campaignId: offer.campaignId,
      offerId: offer.id,
      customerId: offer.customerId,
      responseType: 'converted',
      responseDate: new Date().toISOString(),
      responseData: { applicationId },
    });

    this.logger.log(`Offer ${offerId} converted to application ${applicationId}`);
    return updatedOffer;
  }

  async calculateCampaignROI(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    // Calculate ROI: ((Revenue - Cost) / Cost) * 100
    const cost = Number(campaign.totalCampaignCost || 0);
    const revenue = Number(campaign.totalRevenue || 0);

    if (cost > 0) {
      campaign.roi = ((revenue - cost) / cost) * 100;
    } else {
      campaign.roi = revenue > 0 ? 100 : 0;
    }

    const updatedCampaign = await this.campaignRepository.save(campaign);
    this.logger.log(`Calculated ROI for campaign ${campaignId}: ${campaign.roi}%`);
    return updatedCampaign;
  }

  async getCampaigns(filters: QueryCampaignsDto): Promise<Campaign[]> {
    const query = this.campaignRepository.createQueryBuilder('campaign');

    if (filters.campaignType) {
      query.andWhere('campaign.campaignType = :campaignType', { campaignType: filters.campaignType });
    }
    if (filters.status) {
      query.andWhere('campaign.status = :status', { status: filters.status });
    }
    if (filters.createdBy) {
      query.andWhere('campaign.createdBy = :createdBy', { createdBy: filters.createdBy });
    }

    query.orderBy('campaign.createdAt', 'DESC');
    return query.getMany();
  }

  async getCampaign(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async getOffers(filters: QueryOffersDto): Promise<PreApprovedOffer[]> {
    const query = this.offerRepository.createQueryBuilder('offer');

    if (filters.campaignId) {
      query.andWhere('offer.campaignId = :campaignId', { campaignId: filters.campaignId });
    }
    if (filters.customerId) {
      query.andWhere('offer.customerId = :customerId', { customerId: filters.customerId });
    }
    if (filters.status) {
      query.andWhere('offer.status = :status', { status: filters.status });
    }
    if (filters.converted !== undefined) {
      query.andWhere('offer.converted = :converted', { converted: filters.converted });
    }

    query.orderBy('offer.createdAt', 'DESC');
    return query.getMany();
  }

  async getOffer(id: string): Promise<PreApprovedOffer> {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  private async createCampaignResponse(data: {
    campaignId: string;
    offerId?: string;
    customerId: string;
    responseType: string;
    responseDate: string;
    responseData?: Record<string, any>;
    remarks?: string;
  }): Promise<CampaignResponse> {
    const response = this.responseRepository.create({
      ...data,
      responseDate: new Date(data.responseDate),
    });
    return this.responseRepository.save(response);
  }

  /**
   * UC-059: Cross-Sell Opportunity Identification
   */

  async identifyOpportunities(dto: IdentifyOpportunitiesDto, userId: string, userName: string): Promise<CrossSellOpportunity[]> {
    // Analyze customer behavior and identify opportunities
    const customers = dto.customerId
      ? [{ id: dto.customerId }]
      : await this.getCustomersForAnalysis(dto.limit);

    const opportunities: CrossSellOpportunity[] = [];

    for (const customer of customers) {
      const behaviorData = await this.analyzeCustomerBehavior(customer.id);
      const identifiedOpportunities = await this.identifyOpportunitiesFromBehavior(customer.id, behaviorData);

      for (const opp of identifiedOpportunities) {
        const opportunity = this.opportunityRepository.create({
          customerId: customer.id,
          opportunityType: opp.type,
          opportunityDetails: opp.details,
          confidenceScore: opp.confidenceScore,
          behaviorData,
          analysisNotes: opp.notes,
          identifiedAt: new Date(),
          identifiedBy: 'System',
          identificationReason: opp.reason,
          status: OpportunityStatus.IDENTIFIED,
        });

        opportunities.push(opportunity);
      }
    }

    const savedOpportunities = await this.opportunityRepository.save(opportunities);
    this.logger.log(`Identified ${savedOpportunities.length} cross-sell opportunities`);
    return savedOpportunities;
  }

  private async getCustomersForAnalysis(limit?: number): Promise<any[]> {
    // Simplified - in production, this would query active customers
    const loans = await this.loanRepository.find({
      where: { status: 'Active' as any },
      take: limit || 100,
    });
    // Return loan IDs as customer identifiers (simplified - in production would use actual customer IDs)
    return loans.map((loan) => ({ id: loan.id }));
  }

  private async analyzeCustomerBehavior(customerId: string): Promise<Record<string, any>> {
    // Simplified behavior analysis - in production, this would analyze transaction history, loan performance, etc.
    // Note: Loan entity may not have customerId directly, using a simplified query
    const loans = await this.loanRepository.find({
      take: 100, // Simplified - in production would filter by customer
    }) || [];

    return {
      totalLoans: loans.length,
      activeLoans: loans.filter((l) => l.status === 'Active').length,
      totalBorrowed: loans.reduce((sum, l) => sum + Number(l.loanAmount || 0), 0),
      averageLoanAmount: loans.length > 0
        ? loans.reduce((sum, l) => sum + Number(l.loanAmount || 0), 0) / loans.length
        : 0,
      paymentHistory: 'Good', // Simplified
    };
  }

  private async identifyOpportunitiesFromBehavior(
    customerId: string,
    behaviorData: Record<string, any>,
  ): Promise<Array<{ type: string; details: Record<string, any>; confidenceScore: number; notes: string; reason: string }>> {
    const opportunities: Array<{ type: string; details: Record<string, any>; confidenceScore: number; notes: string; reason: string }> = [];

    // Example: If customer has active loans and good payment history, suggest additional loan
    if (behaviorData.activeLoans > 0 && behaviorData.paymentHistory === 'Good') {
      opportunities.push({
        type: 'Additional Loan',
        details: {
          recommendedAmount: behaviorData.averageLoanAmount * 1.5,
          recommendedTerm: 36,
        },
        confidenceScore: 75,
        notes: 'Customer has good payment history and may benefit from additional credit',
        reason: 'Good payment history with existing loans',
      });
    }

    return opportunities;
  }

  async assignOpportunity(opportunityId: string, dto: AssignOpportunityDto, userId: string, userName: string): Promise<CrossSellOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    opportunity.assignedTo = dto.assignedTo;
    opportunity.assignedToName = userName;
    opportunity.assignedAt = new Date();
    opportunity.status = OpportunityStatus.CONTACTED;

    const updatedOpportunity = await this.opportunityRepository.save(opportunity);
    this.logger.log(`Opportunity ${opportunityId} assigned to ${dto.assignedTo}`);
    return updatedOpportunity;
  }

  async contactCustomer(opportunityId: string, dto: ContactCustomerDto, userId: string, userName: string): Promise<CrossSellOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    opportunity.contactedAt = new Date();
    opportunity.contactMethod = dto.contactMethod;
    opportunity.contactNotes = dto.contactNotes;
    opportunity.status = OpportunityStatus.CONTACTED;

    const updatedOpportunity = await this.opportunityRepository.save(opportunity);
    this.logger.log(`Customer contacted for opportunity ${opportunityId}`);
    return updatedOpportunity;
  }

  async presentOffer(opportunityId: string, dto: PresentOfferDto, userId: string, userName: string): Promise<CrossSellOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    opportunity.offerPresentedAt = new Date();
    opportunity.offerDetails = dto.offerDetails;
    opportunity.status = OpportunityStatus.OFFER_PRESENTED;

    const updatedOpportunity = await this.opportunityRepository.save(opportunity);
    this.logger.log(`Offer presented for opportunity ${opportunityId}`);
    return updatedOpportunity;
  }

  async updateOpportunityStatus(
    opportunityId: string,
    dto: UpdateOpportunityStatusDto,
    userId: string,
    userName: string,
  ): Promise<CrossSellOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    opportunity.status = dto.status;

    if (dto.status === OpportunityStatus.ACCEPTED) {
      opportunity.acceptedAt = new Date();
    } else if (dto.status === OpportunityStatus.DECLINED) {
      opportunity.declinedAt = new Date();
      opportunity.declineReason = dto.declineReason;
    } else if (dto.status === OpportunityStatus.CONVERTED) {
      opportunity.convertedAt = new Date();
      opportunity.convertedApplicationId = dto.convertedApplicationId;
    }

    const updatedOpportunity = await this.opportunityRepository.save(opportunity);
    this.logger.log(`Opportunity ${opportunityId} status updated to ${dto.status}`);
    return updatedOpportunity;
  }

  async getOpportunities(filters: QueryOpportunitiesDto): Promise<CrossSellOpportunity[]> {
    const query = this.opportunityRepository.createQueryBuilder('opportunity');

    if (filters.customerId) {
      query.andWhere('opportunity.customerId = :customerId', { customerId: filters.customerId });
    }
    if (filters.status) {
      query.andWhere('opportunity.status = :status', { status: filters.status });
    }
    if (filters.assignedTo) {
      query.andWhere('opportunity.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.opportunityType) {
      query.andWhere('opportunity.opportunityType = :opportunityType', { opportunityType: filters.opportunityType });
    }

    query.orderBy('opportunity.identifiedAt', 'DESC');
    return query.getMany();
  }

  async getOpportunity(id: string): Promise<CrossSellOpportunity> {
    const opportunity = await this.opportunityRepository.findOne({ where: { id } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return opportunity;
  }

  /**
   * UC-060: Referral Program Management
   */

  async createReferral(dto: CreateReferralDto, userId: string, userName: string): Promise<Referral> {
    const referralCode = dto.referralCode || this.generateReferralCode(dto.referrerId, dto.referredCustomerId);

    // Check if referral code already exists
    const existing = await this.referralRepository.findOne({ where: { referralCode } });
    if (existing) {
      throw new BadRequestException('Referral code already exists');
    }

    const referral = this.referralRepository.create({
      ...dto,
      referralCode,
      referralDate: new Date(),
      status: ReferralStatus.PENDING,
    });

    const savedReferral = await this.referralRepository.save(referral);
    this.logger.log(`Referral created: ${referralCode} by ${userName}`);
    return savedReferral;
  }

  private generateReferralCode(referrerId: string, referredCustomerId: string): string {
    const timestamp = Date.now().toString(36);
    const shortReferrerId = referrerId.substring(0, 8);
    const shortReferredId = referredCustomerId.substring(0, 8);
    return `REF-${shortReferrerId}-${shortReferredId}-${timestamp}`.toUpperCase();
  }

  async updateReferralStatus(referralId: string, dto: UpdateReferralStatusDto, userId: string, userName: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { id: referralId } });
    if (!referral) {
      throw new NotFoundException(`Referral with ID ${referralId} not found`);
    }

    referral.status = dto.status as ReferralStatus;

    if (dto.applicationId) {
      referral.applicationId = dto.applicationId;
      referral.applicationDate = dto.applicationDate ? new Date(dto.applicationDate) : new Date();
      referral.status = ReferralStatus.APPLIED;
    }

    if (dto.approvalDate) {
      referral.approvalDate = new Date(dto.approvalDate);
      referral.status = ReferralStatus.APPROVED;
    }

    if (dto.disbursementDate) {
      referral.disbursementDate = new Date(dto.disbursementDate);
      referral.status = ReferralStatus.DISBURSED;
    }

    if (dto.loanId) {
      referral.loanId = dto.loanId;
    }

    if (dto.completionDate) {
      referral.completionDate = new Date(dto.completionDate);
      referral.status = ReferralStatus.COMPLETED;

      // Auto-credit bonus when loan is completed
      if (!referral.bonusCredited && referral.programTerms?.bonusAmount) {
        await this.creditReferralBonus(referralId, {
          bonusAmount: referral.programTerms.bonusAmount,
          bonusType: referral.programTerms.bonusType || 'Fixed Amount',
        }, userId, userName);
      }
    }

    const updatedReferral = await this.referralRepository.save(referral);
    this.logger.log(`Referral ${referralId} status updated to ${dto.status}`);
    return updatedReferral;
  }

  async creditReferralBonus(referralId: string, dto: CreditReferralBonusDto, userId: string, userName: string): Promise<ReferralBonus> {
    const referral = await this.referralRepository.findOne({ where: { id: referralId } });
    if (!referral) {
      throw new NotFoundException(`Referral with ID ${referralId} not found`);
    }

    const bonus = this.bonusRepository.create({
      referralId: referral.id,
      bonusType: dto.bonusType,
      bonusAmount: dto.bonusAmount,
      status: 'Approved',
      creditedBy: userId,
      creditNotes: dto.creditNotes,
    });

    const savedBonus = await this.bonusRepository.save(bonus);

    // Update referral
    referral.bonusAmount = dto.bonusAmount;
    referral.bonusCredited = true;
    referral.bonusCreditedAt = new Date();
    referral.bonusNotes = dto.creditNotes;
    await this.referralRepository.save(referral);

    this.logger.log(`Referral bonus credited: ${dto.bonusAmount} for referral ${referralId}`);
    return savedBonus;
  }

  async getReferrals(filters: QueryReferralsDto): Promise<Referral[]> {
    const query = this.referralRepository.createQueryBuilder('referral');

    if (filters.referrerId) {
      query.andWhere('referral.referrerId = :referrerId', { referrerId: filters.referrerId });
    }
    if (filters.referredCustomerId) {
      query.andWhere('referral.referredCustomerId = :referredCustomerId', { referredCustomerId: filters.referredCustomerId });
    }
    if (filters.status) {
      query.andWhere('referral.status = :status', { status: filters.status });
    }
    if (filters.bonusCredited !== undefined) {
      query.andWhere('referral.bonusCredited = :bonusCredited', { bonusCredited: filters.bonusCredited });
    }

    query.orderBy('referral.referralDate', 'DESC');
    return query.getMany();
  }

  async getReferral(id: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { id } });
    if (!referral) {
      throw new NotFoundException(`Referral with ID ${id} not found`);
    }
    return referral;
  }

  /**
   * Referral Bonus Management Methods
   */

  async getReferralBonuses(filters: QueryReferralBonusesDto): Promise<ReferralBonus[]> {
    const query = this.bonusRepository.createQueryBuilder('bonus');

    if (filters.referralId) {
      query.andWhere('bonus.referralId = :referralId', { referralId: filters.referralId });
    }
    if (filters.status) {
      query.andWhere('bonus.status = :status', { status: filters.status });
    }
    if (filters.bonusType) {
      query.andWhere('bonus.bonusType = :bonusType', { bonusType: filters.bonusType });
    }

    query.orderBy('bonus.createdAt', 'DESC');
    return query.getMany();
  }

  async getReferralBonus(id: string): Promise<ReferralBonus> {
    const bonus = await this.bonusRepository.findOne({ where: { id } });
    if (!bonus) {
      throw new NotFoundException(`Referral bonus with ID ${id} not found`);
    }
    return bonus;
  }

  async updateReferralBonusStatus(
    bonusId: string,
    dto: UpdateReferralBonusStatusDto,
    userId: string,
    userName: string,
  ): Promise<ReferralBonus> {
    const bonus = await this.bonusRepository.findOne({ where: { id: bonusId } });
    if (!bonus) {
      throw new NotFoundException(`Referral bonus with ID ${bonusId} not found`);
    }

    const previousStatus = bonus.status;
    bonus.status = dto.status;

    if (dto.status === 'Credited' && previousStatus !== 'Credited') {
      bonus.creditedAt = new Date();
      bonus.creditedBy = userId;
    }

    if (dto.creditNotes) {
      bonus.creditNotes = dto.creditNotes;
    }

    if (dto.remarks) {
      bonus.remarks = dto.remarks;
    }

    const updatedBonus = await this.bonusRepository.save(bonus);

    // If bonus is credited, update the referral record
    if (dto.status === 'Credited' && previousStatus !== 'Credited') {
      const referral = await this.referralRepository.findOne({ where: { id: bonus.referralId } });
      if (referral) {
        referral.bonusCredited = true;
        referral.bonusCreditedAt = new Date();
        referral.bonusAmount = bonus.bonusAmount;
        referral.bonusNotes = dto.creditNotes || bonus.creditNotes;
        await this.referralRepository.save(referral);
      }
    }

    this.logger.log(`Referral bonus ${bonusId} status updated from ${previousStatus} to ${dto.status} by ${userName}`);
    return updatedBonus;
  }
}

