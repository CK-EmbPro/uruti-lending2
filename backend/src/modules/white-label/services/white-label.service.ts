import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhiteLabelConfiguration } from '../entities/white-label.entity';
import { RevenueShareTransaction, TransactionType } from '../entities/revenue-share-transaction.entity';
import { CreateWhiteLabelDto, UpdateWhiteLabelDto, WhiteLabelBranding, RevenueShareSummary, RevenueShareModel } from '../dto/white-label.dto';

@Injectable()
export class WhiteLabelService {
  constructor(
    @InjectRepository(WhiteLabelConfiguration)
    private whiteLabelRepository: Repository<WhiteLabelConfiguration>,
    @InjectRepository(RevenueShareTransaction)
    private revenueShareRepository: Repository<RevenueShareTransaction>,
  ) {}

  async create(createDto: CreateWhiteLabelDto, userId: string): Promise<WhiteLabelConfiguration> {
    // Check for duplicate partner code
    const existing = await this.whiteLabelRepository.findOne({
      where: [{ partnerCode: createDto.partnerCode }],
    });

    if (existing) {
      throw new BadRequestException(`Partner code ${createDto.partnerCode} already exists`);
    }

    // Check for duplicate domain/subdomain
    if (createDto.customDomain) {
      const domainExists = await this.whiteLabelRepository.findOne({
        where: { customDomain: createDto.customDomain },
      });
      if (domainExists) {
        throw new BadRequestException(`Custom domain ${createDto.customDomain} already in use`);
      }
    }

    if (createDto.subdomain) {
      const subdomainExists = await this.whiteLabelRepository.findOne({
        where: { subdomain: createDto.subdomain },
      });
      if (subdomainExists) {
        throw new BadRequestException(`Subdomain ${createDto.subdomain} already in use`);
      }
    }

    const whiteLabel = this.whiteLabelRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.whiteLabelRepository.save(whiteLabel);
  }

  async findAll(): Promise<WhiteLabelConfiguration[]> {
    return this.whiteLabelRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WhiteLabelConfiguration> {
    const whiteLabel = await this.whiteLabelRepository.findOne({
      where: { id },
    });

    if (!whiteLabel) {
      throw new NotFoundException(`White label configuration with ID ${id} not found`);
    }

    return whiteLabel;
  }

  async findByPartnerCode(partnerCode: string): Promise<WhiteLabelConfiguration> {
    const whiteLabel = await this.whiteLabelRepository.findOne({
      where: { partnerCode },
    });

    if (!whiteLabel) {
      throw new NotFoundException(`White label configuration with partner code ${partnerCode} not found`);
    }

    return whiteLabel;
  }

  async findByDomain(domain: string): Promise<WhiteLabelConfiguration> {
    const whiteLabel = await this.whiteLabelRepository.findOne({
      where: [
        { customDomain: domain },
        { subdomain: domain },
      ],
    });

    if (!whiteLabel) {
      throw new NotFoundException(`White label configuration for domain ${domain} not found`);
    }

    return whiteLabel;
  }

  async update(id: string, updateDto: UpdateWhiteLabelDto, userId: string): Promise<WhiteLabelConfiguration> {
    const whiteLabel = await this.findOne(id);

    // Check for duplicate domain/subdomain if being updated
    if (updateDto.customDomain && updateDto.customDomain !== whiteLabel.customDomain) {
      const domainExists = await this.whiteLabelRepository.findOne({
        where: { customDomain: updateDto.customDomain },
      });
      if (domainExists) {
        throw new BadRequestException(`Custom domain ${updateDto.customDomain} already in use`);
      }
    }

    // Subdomain update is not allowed in UpdateWhiteLabelDto - remove this check
    // if (updateDto.subdomain && updateDto.subdomain !== whiteLabel.subdomain) {
    //   const subdomainExists = await this.whiteLabelRepository.findOne({
    //     where: { subdomain: updateDto.subdomain },
    //   });
    //   if (subdomainExists) {
    //     throw new BadRequestException(`Subdomain ${updateDto.subdomain} already in use`);
    //   }
    // }

    Object.assign(whiteLabel, {
      ...updateDto,
      updatedBy: userId,
    });

    return this.whiteLabelRepository.save(whiteLabel);
  }

  async remove(id: string): Promise<void> {
    const whiteLabel = await this.findOne(id);
    await this.whiteLabelRepository.remove(whiteLabel);
  }

  async getBranding(partnerCode: string): Promise<WhiteLabelBranding> {
    const whiteLabel = await this.findByPartnerCode(partnerCode);

    return {
      logoUrl: whiteLabel.logoUrl,
      faviconUrl: whiteLabel.faviconUrl,
      primaryColor: whiteLabel.primaryColor,
      secondaryColor: whiteLabel.secondaryColor,
      customCss: whiteLabel.customCss,
      companyName: whiteLabel.partnerName,
    };
  }

  async recordRevenueShare(
    whiteLabelId: string,
    transactionType: TransactionType,
    transactionAmount: number,
    loanId?: string,
    customerId?: string,
  ): Promise<RevenueShareTransaction> {
    const whiteLabel = await this.findOne(whiteLabelId);

    let partnerShare = 0;
    let platformShare = transactionAmount;

    // Calculate revenue share based on model
    if (whiteLabel.revenueShareModel === RevenueShareModel.PERCENTAGE) {
      if (whiteLabel.revenueSharePercentage) {
        partnerShare = (transactionAmount * whiteLabel.revenueSharePercentage) / 100;
        platformShare = transactionAmount - partnerShare;
      }
    } else if (whiteLabel.revenueShareModel === RevenueShareModel.FIXED_FEE) {
      if (whiteLabel.fixedFeePerTransaction) {
        partnerShare = whiteLabel.fixedFeePerTransaction;
        platformShare = transactionAmount - partnerShare;
      }
    } else if (whiteLabel.revenueShareModel === RevenueShareModel.TIERED) {
      // Implement tiered logic based on revenueShareConfig
      const tiers = whiteLabel.revenueShareConfig?.tiers || [];
      for (const tier of tiers) {
        if (transactionAmount >= tier.minAmount && (tier.maxAmount === null || transactionAmount <= tier.maxAmount)) {
          partnerShare = (transactionAmount * tier.percentage) / 100;
          platformShare = transactionAmount - partnerShare;
          break;
        }
      }
    } else if (whiteLabel.revenueShareModel === RevenueShareModel.HYBRID) {
      // Hybrid: fixed fee + percentage
      const fixedFee = whiteLabel.fixedFeePerTransaction || 0;
      const percentage = whiteLabel.revenueSharePercentage || 0;
      partnerShare = fixedFee + ((transactionAmount - fixedFee) * percentage) / 100;
      platformShare = transactionAmount - partnerShare;
    }

    const revenueShare = this.revenueShareRepository.create({
      whiteLabelId,
      loanId,
      customerId,
      transactionType,
      transactionAmount,
      partnerShare,
      platformShare,
      transactionDate: new Date(),
      calculationDetails: {
        model: whiteLabel.revenueShareModel,
        percentage: whiteLabel.revenueSharePercentage,
        fixedFee: whiteLabel.fixedFeePerTransaction,
        config: whiteLabel.revenueShareConfig,
      },
    });

    return this.revenueShareRepository.save(revenueShare);
  }

  async getRevenueShareSummary(
    whiteLabelId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueShareSummary> {
    const query = this.revenueShareRepository
      .createQueryBuilder('rst')
      .where('rst.whiteLabelId = :whiteLabelId', { whiteLabelId });

    if (startDate) {
      query.andWhere('rst.transactionDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('rst.transactionDate <= :endDate', { endDate });
    }

    const transactions = await query.getMany();

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.transactionAmount), 0);
    const partnerShare = transactions.reduce((sum, t) => sum + Number(t.partnerShare), 0);
    const platformShare = transactions.reduce((sum, t) => sum + Number(t.platformShare), 0);
    const transactionCount = transactions.length;
    const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Group by period (monthly)
    const revenueByPeriod: Record<string, { totalRevenue: number; partnerShare: number; platformShare: number }> = {};
    
    transactions.forEach((t) => {
      const period = t.transactionDate.toISOString().substring(0, 7); // YYYY-MM
      if (!revenueByPeriod[period]) {
        revenueByPeriod[period] = { totalRevenue: 0, partnerShare: 0, platformShare: 0 };
      }
      revenueByPeriod[period].totalRevenue += Number(t.transactionAmount);
      revenueByPeriod[period].partnerShare += Number(t.partnerShare);
      revenueByPeriod[period].platformShare += Number(t.platformShare);
    });

    return {
      totalRevenue,
      partnerShare,
      platformShare,
      transactionCount,
      averageTransactionValue,
      revenueByPeriod: Object.entries(revenueByPeriod).map(([period, data]) => ({
        period,
        ...data,
      })),
    };
  }

  async settleRevenueShare(transactionId: string, settledDate: Date): Promise<RevenueShareTransaction> {
    const transaction = await this.revenueShareRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Revenue share transaction with ID ${transactionId} not found`);
    }

    transaction.isSettled = true;
    transaction.settledDate = settledDate;

    return this.revenueShareRepository.save(transaction);
  }
}

