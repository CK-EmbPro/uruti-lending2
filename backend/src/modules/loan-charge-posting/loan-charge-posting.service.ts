import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanChargePosting, ChargePostingType, ChargePostingStatus } from './entities/loan-charge-posting.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanCharge } from '../loan-product/entities/loan-charge.entity';
import { LoanProductService } from '../loan-product/loan-product.service';

export interface ChargeCalculationResult {
  chargeType: string;
  chargeAmount: number;
  incomeAccount: string;
  receivableAccount: string;
}

@Injectable()
export class LoanChargePostingService {
  constructor(
    @InjectRepository(LoanChargePosting)
    private readonly chargePostingRepository: Repository<LoanChargePosting>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanCharge)
    private readonly loanChargeRepository: Repository<LoanCharge>,
    private readonly loanProductService: LoanProductService,
  ) {}

  /**
   * Calculate and post charges for a disbursement
   * Implements Frappe's charge posting logic
   */
  async postChargesForDisbursement(
    loanId: string,
    disbursementId: string,
    disbursementDate: Date,
    disbursedAmount: number,
  ): Promise<LoanChargePosting[]> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    if (!loan.loanProduct) {
      return []; // No charges if no product
    }

    // Get all charges for the loan product
    const charges = await this.loanChargeRepository.find({
      where: { loanProductId: loan.loanProduct.id },
    });

    if (charges.length === 0) {
      return []; // No charges configured
    }

    const chargePostings: LoanChargePosting[] = [];

    for (const charge of charges) {
      // Calculate charge amount
      const chargeAmount = this.loanProductService.calculateChargeAmount(
        charge,
        disbursedAmount,
      );

      if (chargeAmount <= 0) {
        continue; // Skip zero charges
      }

      // Create charge posting record
      const chargePosting = this.chargePostingRepository.create({
        loanId,
        loanDisbursementId: disbursementId,
        postingType: ChargePostingType.DISBURSEMENT,
        chargeType: charge.chargeType,
        chargeAmount,
        incomeAccount: charge.incomeAccount,
        receivableAccount: charge.receivableAccount,
        postingDate: new Date(),
        valueDate: disbursementDate,
        status: ChargePostingStatus.PENDING,
        remarks: `Charge for disbursement ${disbursementId}`,
      });

      const saved = await this.chargePostingRepository.save(chargePosting);
      chargePostings.push(saved);
    }

    return chargePostings;
  }

  /**
   * Calculate and post charges for a repayment
   */
  async postChargesForRepayment(
    loanId: string,
    repaymentId: string,
    repaymentDate: Date,
    repaymentAmount: number,
  ): Promise<LoanChargePosting[]> {
    // Similar logic to disbursement, but for repayment charges
    // For now, return empty array as repayment charges are less common
    // This can be enhanced later based on business requirements
    return [];
  }

  /**
   * Get all charge postings for a loan
   */
  async findByLoanId(loanId: string): Promise<LoanChargePosting[]> {
    return await this.chargePostingRepository.find({
      where: { loanId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get charge postings for a disbursement
   */
  async findByDisbursementId(disbursementId: string): Promise<LoanChargePosting[]> {
    return await this.chargePostingRepository.find({
      where: { loanDisbursementId: disbursementId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mark charge posting as posted (when accounting entry is created)
   */
  async markAsPosted(
    chargePostingId: string,
    journalEntryId?: string,
    salesInvoiceId?: string,
  ): Promise<LoanChargePosting> {
    const chargePosting = await this.chargePostingRepository.findOne({
      where: { id: chargePostingId },
    });

    if (!chargePosting) {
      throw new NotFoundException(
        `Charge posting with ID ${chargePostingId} not found`,
      );
    }

    chargePosting.status = ChargePostingStatus.POSTED;
    if (journalEntryId) {
      chargePosting.journalEntryId = journalEntryId;
    }
    if (salesInvoiceId) {
      chargePosting.salesInvoiceId = salesInvoiceId;
    }

    return await this.chargePostingRepository.save(chargePosting);
  }

  /**
   * Cancel a charge posting
   */
  async cancel(chargePostingId: string): Promise<LoanChargePosting> {
    const chargePosting = await this.chargePostingRepository.findOne({
      where: { id: chargePostingId },
    });

    if (!chargePosting) {
      throw new NotFoundException(
        `Charge posting with ID ${chargePostingId} not found`,
      );
    }

    if (chargePosting.status === ChargePostingStatus.POSTED) {
      throw new BadRequestException(
        'Cannot cancel a posted charge. Create a reversal entry instead.',
      );
    }

    chargePosting.status = ChargePostingStatus.CANCELLED;
    return await this.chargePostingRepository.save(chargePosting);
  }
}

