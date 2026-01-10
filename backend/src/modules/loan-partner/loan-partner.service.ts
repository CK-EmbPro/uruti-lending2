import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanPartner } from './entities/loan-partner.entity';
import { LoanPartnerShareable } from './entities/loan-partner-shareable.entity';
import { CreateLoanPartnerDto } from './dto/create-loan-partner.dto';
import { UpdateLoanPartnerDto } from './dto/update-loan-partner.dto';

@Injectable()
export class LoanPartnerService {
  constructor(
    @InjectRepository(LoanPartner)
    private readonly loanPartnerRepository: Repository<LoanPartner>,
    @InjectRepository(LoanPartnerShareable)
    private readonly shareableRepository: Repository<LoanPartnerShareable>,
  ) {}

  async create(createDto: CreateLoanPartnerDto): Promise<LoanPartner> {
    // Validate percentages
    this.validatePercentages(createDto);

    // Check if partner code already exists
    const existing = await this.loanPartnerRepository.findOne({
      where: { partnerCode: createDto.partnerCode },
    });

    if (existing) {
      throw new BadRequestException(
        `Loan Partner with code ${createDto.partnerCode} already exists`,
      );
    }

    // Create partner
    const partner = this.loanPartnerRepository.create({
      ...createDto,
      effectiveDate: new Date(createDto.effectiveDate),
    });

    // Create shareables if provided
    if (createDto.shareables && createDto.shareables.length > 0) {
      partner.shareables = createDto.shareables.map((s) =>
        this.shareableRepository.create({
          ...s,
          loanPartner: partner,
        }),
      );
    }

    const saved = await this.loanPartnerRepository.save(partner);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<LoanPartner[]> {
    return await this.loanPartnerRepository.find({
      relations: ['shareables'],
    });
  }

  async findOne(id: string): Promise<LoanPartner> {
    const partner = await this.loanPartnerRepository.findOne({
      where: { id },
      relations: ['shareables'],
    });

    if (!partner) {
      throw new NotFoundException(`Loan Partner with ID ${id} not found`);
    }

    return partner;
  }

  async findByCode(partnerCode: string): Promise<LoanPartner> {
    const partner = await this.loanPartnerRepository.findOne({
      where: { partnerCode },
      relations: ['shareables'],
    });

    if (!partner) {
      throw new NotFoundException(
        `Loan Partner with code ${partnerCode} not found`,
      );
    }

    return partner;
  }

  async update(
    id: string,
    updateDto: UpdateLoanPartnerDto,
  ): Promise<LoanPartner> {
    const partner = await this.findOne(id);

    // Validate percentages if provided
    if (updateDto.partnerLoanSharePercentage !== undefined) {
      this.validatePercentages(updateDto as any);
    }

    Object.assign(partner, updateDto);

    if (updateDto.effectiveDate) {
      partner.effectiveDate = new Date(updateDto.effectiveDate);
    }

    // Update shareables if provided
    if (updateDto.shareables) {
      // Remove existing shareables
      await this.shareableRepository.delete({ loanPartnerId: partner.id });

      // Create new shareables
      partner.shareables = updateDto.shareables.map((s) =>
        this.shareableRepository.create({
          ...s,
          loanPartner: partner,
        }),
      );
    }

    return await this.loanPartnerRepository.save(partner);
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);

    // Check if partner is used in any loans
    // This would require checking Loan entity - can be added later

    await this.loanPartnerRepository.remove(partner);
  }

  /**
   * Get partner share percentage for a shareable type
   */
  async getPartnerSharePercentage(
    partnerId: string,
    shareableType: string,
  ): Promise<number> {
    const partner = await this.findOne(partnerId);

    const shareable = partner.shareables?.find(
      (s) => s.shareableType === shareableType,
    );

    if (!shareable) {
      // Return default share percentage
      return partner.partnerLoanSharePercentage;
    }

    if (shareable.sharingParameter === 'Collection Percentage') {
      return shareable.partnerCollectionPercentage || 0;
    } else {
      return shareable.partnerLoanAmountPercentage || 0;
    }
  }

  /**
   * Check if FLDG should be triggered for a loan
   */
  async shouldTriggerFldg(
    partnerId: string,
    daysPastDue: number,
  ): Promise<boolean> {
    const partner = await this.findOne(partnerId);

    if (!partner.fldgTriggerDpd) {
      return false;
    }

    return daysPastDue >= partner.fldgTriggerDpd;
  }

  /**
   * Calculate FLDG limit amount
   */
  async calculateFldgLimit(
    partnerId: string,
    baseAmount: number,
  ): Promise<number> {
    const partner = await this.findOne(partnerId);

    if (!partner.typeOfFldgApplicable) {
      return 0;
    }

    let limitAmount = 0;

    if (
      partner.typeOfFldgApplicable === 'Fixed Deposit Only' ||
      partner.typeOfFldgApplicable === 'Both Fixed Deposit and Corporate Guarantee'
    ) {
      if (partner.fldgFixedDepositPercentage) {
        limitAmount +=
          (baseAmount * partner.fldgFixedDepositPercentage) / 100;
      }
    }

    if (
      partner.typeOfFldgApplicable === 'Corporate Guarantee Only' ||
      partner.typeOfFldgApplicable === 'Both Fixed Deposit and Corporate Guarantee'
    ) {
      if (partner.fldgCorporateGuaranteePercentage) {
        limitAmount +=
          (baseAmount * partner.fldgCorporateGuaranteePercentage) / 100;
      }
    }

    return limitAmount;
  }

  /**
   * Validate percentage fields
   */
  private validatePercentages(dto: any): void {
    // Validate partner loan share percentage
    if (dto.partnerLoanSharePercentage !== undefined) {
      if (
        dto.partnerLoanSharePercentage < 1 ||
        dto.partnerLoanSharePercentage > 99
      ) {
        throw new BadRequestException(
          'Partner loan share percentage must be between 1 and 99',
        );
      }
    }

    // Validate FLDG percentages
    if (dto.fldgFixedDepositPercentage !== undefined) {
      if (
        dto.fldgFixedDepositPercentage < 1 ||
        dto.fldgFixedDepositPercentage > 99
      ) {
        throw new BadRequestException(
          'FLDG fixed deposit percentage must be between 1 and 99',
        );
      }
    }

    if (dto.fldgCorporateGuaranteePercentage !== undefined) {
      if (
        dto.fldgCorporateGuaranteePercentage < 1 ||
        dto.fldgCorporateGuaranteePercentage > 99
      ) {
        throw new BadRequestException(
          'FLDG corporate guarantee percentage must be between 1 and 99',
        );
      }
    }

    // Validate shareables
    if (dto.shareables) {
      const shareableTypes = new Set();
      for (const shareable of dto.shareables) {
        if (shareableTypes.has(shareable.shareableType)) {
          throw new BadRequestException(
            `Shareable type ${shareable.shareableType} added multiple times`,
          );
        }
        shareableTypes.add(shareable.shareableType);

        if (shareable.sharingParameter === 'Collection Percentage') {
          if (
            shareable.partnerCollectionPercentage !== undefined &&
            (shareable.partnerCollectionPercentage < 1 ||
              shareable.partnerCollectionPercentage > 99)
          ) {
            throw new BadRequestException(
              'Partner collection percentage must be between 1 and 99',
            );
          }
          if (
            shareable.companyCollectionPercentage !== undefined &&
            (shareable.companyCollectionPercentage < 1 ||
              shareable.companyCollectionPercentage > 99)
          ) {
            throw new BadRequestException(
              'Company collection percentage must be between 1 and 99',
            );
          }
        } else if (shareable.sharingParameter === 'Loan Amount Percentage') {
          if (
            shareable.partnerLoanAmountPercentage !== undefined &&
            (shareable.partnerLoanAmountPercentage < 1 ||
              shareable.partnerLoanAmountPercentage > 99)
          ) {
            throw new BadRequestException(
              'Partner loan amount percentage must be between 1 and 99',
            );
          }
        }
      }
    }
  }
}

