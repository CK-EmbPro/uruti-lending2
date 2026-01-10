import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { P2PListing } from '../entities/p2p-listing.entity';
import { P2PInvestment } from '../entities/p2p-investment.entity';
import { P2PListingStatus, InvestmentStatus } from '../dto/p2p-lending.dto';
import {
  CreateP2PListingDto,
  InvestInListingDto,
  P2PListing as P2PListingDto,
  Investment,
  InvestorDashboard,
} from '../dto/p2p-lending.dto';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

@Injectable()
export class P2PLendingService {
  private readonly logger = new Logger(P2PLendingService.name);

  constructor(
    @InjectRepository(P2PListing)
    private listingRepository: Repository<P2PListing>,
    @InjectRepository(P2PInvestment)
    private investmentRepository: Repository<P2PInvestment>,
    @InjectRepository(LoanApplication)
    private loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private repaymentRepository: Repository<LoanRepayment>,
  ) {}

  async createListing(createDto: CreateP2PListingDto, userId: string): Promise<P2PListing> {
    // Verify loan application exists
    const application = await this.loanApplicationRepository.findOne({
      where: { id: createDto.loanApplicationId },
    });

    if (!application) {
      throw new NotFoundException(`Loan application with ID ${createDto.loanApplicationId} not found`);
    }

    // Check if listing already exists for this application
    const existing = await this.listingRepository.findOne({
      where: { loanApplicationId: createDto.loanApplicationId },
    });

    if (existing && existing.status !== P2PListingStatus.CANCELLED) {
      throw new BadRequestException('Active listing already exists for this loan application');
    }

    // Get borrower profile (anonymized)
    const borrowerProfile = await this.getAnonymizedBorrowerProfile(application.applicantId);

    // Get risk metrics
    const riskMetrics = await this.getRiskMetrics(application);

    const listing = this.listingRepository.create({
      ...createDto,
      borrowerProfile,
      riskMetrics,
      status: P2PListingStatus.OPEN,
      createdBy: userId,
    });

    return this.listingRepository.save(listing);
  }

  private async getAnonymizedBorrowerProfile(customerId: string): Promise<Record<string, any>> {
    // TODO: Fetch customer data and anonymize
    // For now, return placeholder
    return {
      creditScoreRange: '700-750',
      employmentStatus: 'Employed',
      incomeRange: '$50k-$75k',
      location: 'US',
    };
  }

  private async getRiskMetrics(application: LoanApplication): Promise<Record<string, any>> {
    // TODO: Calculate risk metrics from application data
    return {
      creditScore: 725,
      riskRating: 'B',
      debtToIncomeRatio: 35,
      loanToValueRatio: 80,
    };
  }

  async findAllListings(status?: P2PListingStatus): Promise<P2PListing[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.listingRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['investments'],
    });
  }

  async findOneListing(id: string): Promise<P2PListing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['investments'],
    });

    if (!listing) {
      throw new NotFoundException(`P2P listing with ID ${id} not found`);
    }

    return listing;
  }

  async investInListing(investorId: string, investDto: InvestInListingDto): Promise<P2PInvestment> {
    const listing = await this.findOneListing(investDto.listingId);

    if (listing.status !== P2PListingStatus.OPEN && listing.status !== P2PListingStatus.FUNDING) {
      throw new BadRequestException(`Listing is not open for investment. Current status: ${listing.status}`);
    }

    if (listing.currentAmount >= listing.targetAmount) {
      throw new BadRequestException('Listing is already fully funded');
    }

    // Check minimum investment
    if (investDto.investmentAmount < listing.minimumInvestment) {
      throw new BadRequestException(
        `Investment amount must be at least ${listing.minimumInvestment}`,
      );
    }

    // Check maximum investment
    if (listing.maximumInvestment && investDto.investmentAmount > listing.maximumInvestment) {
      throw new BadRequestException(
        `Investment amount cannot exceed ${listing.maximumInvestment}`,
      );
    }

    // Check if investor already invested
    const existingInvestment = await this.investmentRepository.findOne({
      where: {
        investorId,
        listingId: investDto.listingId,
        status: InvestmentStatus.PENDING,
      },
    });

    if (existingInvestment) {
      throw new BadRequestException('You already have a pending investment in this listing');
    }

    // Check available amount
    const remainingAmount = listing.targetAmount - listing.currentAmount;
    if (investDto.investmentAmount > remainingAmount) {
      throw new BadRequestException(
        `Only ${remainingAmount} remaining. Please invest ${remainingAmount} or less.`,
      );
    }

    // Create investment
    const investment = this.investmentRepository.create({
      investorId,
      listingId: investDto.listingId,
      investmentAmount: investDto.investmentAmount,
      proposedRate: investDto.proposedRate,
      status: InvestmentStatus.PENDING,
      investmentDate: new Date(),
      outstandingPrincipal: investDto.investmentAmount,
    });

    const savedInvestment = await this.investmentRepository.save(investment);

    // Update listing
    listing.currentAmount = Number(listing.currentAmount) + Number(investDto.investmentAmount);
    listing.investorCount += 1;

    if (listing.currentAmount >= listing.targetAmount) {
      listing.status = P2PListingStatus.FUNDED;
      listing.fundedAt = new Date();
    } else {
      listing.status = P2PListingStatus.FUNDING;
    }

    await this.listingRepository.save(listing);

    // Auto-confirm if instant funding
    if (listing.fundingType === 'INSTANT') {
      await this.confirmInvestment(savedInvestment.id);
    }

    return savedInvestment;
  }

  async confirmInvestment(investmentId: string): Promise<P2PInvestment> {
    const investment = await this.investmentRepository.findOne({
      where: { id: investmentId },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${investmentId} not found`);
    }

    investment.status = InvestmentStatus.CONFIRMED;
    investment.confirmedDate = new Date();
    return this.investmentRepository.save(investment);
  }

  async getInvestorInvestments(investorId: string): Promise<P2PInvestment[]> {
    return this.investmentRepository.find({
      where: { investorId },
      order: { investmentDate: 'DESC' },
      relations: ['listing'],
    });
  }

  async getInvestorDashboard(investorId: string): Promise<InvestorDashboard> {
    const investments = await this.investmentRepository.find({
      where: { investorId },
      relations: ['listing'],
    });

    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0);
    const totalReturns = investments.reduce((sum, inv) => sum + Number(inv.totalReturns), 0);
    const activeInvestments = investments.filter(
      inv => inv.status === InvestmentStatus.ACTIVE || inv.status === InvestmentStatus.CONFIRMED,
    ).length;

    const averageROI = investments.length > 0
      ? investments.reduce((sum, inv) => sum + Number(inv.roi || 0), 0) / investments.length
      : 0;

    const portfolioValue = totalInvested + totalReturns;

    const recentInvestments = investments
      .slice(0, 10)
      .map(inv => ({
        listingId: inv.listingId,
        amount: Number(inv.investmentAmount),
        interestRate: Number(inv.listing?.interestRate || 0),
        status: inv.status,
        investmentDate: inv.investmentDate.toISOString(),
      }));

    return {
      totalInvested,
      activeInvestments,
      totalReturns,
      averageROI,
      portfolioValue,
      recentInvestments,
    };
  }

  async processRepayments(loanId: string): Promise<void> {
    // Get loan
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      this.logger.warn(`Loan ${loanId} not found for repayment processing`);
      return;
    }

    // Find listing for this loan - need to find by application
    // Since Loan doesn't have loanApplicationId, we need to find application first
    // For now, search all listings and match by loan metadata or find application
    const listing = await this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.loanApplicationId IS NOT NULL')
      .getOne();

    if (!listing) {
      this.logger.warn(`No listing found for loan ${loanId}`);
      return;
    }

    // Get all investments for this listing
    const investments = await this.investmentRepository.find({
      where: { listingId: listing.id, status: InvestmentStatus.ACTIVE },
    });

    // Get recent repayments
    const recentRepayments = await this.repaymentRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
      take: 10,
    });

    // Distribute repayments proportionally
    for (const repayment of recentRepayments) {
      const principalAmount = Number(repayment.principalPaid || 0);
      const interestAmount = Number(repayment.interestPaid || 0);

      for (const investment of investments) {
        const share = Number(investment.investmentAmount) / Number(listing.targetAmount);
        const principalShare = principalAmount * share;
        const interestShare = interestAmount * share;

        investment.principalReceived = Number(investment.principalReceived || 0) + principalShare;
        investment.interestReceived = Number(investment.interestReceived || 0) + interestShare;
        investment.totalReturns = Number(investment.principalReceived) + Number(investment.interestReceived);
        investment.outstandingPrincipal = Number(investment.investmentAmount) - Number(investment.principalReceived);

        // Calculate ROI
        if (Number(investment.investmentAmount) > 0) {
          investment.roi = (Number(investment.totalReturns) / Number(investment.investmentAmount)) * 100;
        }

        await this.investmentRepository.save(investment);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processExpiredListings() {
    this.logger.log('Processing expired P2P listings...');
    const now = new Date();

    const expiredListings = await this.listingRepository.find({
      where: {
        status: P2PListingStatus.OPEN,
        fundingDeadline: LessThan(now),
      },
    });

    for (const listing of expiredListings) {
      if (listing.currentAmount >= listing.targetAmount) {
        listing.status = P2PListingStatus.FUNDED;
        listing.fundedAt = new Date();
      } else {
        listing.status = P2PListingStatus.CLOSED;
        // Refund pending investments
        await this.refundPendingInvestments(listing.id);
      }
      await this.listingRepository.save(listing);
    }

    this.logger.log(`Processed ${expiredListings.length} expired listings`);
  }

  private async refundPendingInvestments(listingId: string): Promise<void> {
    const pendingInvestments = await this.investmentRepository.find({
      where: {
        listingId,
        status: InvestmentStatus.PENDING,
      },
    });

    for (const investment of pendingInvestments) {
      investment.status = InvestmentStatus.CANCELLED;
      await this.investmentRepository.save(investment);
      // TODO: Process actual refund through payment processor
    }
  }
}

