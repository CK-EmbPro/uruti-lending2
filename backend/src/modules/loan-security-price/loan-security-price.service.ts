import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { LoanSecurityPrice } from './entities/loan-security-price.entity';
import { CreateLoanSecurityPriceDto } from './dto/create-loan-security-price.dto';

@Injectable()
export class LoanSecurityPriceService {
  constructor(
    @InjectRepository(LoanSecurityPrice)
    private readonly priceRepository: Repository<LoanSecurityPrice>,
  ) {}

  async create(
    createDto: CreateLoanSecurityPriceDto,
  ): Promise<LoanSecurityPrice> {
    // Validate dates
    const validFrom = new Date(createDto.validFrom);
    const validUpto = new Date(createDto.validUpto);

    if (validFrom >= validUpto) {
      throw new BadRequestException(
        'Valid From must be less than Valid Upto',
      );
    }

    // Check for overlapping prices
    const overlapping = await this.priceRepository.findOne({
      where: {
        loanSecurityId: createDto.loanSecurityId,
      },
    });

    if (overlapping) {
      // Check if dates overlap
      const existingFrom = new Date(overlapping.validFrom);
      const existingUpto = new Date(overlapping.validUpto);

      if (
        (validFrom >= existingFrom && validFrom <= existingUpto) ||
        (validUpto >= existingFrom && validUpto <= existingUpto) ||
        (validFrom <= existingFrom && validUpto >= existingUpto)
      ) {
        throw new BadRequestException(
          `Price entry overlaps with existing entry (ID: ${overlapping.id})`,
        );
      }
    }

    const price = this.priceRepository.create({
      loanSecurityId: createDto.loanSecurityId,
      loanSecurityPrice: createDto.loanSecurityPrice,
      validFrom: validFrom,
      validUpto: validUpto,
    });

    return await this.priceRepository.save(price);
  }

  /**
   * Get current price for a security
   * @param loanSecurityId Security ID
   * @param validTime Optional time to check (defaults to now)
   * @returns Price or null if not found
   */
  async getCurrentPrice(
    loanSecurityId: string,
    validTime?: Date,
  ): Promise<number | null> {
    const checkTime = validTime || new Date();

    const price = await this.priceRepository.findOne({
      where: {
        loanSecurityId,
        validFrom: LessThanOrEqual(checkTime),
        validUpto: MoreThanOrEqual(checkTime),
      },
      order: { validFrom: 'DESC' },
    });

    return price ? Number(price.loanSecurityPrice) : null;
  }

  /**
   * Get price at a specific date/time
   * @param loanSecurityId Security ID
   * @param dateTime Date/time to check
   * @returns Price or null if not found
   */
  async getPriceAtDate(
    loanSecurityId: string,
    dateTime: Date,
  ): Promise<number | null> {
    return this.getCurrentPrice(loanSecurityId, dateTime);
  }

  /**
   * Get all prices for a security
   * @param loanSecurityId Security ID
   * @returns Array of price entries
   */
  async findAll(loanSecurityId?: string): Promise<LoanSecurityPrice[]> {
    if (loanSecurityId) {
      return await this.priceRepository.find({
        where: { loanSecurityId },
        order: { validFrom: 'DESC' },
      });
    }
    return await this.priceRepository.find({
      order: { validFrom: 'DESC' },
    });
  }

  /**
   * Get price by ID
   * @param id Price entry ID
   * @returns Price entry
   */
  async findOne(id: string): Promise<LoanSecurityPrice> {
    const price = await this.priceRepository.findOne({ where: { id } });

    if (!price) {
      throw new NotFoundException(`Security price with ID ${id} not found`);
    }

    return price;
  }

  /**
   * Get prices for multiple securities at a specific time
   * @param securityIds Array of security IDs
   * @param validTime Optional time to check (defaults to now)
   * @returns Map of securityId -> price
   */
  async getPricesForSecurities(
    securityIds: string[],
    validTime?: Date,
  ): Promise<Map<string, number>> {
    const checkTime = validTime || new Date();
    const priceMap = new Map<string, number>();

    const prices = await this.priceRepository.find({
      where: securityIds.map((id) => ({
        loanSecurityId: id,
        validFrom: LessThanOrEqual(checkTime),
        validUpto: MoreThanOrEqual(checkTime),
      })),
      order: { validFrom: 'DESC' },
    });

    // Group by security ID and take the most recent
    const latestPrices = new Map<string, LoanSecurityPrice>();
    for (const price of prices) {
      const existing = latestPrices.get(price.loanSecurityId);
      if (!existing || price.validFrom > existing.validFrom) {
        latestPrices.set(price.loanSecurityId, price);
      }
    }

    for (const [securityId, price] of latestPrices) {
      priceMap.set(securityId, Number(price.loanSecurityPrice));
    }

    return priceMap;
  }

  /**
   * Update a price entry
   * @param id Price entry ID
   * @param updateDto Update data
   * @returns Updated price entry
   */
  async update(
    id: string,
    updateDto: Partial<CreateLoanSecurityPriceDto>,
  ): Promise<LoanSecurityPrice> {
    const price = await this.findOne(id);

    // Validate dates if provided
    if (updateDto.validFrom && updateDto.validUpto) {
      const validFrom = new Date(updateDto.validFrom);
      const validUpto = new Date(updateDto.validUpto);

      if (validFrom >= validUpto) {
        throw new BadRequestException(
          'Valid From must be less than Valid Upto',
        );
      }

      // Check for overlapping prices (excluding current entry)
      const overlapping = await this.priceRepository.findOne({
        where: {
          loanSecurityId: updateDto.loanSecurityId || price.loanSecurityId,
        },
      });

      if (overlapping && overlapping.id !== id) {
        const existingFrom = new Date(overlapping.validFrom);
        const existingUpto = new Date(overlapping.validUpto);

        if (
          (validFrom >= existingFrom && validFrom <= existingUpto) ||
          (validUpto >= existingFrom && validUpto <= existingUpto) ||
          (validFrom <= existingFrom && validUpto >= existingUpto)
        ) {
          throw new BadRequestException(
            `Price entry overlaps with existing entry (ID: ${overlapping.id})`,
          );
        }
      }
    }

    if (updateDto.validFrom) {
      price.validFrom = new Date(updateDto.validFrom);
    }
    if (updateDto.validUpto) {
      price.validUpto = new Date(updateDto.validUpto);
    }
    if (updateDto.loanSecurityPrice !== undefined) {
      price.loanSecurityPrice = updateDto.loanSecurityPrice;
    }
    if (updateDto.loanSecurityId) {
      price.loanSecurityId = updateDto.loanSecurityId;
    }

    return await this.priceRepository.save(price);
  }

  /**
   * Delete a price entry
   * @param id Price entry ID
   */
  async remove(id: string): Promise<void> {
    const price = await this.findOne(id);
    await this.priceRepository.remove(price);
  }
}

