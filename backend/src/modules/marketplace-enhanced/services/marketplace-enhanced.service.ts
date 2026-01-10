import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import {
  CreateMarketplaceListingDto,
  MarketplaceFilterDto,
  MarketplaceListing as MarketplaceListingDto,
  MarketplaceStats,
  ListingCategory,
} from '../dto/marketplace-enhanced.dto';
import { P2PListing } from '../../p2p-lending/entities/p2p-listing.entity';
import { P2PInvestment } from '../../p2p-lending/entities/p2p-investment.entity';

@Injectable()
export class MarketplaceEnhancedService {
  private readonly logger = new Logger(MarketplaceEnhancedService.name);

  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepository: Repository<MarketplaceListing>,
    @InjectRepository(P2PListing)
    private p2pListingRepository: Repository<P2PListing>,
    @InjectRepository(P2PInvestment)
    private investmentRepository: Repository<P2PInvestment>,
  ) {}

  async createListing(createDto: CreateMarketplaceListingDto): Promise<MarketplaceListing> {
    // Check if listing already exists for this application
    const existing = await this.listingRepository.findOne({
      where: { loanApplicationId: createDto.loanApplicationId },
    });

    if (existing) {
      throw new NotFoundException('Listing already exists for this loan application');
    }

    const listing = this.listingRepository.create({
      ...createDto,
      currentAmount: 0,
      investorCount: 0,
      viewCount: 0,
    });

    return this.listingRepository.save(listing);
  }

  async findAllListings(filter?: MarketplaceFilterDto): Promise<MarketplaceListing[]> {
    const query = this.listingRepository.createQueryBuilder('listing');

    if (filter?.category) {
      query.andWhere('listing.category = :category', { category: filter.category });
    }

    if (filter?.minInterestRate !== undefined) {
      query.andWhere('listing.interestRate >= :minRate', { minRate: filter.minInterestRate });
    }

    if (filter?.maxInterestRate !== undefined) {
      query.andWhere('listing.interestRate <= :maxRate', { maxRate: filter.maxInterestRate });
    }

    if (filter?.minAmount !== undefined) {
      query.andWhere('listing.targetAmount >= :minAmount', { minAmount: filter.minAmount });
    }

    if (filter?.maxAmount !== undefined) {
      query.andWhere('listing.targetAmount <= :maxAmount', { maxAmount: filter.maxAmount });
    }

    if (filter?.riskLevel) {
      query.andWhere("listing.riskMetrics->>'riskLevel' = :riskLevel", { riskLevel: filter.riskLevel });
    }

    return query
      .orderBy('listing.isFeatured', 'DESC')
      .addOrderBy('listing.priority', 'DESC')
      .addOrderBy('listing.createdAt', 'DESC')
      .getMany();
  }

  async findFeaturedListings(limit: number = 10): Promise<MarketplaceListing[]> {
    return this.listingRepository.find({
      where: { isFeatured: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOneListing(id: string): Promise<MarketplaceListing> {
    const listing = await this.listingRepository.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Marketplace listing with ID ${id} not found`);
    }

    // Increment view count
    listing.viewCount += 1;
    await this.listingRepository.save(listing);

    return listing;
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const allListings = await this.listingRepository.find();
    const activeListings = allListings.filter(
      l => l.status === 'OPEN' || l.status === 'FUNDING',
    );

    const totalFunded = allListings.reduce((sum, l) => sum + Number(l.currentAmount), 0);
    const averageInterestRate =
      allListings.length > 0
        ? allListings.reduce((sum, l) => sum + Number(l.interestRate), 0) / allListings.length
        : 0;

    // Get unique investors from P2P investments
    const uniqueInvestors = await this.investmentRepository
      .createQueryBuilder('investment')
      .select('COUNT(DISTINCT investment.investorId)', 'count')
      .getRawOne();

    const totalInvestors = Number(uniqueInvestors?.count || 0);

    // Calculate success rate (funded listings / total listings)
    const fundedListings = allListings.filter(l => l.status === 'FUNDED').length;
    const successRate = allListings.length > 0 ? (fundedListings / allListings.length) * 100 : 0;

    return {
      totalListings: allListings.length,
      activeListings: activeListings.length,
      totalFunded,
      averageInterestRate,
      totalInvestors,
      successRate,
    };
  }

  async getCategoryStats(): Promise<Record<string, { count: number; totalAmount: number }>> {
    const listings = await this.listingRepository.find();
    const stats: Record<string, { count: number; totalAmount: number }> = {};

    for (const listing of listings) {
      if (!stats[listing.category]) {
        stats[listing.category] = { count: 0, totalAmount: 0 };
      }
      stats[listing.category].count += 1;
      stats[listing.category].totalAmount += Number(listing.targetAmount);
    }

    return stats;
  }

  async updateListingStatus(listingId: string, status: string): Promise<MarketplaceListing> {
    const listing = await this.findOneListing(listingId);
    listing.status = status as any;
    return this.listingRepository.save(listing);
  }

  async setFeatured(listingId: string, isFeatured: boolean): Promise<MarketplaceListing> {
    const listing = await this.findOneListing(listingId);
    listing.isFeatured = isFeatured;
    return this.listingRepository.save(listing);
  }
}

