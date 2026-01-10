import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanRefund } from './entities/loan-refund.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Company } from '../company/entities/company.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { CreateLoanRefundDto } from './dto/create-loan-refund.dto';
import { UpdateLoanRefundDto } from './dto/update-loan-refund.dto';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class LoanRefundService {
  private readonly logger = new Logger(LoanRefundService.name);

  constructor(
    @InjectRepository(LoanRefund)
    private readonly refundRepository: Repository<LoanRefund>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly accountingService: AccountingService,
  ) {}

  async create(createLoanRefundDto: CreateLoanRefundDto): Promise<LoanRefund> {
    // Validate loan exists with relations
    const loan = await this.loanRepository.findOne({
      where: { id: createLoanRefundDto.loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with ID ${createLoanRefundDto.loanId} not found`,
      );
    }

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: loan.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${loan.companyId} not found`);
    }

    // Business Rule: Validate refund amount
    if (createLoanRefundDto.isExcessAmountRefund) {
      // For excess amount refund, validate against excess amount paid
      const excessAmountPaid = Number(loan.excessAmountPaid || 0);
      if (createLoanRefundDto.refundAmount > excessAmountPaid) {
        throw new BadRequestException(
          `Refund amount (${createLoanRefundDto.refundAmount}) cannot be greater than excess amount paid (${excessAmountPaid})`,
        );
      }
    } else if (createLoanRefundDto.isSecurityAmountRefund) {
      // For security amount refund, validate against available security deposit
      // TODO: Implement security deposit tracking when LoanSecurityDeposit entity is added
      // For now, we'll skip this validation
      this.logger.warn(
        'Security amount refund validation not fully implemented - security deposit tracking needed',
      );
    } else {
      // For regular refund, validate against net paid amount
      const netPaidAmount = this.calculateNetPaidAmount(loan);
      if (createLoanRefundDto.refundAmount > netPaidAmount) {
        throw new BadRequestException(
          `Refund amount (${createLoanRefundDto.refundAmount}) cannot be greater than net paid amount (${netPaidAmount})`,
        );
      }
    }

    const postingDate = new Date(createLoanRefundDto.postingDate);
    const valueDate = new Date(createLoanRefundDto.valueDate);

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create refund entry
      const refund = this.refundRepository.create({
        loanId: loan.id,
        loanProductId: loan.loanProductId,
        companyId: loan.companyId,
        postingDate,
        valueDate,
        refundAmount: createLoanRefundDto.refundAmount,
        refundAccount: createLoanRefundDto.refundAccount,
        costCenter: createLoanRefundDto.costCenter,
        isExcessAmountRefund: createLoanRefundDto.isExcessAmountRefund ?? false,
        isSecurityAmountRefund:
          createLoanRefundDto.isSecurityAmountRefund ?? false,
        referenceNumber: createLoanRefundDto.referenceNumber,
        applicantType: loan.applicantType,
        applicantId: loan.applicantId,
      });

      const savedRefund = await queryRunner.manager.save(refund);

      // Update loan based on refund type
      if (createLoanRefundDto.isExcessAmountRefund) {
        // Update excess amount paid (decrease)
        loan.excessAmountPaid = Math.max(
          0,
          Number(loan.excessAmountPaid || 0) -
            createLoanRefundDto.refundAmount,
        );

        // If excess amount becomes 0, mark loan as closed
        if (loan.excessAmountPaid === 0) {
          loan.status = LoanStatus.CLOSED;
          loan.closureDate = valueDate;
        }
      } else if (createLoanRefundDto.isSecurityAmountRefund) {
        // Update refund amount (for security deposit refunds)
        loan.refundAmount = Number(loan.refundAmount || 0) + createLoanRefundDto.refundAmount;
        // TODO: Update LoanSecurityDeposit when entity is added
      } else {
        // Update refund amount (regular refund)
        loan.refundAmount = Number(loan.refundAmount || 0) + createLoanRefundDto.refundAmount;
      }

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Refund created: ${savedRefund.id} for loan: ${loan.id}, amount: ${createLoanRefundDto.refundAmount}`,
      );

      // Create accounting entries for refund
      if (loan.loanProduct) {
        try {
          const loanProduct = await this.loanProductRepository.findOne({
            where: { id: loan.loanProductId },
          });

          if (loanProduct && loanProduct.paymentAccount) {
            await this.accountingService.createRefundEntries(
              loan.id,
              savedRefund.id,
              loan.companyId,
              postingDate,
              valueDate,
              createLoanRefundDto.refundAmount,
              createLoanRefundDto.refundAccount,
              loanProduct.paymentAccount,
              loan.applicantType,
              loan.applicantId,
              createLoanRefundDto.costCenter,
              createLoanRefundDto.isExcessAmountRefund,
            );
            this.logger.log(
              `Accounting entries created for refund: ${savedRefund.id}`,
            );
          }
        } catch (error) {
          // Log error but don't fail the refund
          this.logger.error(
            `Failed to create accounting entries for refund ${savedRefund.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      return savedRefund;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create refund: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(loanId?: string): Promise<LoanRefund[]> {
    if (loanId) {
      return await this.refundRepository.find({
        where: { loanId },
        relations: ['loan', 'loanProduct', 'company'],
        order: { postingDate: 'DESC' },
      });
    }
    return await this.refundRepository.find({
      relations: ['loan', 'loanProduct', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanRefund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: ['loan', 'loanProduct', 'company'],
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    return refund;
  }

  async findByLoanId(loanId: string): Promise<LoanRefund[]> {
    return await this.refundRepository.find({
      where: { loanId },
      relations: ['loan', 'loanProduct', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updateLoanRefundDto: UpdateLoanRefundDto,
  ): Promise<LoanRefund> {
    const refund = await this.findOne(id);

    // Business Rule: Cannot update refund if loan is already closed
    const loan = await this.loanRepository.findOne({
      where: { id: refund.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${refund.loanId} not found`);
    }

    // Apply updates (limited fields can be updated)
    if (updateLoanRefundDto.costCenter !== undefined) {
      refund.costCenter = updateLoanRefundDto.costCenter;
    }
    if (updateLoanRefundDto.referenceNumber !== undefined) {
      refund.referenceNumber = updateLoanRefundDto.referenceNumber;
    }

    return await this.refundRepository.save(refund);
  }

  async remove(id: string): Promise<void> {
    const refund = await this.findOne(id);

    const loan = await this.loanRepository.findOne({
      where: { id: refund.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${refund.loanId} not found`);
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete the refund
      await queryRunner.manager.remove(refund);

      // Recalculate and update loan refund amount
      const remainingRefunds = await queryRunner.manager.find(LoanRefund, {
        where: { loanId: refund.loanId },
      });

      if (refund.isExcessAmountRefund) {
        // Recalculate excess amount paid
        const totalExcessRefunded = remainingRefunds
          .filter((r) => r.isExcessAmountRefund)
          .reduce((sum, r) => sum + Number(r.refundAmount), 0);

        // Get original excess amount (would need to track this, for now use current + refunded)
        loan.excessAmountPaid =
          Number(loan.excessAmountPaid || 0) + refund.refundAmount;
      } else {
        // Recalculate refund amount
        const totalRefunded = remainingRefunds
          .filter((r) => !r.isExcessAmountRefund && !r.isSecurityAmountRefund)
          .reduce((sum, r) => sum + Number(r.refundAmount), 0);

        loan.refundAmount = totalRefunded;
      }

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(`Refund deleted: ${refund.id} for loan: ${loan.id}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete refund ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calculate net paid amount (total payment - refunds)
   * This is used to validate refund amounts
   */
  private calculateNetPaidAmount(loan: Loan): number {
    return Math.max(
      0,
      Number(loan.totalPayment || 0) -
        Number(loan.refundAmount || 0) -
        Number(loan.excessAmountPaid || 0),
    );
  }

  /**
   * Make refund journal entry (helper method matching Frappe API)
   * This is a convenience method that creates a refund entry
   */
  async makeRefundJv(
    loanId: string,
    amount?: number,
    referenceNumber?: string,
    referenceDate?: Date,
  ): Promise<LoanRefund> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    // Auto-calculate amount if not provided
    let refundAmount = amount;
    if (!refundAmount) {
      // Calculate excess amount: total_principal_paid - total_payment
      refundAmount =
        Number(loan.totalPrincipalPaid || 0) - Number(loan.totalPayment || 0);

      if (refundAmount <= 0) {
        throw new BadRequestException(
          'No excess amount pending for refund',
        );
      }
    }

    // Get refund account from loan product
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: loan.loanProductId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${loan.loanProductId} not found`,
      );
    }

    const dto: CreateLoanRefundDto = {
      loanId,
      postingDate: new Date().toISOString().split('T')[0],
      valueDate: (referenceDate || new Date()).toISOString().split('T')[0],
      refundAmount,
      refundAccount: loanProduct.customerRefundAccount || loan.paymentAccount,
      isExcessAmountRefund: true, // Default for make_refund_jv
      referenceNumber,
    };

    return await this.create(dto);
  }
}

