import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRestructure } from '../entities/loan-restructure.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { RestructureStatus } from '../../../common/enums/restructure-type.enum';

const MAX_TENURE_EXTENSION_PERCENTAGE = 50; // Maximum 50% extension
const MAX_RESTRUCTURES_PER_LOAN = 2; // Maximum 2 restructures per loan

@Injectable()
export class RestructureValidationService {
  private readonly logger = new Logger(RestructureValidationService.name);

  constructor(
    @InjectRepository(LoanRestructure)
    private readonly restructureRepository: Repository<LoanRestructure>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Validate tenure extension doesn't exceed +50% of original term
   */
  async validateTenureExtension(
    loanId: string,
    requestedNewTenureMonths: number,
  ): Promise<void> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new BadRequestException(`Loan ${loanId} not found`);
    }

    const originalTenure = loan.repaymentPeriods || 0;

    if (originalTenure === 0) {
      throw new BadRequestException('Original loan tenure is not set');
    }

    const maxAllowedTenure = Math.floor(originalTenure * (1 + MAX_TENURE_EXTENSION_PERCENTAGE / 100));
    const extensionMonths = requestedNewTenureMonths - originalTenure;
    const extensionPercentage = (extensionMonths / originalTenure) * 100;

    if (requestedNewTenureMonths > maxAllowedTenure) {
      throw new BadRequestException(
        `Tenure extension exceeds maximum allowed. ` +
        `Original tenure: ${originalTenure} months, ` +
        `Requested: ${requestedNewTenureMonths} months, ` +
        `Maximum allowed: ${maxAllowedTenure} months (+${MAX_TENURE_EXTENSION_PERCENTAGE}%). ` +
        `Current extension: ${extensionMonths} months (${extensionPercentage.toFixed(1)}%)`,
      );
    }

    this.logger.log(
      `Tenure extension validated: Original=${originalTenure} months, ` +
      `Requested=${requestedNewTenureMonths} months, ` +
      `Extension=${extensionMonths} months (${extensionPercentage.toFixed(1)}%)`,
    );
  }

  /**
   * Calculate maximum allowed tenure extension
   */
  calculateMaxAllowedTenure(originalTenure: number): number {
    return Math.floor(originalTenure * (1 + MAX_TENURE_EXTENSION_PERCENTAGE / 100));
  }

  /**
   * Calculate extension percentage
   */
  calculateExtensionPercentage(originalTenure: number, newTenure: number): number {
    if (originalTenure === 0) {
      return 0;
    }
    return ((newTenure - originalTenure) / originalTenure) * 100;
  }

  /**
   * Validate restructure count doesn't exceed maximum allowed
   */
  async validateRestructureCount(loanId: string): Promise<void> {
    const approvedCount = await this.restructureRepository.count({
      where: { loanId, status: RestructureStatus.APPROVED },
    });

    if (approvedCount >= MAX_RESTRUCTURES_PER_LOAN) {
      throw new BadRequestException(
        `Maximum of ${MAX_RESTRUCTURES_PER_LOAN} restructures allowed per loan. ` +
        `This loan already has ${approvedCount} approved restructure(s).`,
      );
    }

    this.logger.log(
      `Restructure count validated for loan ${loanId}: ${approvedCount} approved restructures (max: ${MAX_RESTRUCTURES_PER_LOAN})`,
    );
  }

  /**
   * Get maximum allowed restructures per loan
   */
  getMaxRestructuresPerLoan(): number {
    return MAX_RESTRUCTURES_PER_LOAN;
  }
}

