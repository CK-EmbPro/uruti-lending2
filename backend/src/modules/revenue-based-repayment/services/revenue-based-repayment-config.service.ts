import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueBasedRepaymentConfig } from '../entities/revenue-based-repayment-config.entity';
import { CreateRevenueBasedRepaymentConfigDto } from '../dto/revenue-based-repayment.dto';

@Injectable()
export class RevenueBasedRepaymentConfigService {
  private readonly logger = new Logger(RevenueBasedRepaymentConfigService.name);

  constructor(
    @InjectRepository(RevenueBasedRepaymentConfig)
    private readonly configRepository: Repository<RevenueBasedRepaymentConfig>,
  ) {}

  async createConfig(
    dto: CreateRevenueBasedRepaymentConfigDto,
    companyId: string,
  ): Promise<RevenueBasedRepaymentConfig> {
    if (!dto.loanId && !dto.loanProductId) {
      throw new BadRequestException('Either loanId or loanProductId must be provided');
    }

    if (dto.loanId && dto.loanProductId) {
      throw new BadRequestException('Cannot specify both loanId and loanProductId');
    }

    // Check if config already exists
    if (dto.loanId) {
      const existing = await this.configRepository.findOne({
        where: { loanId: dto.loanId },
      });
      if (existing) {
        throw new BadRequestException(`Configuration already exists for loan ${dto.loanId}`);
      }
    }

    const config = this.configRepository.create({
      loanId: dto.loanId,
      loanProductId: dto.loanProductId,
      companyId,
      repaymentPercentage: dto.repaymentPercentage,
      revenuePeriod: dto.revenuePeriod,
      minimumRepaymentAmount: dto.minimumRepaymentAmount,
      maximumRepaymentAmount: dto.maximumRepaymentAmount,
      revenueSources: dto.revenueSources,
      requireVerification: dto.requireVerification ?? true,
      autoCalculate: dto.autoCalculate ?? true,
      verificationThreshold: dto.verificationThreshold ?? 5,
    });

    return await this.configRepository.save(config);
  }

  async getConfigByLoanId(loanId: string): Promise<RevenueBasedRepaymentConfig> {
    // First try loan-specific config
    let config = await this.configRepository.findOne({
      where: { loanId },
      relations: ['loan', 'loanProduct'],
    });

    // If not found, try product-level config
    if (!config) {
      const loan = await this.configRepository.manager.findOne('Loan', { where: { id: loanId } });
      if (loan && (loan as any).loanProductId) {
        config = await this.configRepository.findOne({
          where: { loanProductId: (loan as any).loanProductId },
          relations: ['loanProduct'],
        });
      }
    }

    if (!config) {
      throw new BadRequestException(`Revenue-based repayment config not found for loan ${loanId}`);
    }

    return config;
  }
}

