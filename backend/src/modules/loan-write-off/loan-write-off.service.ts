import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanWriteOff } from './entities/loan-write-off.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Company } from '../company/entities/company.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { RepaymentScheduleType } from '../../common/enums/repayment-schedule-type.enum';
import { CreateLoanWriteOffDto } from './dto/create-loan-write-off.dto';
import { UpdateLoanWriteOffDto } from './dto/update-loan-write-off.dto';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class LoanWriteOffService {
  private readonly logger = new Logger(LoanWriteOffService.name);

  constructor(
    @InjectRepository(LoanWriteOff)
    private readonly writeOffRepository: Repository<LoanWriteOff>,
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

  async create(createLoanWriteOffDto: CreateLoanWriteOffDto): Promise<LoanWriteOff> {
    // Validate loan exists with relations
    const loan = await this.loanRepository.findOne({
      where: { id: createLoanWriteOffDto.loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with ID ${createLoanWriteOffDto.loanId} not found`,
      );
    }

    // Business Rule: Loan must be in ACTIVE or DISBURSED status
    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.DISBURSED
    ) {
      throw new BadRequestException(
        `Loan can only be written off if in ACTIVE or DISBURSED status. Current status: ${loan.status}`,
      );
    }

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: loan.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${loan.companyId} not found`);
    }

    // Calculate pending principal amount
    const pendingPrincipalAmount = this.calculatePendingPrincipalAmount(
      loan,
      createLoanWriteOffDto.loanDisbursementId,
    );

    // Determine write-off amount
    let writeOffAmount = createLoanWriteOffDto.writeOffAmount;
    if (!writeOffAmount && !createLoanWriteOffDto.isSettlementWriteOff) {
      // Auto-calculate: use pending principal amount
      writeOffAmount = pendingPrincipalAmount;
    } else if (!writeOffAmount) {
      writeOffAmount = 0; // Settlement write-off can have 0 amount
    }

    // Business Rule: For non-settlement write-offs, amount must equal pending principal
    if (
      !createLoanWriteOffDto.isSettlementWriteOff &&
      Math.abs(writeOffAmount - pendingPrincipalAmount) > 0.01
    ) {
      throw new BadRequestException(
        `Write-off amount (${writeOffAmount}) must equal pending principal amount (${pendingPrincipalAmount})`,
      );
    }

    // Business Rule: Write-off amount cannot exceed pending principal
    if (writeOffAmount > pendingPrincipalAmount) {
      throw new BadRequestException(
        `Write-off amount (${writeOffAmount}) cannot be greater than pending principal amount (${pendingPrincipalAmount})`,
      );
    }

    // Get write-off account from loan product or company
    let writeOffAccount = createLoanWriteOffDto.writeOffAccount;
    if (!writeOffAccount && loan.loanProduct) {
      const loanProduct = await this.loanProductRepository.findOne({
        where: { id: loan.loanProductId },
      });
      writeOffAccount = loanProduct?.writeOffAccount;
    }

    if (!writeOffAccount) {
      // Try to get from company (if company entity has writeOffAccount field)
      // For now, throw error if not provided
      throw new BadRequestException(
        'Write-off account is required. Please provide writeOffAccount or configure it in Loan Product.',
      );
    }

    // Get cost center (from DTO, company doesn't have costCenter field yet)
    const costCenter = createLoanWriteOffDto.costCenter;

    const postingDate = new Date(createLoanWriteOffDto.postingDate);
    const valueDate = createLoanWriteOffDto.valueDate
      ? new Date(createLoanWriteOffDto.valueDate)
      : postingDate;

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create write-off entry
      const writeOff = this.writeOffRepository.create({
        loanId: loan.id,
        loanProductId: loan.loanProductId,
        companyId: loan.companyId,
        postingDate,
        valueDate,
        writeOffAmount,
        writeOffAccount,
        costCenter,
        isNpa: createLoanWriteOffDto.isNpa ?? false,
        isSettlementWriteOff: createLoanWriteOffDto.isSettlementWriteOff ?? false,
        loanDisbursementId: createLoanWriteOffDto.loanDisbursementId,
        applicantType: loan.applicantType,
        applicantId: loan.applicantId,
      });

      const savedWriteOff = await queryRunner.manager.save(writeOff);

      // Update loan
      loan.writtenOffAmount = Number(loan.writtenOffAmount) + writeOffAmount;
      loan.status = LoanStatus.WRITTEN_OFF;

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Write-off created: ${savedWriteOff.id} for loan: ${loan.id}, amount: ${writeOffAmount}`,
      );

      // Create accounting entries for write-off
      if (loan.loanProduct) {
        try {
          const loanProduct = await this.loanProductRepository.findOne({
            where: { id: loan.loanProductId },
          });

          if (loanProduct && loanProduct.loanAccount) {
            await this.accountingService.createWriteOffEntries(
              loan.id,
              savedWriteOff.id,
              loan.companyId,
              postingDate,
              valueDate,
              writeOffAmount,
              writeOffAccount,
              loanProduct.loanAccount,
              loan.applicantType,
              loan.applicantId,
              costCenter,
            );
            this.logger.log(
              `Accounting entries created for write-off: ${savedWriteOff.id}`,
            );
          }
        } catch (error) {
          // Log error but don't fail the write-off
          this.logger.error(
            `Failed to create accounting entries for write-off ${savedWriteOff.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      return savedWriteOff;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create write-off: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(loanId?: string): Promise<LoanWriteOff[]> {
    if (loanId) {
      return await this.writeOffRepository.find({
        where: { loanId },
        relations: ['loan', 'loanProduct', 'company'],
        order: { postingDate: 'DESC' },
      });
    }
    return await this.writeOffRepository.find({
      relations: ['loan', 'loanProduct', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanWriteOff> {
    const writeOff = await this.writeOffRepository.findOne({
      where: { id },
      relations: ['loan', 'loanProduct', 'company'],
    });

    if (!writeOff) {
      throw new NotFoundException(`Write-off with ID ${id} not found`);
    }

    return writeOff;
  }

  async findByLoanId(loanId: string): Promise<LoanWriteOff[]> {
    return await this.writeOffRepository.find({
      where: { loanId },
      relations: ['loan', 'loanProduct', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updateLoanWriteOffDto: UpdateLoanWriteOffDto,
  ): Promise<LoanWriteOff> {
    const writeOff = await this.findOne(id);

    // Business Rule: Cannot update write-off if loan is already written off
    // (Write-offs are typically immutable once created)
    const loan = await this.loanRepository.findOne({
      where: { id: writeOff.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${writeOff.loanId} not found`);
    }

    // Apply updates (limited fields can be updated)
    if (updateLoanWriteOffDto.costCenter !== undefined) {
      writeOff.costCenter = updateLoanWriteOffDto.costCenter;
    }

    return await this.writeOffRepository.save(writeOff);
  }

  async remove(id: string): Promise<void> {
    const writeOff = await this.findOne(id);

    // Business Rule: Cannot delete write-off if loan is already written off
    // (Write-offs are typically immutable once created)
    const loan = await this.loanRepository.findOne({
      where: { id: writeOff.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${writeOff.loanId} not found`);
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete the write-off
      await queryRunner.manager.remove(writeOff);

      // Recalculate and update loan written-off amount
      const remainingWriteOffs = await queryRunner.manager.find(LoanWriteOff, {
        where: { loanId: writeOff.loanId },
      });

      const totalWrittenOff = remainingWriteOffs.reduce(
        (sum, wo) => sum + Number(wo.writeOffAmount),
        0,
      );

      loan.writtenOffAmount = totalWrittenOff;

      // If no write-offs remain, revert loan status (if appropriate)
      if (totalWrittenOff === 0 && loan.status === LoanStatus.WRITTEN_OFF) {
        // Revert to previous status (ACTIVE or DISBURSED)
        loan.status = LoanStatus.ACTIVE;
      }

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(`Write-off deleted: ${writeOff.id} for loan: ${loan.id}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete write-off ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calculate pending principal amount based on loan status and type
   * Implements Frappe business rules for pending principal calculation
   */
  private calculatePendingPrincipalAmount(
    loan: Loan,
    loanDisbursementId?: string,
  ): number {
    // Business Rule: Line of Credit requires per-disbursement tracking
    if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
      // Simplified: disbursed - principal paid
      // TODO: Implement per-disbursement tracking when principalAmountPaid is added to LoanDisbursement
      return Math.max(
        0,
        Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
      );
    }

    // Business Rule: For Disbursed/Active/Closed/Written Off loans, use full formula
    if (
      [
        LoanStatus.DISBURSED,
        LoanStatus.CLOSED,
        LoanStatus.ACTIVE,
        LoanStatus.WRITTEN_OFF,
      ].includes(loan.status)
    ) {
      return Math.max(
        0,
        Number(loan.totalPayment || 0) +
          Number(loan.debitAdjustmentAmount || 0) -
          Number(loan.creditAdjustmentAmount || 0) -
          Number(loan.totalPrincipalPaid) -
          Number(loan.totalInterestPayable || 0),
      );
    }

    // Business Rule: Default calculation for other statuses
    return Math.max(
      0,
      Number(loan.disbursedAmount) +
        Number(loan.debitAdjustmentAmount || 0) -
        Number(loan.creditAdjustmentAmount || 0) -
        Number(loan.totalPrincipalPaid),
    );
  }

  /**
   * Make loan write-off (helper method matching Frappe API)
   * This is a convenience method that creates a write-off entry
   */
  async makeLoanWriteOff(
    loanId: string,
    companyId?: string,
    postingDate?: Date,
    amount?: number,
  ): Promise<LoanWriteOff> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const dto: CreateLoanWriteOffDto = {
      loanId,
      postingDate: (postingDate || new Date()).toISOString().split('T')[0],
      writeOffAmount: amount,
      isSettlementWriteOff: true, // Default to settlement write-off for this method
    };

    return await this.create(dto);
  }
}

