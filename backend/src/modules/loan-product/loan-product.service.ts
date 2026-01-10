import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from './entities/loan-product.entity';
import { LoanCharge } from './entities/loan-charge.entity';
import { CreateLoanProductDto } from './dto/create-loan-product.dto';
import { UpdateLoanProductDto } from './dto/update-loan-product.dto';
import { CreateLoanChargeDto } from './dto/create-loan-charge.dto';

@Injectable()
export class LoanProductService {
  constructor(
    @InjectRepository(LoanProduct)
    private loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanCharge)
    private loanChargeRepository: Repository<LoanCharge>,
  ) {}

  async create(createLoanProductDto: CreateLoanProductDto): Promise<LoanProduct> {
    const loanProduct = this.loanProductRepository.create(createLoanProductDto);
    return await this.loanProductRepository.save(loanProduct);
  }

  async findAll(): Promise<LoanProduct[]> {
    return await this.loanProductRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanProduct> {
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${id} not found`,
      );
    }

    return loanProduct;
  }

  async findByProductCode(productCode: string): Promise<LoanProduct> {
    const loanProduct = await this.loanProductRepository.findOne({
      where: { productCode },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with code ${productCode} not found`,
      );
    }

    return loanProduct;
  }

  async update(
    id: string,
    updateLoanProductDto: UpdateLoanProductDto,
  ): Promise<LoanProduct> {
    const loanProduct = await this.findOne(id);
    Object.assign(loanProduct, updateLoanProductDto);
    return await this.loanProductRepository.save(loanProduct);
  }

  async remove(id: string): Promise<void> {
    const loanProduct = await this.findOne(id);
    await this.loanProductRepository.remove(loanProduct);
  }

  /**
   * Add loan charge to product
   */
  async addCharge(
    productId: string,
    createChargeDto: CreateLoanChargeDto,
  ): Promise<LoanCharge> {
    const product = await this.findOne(productId);

    // Validate charge calculation
    if (createChargeDto.chargeBasedOn === 'Percentage') {
      if (!createChargeDto.percentage || createChargeDto.percentage <= 0) {
        throw new BadRequestException(
          'Percentage is required when chargeBasedOn is Percentage',
        );
      }
    } else {
      if (!createChargeDto.amount || createChargeDto.amount <= 0) {
        throw new BadRequestException(
          'Amount is required when chargeBasedOn is Fixed Amount',
        );
      }
    }

    const charge = this.loanChargeRepository.create({
      ...createChargeDto,
      loanProductId: product.id,
    });

    return await this.loanChargeRepository.save(charge);
  }

  /**
   * Get all charges for a loan product
   */
  async getCharges(productId: string): Promise<LoanCharge[]> {
    await this.findOne(productId); // Validate product exists
    return await this.loanChargeRepository.find({
      where: { loanProductId: productId },
    });
  }

  /**
   * Calculate charge amount based on charge configuration
   */
  calculateChargeAmount(charge: LoanCharge, baseAmount: number): number {
    if (charge.chargeBasedOn === 'Percentage') {
      return (baseAmount * Number(charge.percentage || 0)) / 100;
    } else {
      return Number(charge.amount || 0);
    }
  }

  /**
   * Get charge by type for a loan product
   */
  async getChargeByType(
    productId: string,
    chargeType: string,
  ): Promise<LoanCharge | null> {
    return await this.loanChargeRepository.findOne({
      where: {
        loanProductId: productId,
        chargeType,
      },
    });
  }

  /**
   * Remove charge from product
   */
  async removeCharge(chargeId: string): Promise<void> {
    const charge = await this.loanChargeRepository.findOne({
      where: { id: chargeId },
    });

    if (!charge) {
      throw new NotFoundException(`Loan charge with ID ${chargeId} not found`);
    }

    await this.loanChargeRepository.remove(charge);
  }
}

