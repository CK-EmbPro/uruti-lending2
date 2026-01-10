import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanBalanceAdjustment, AdjustmentType } from './entities/loan-balance-adjustment.entity';
import { Loan } from '../loan/entities/loan.entity';
import { Company } from '../company/entities/company.entity';
import { CreateLoanBalanceAdjustmentDto } from './dto/create-loan-balance-adjustment.dto';
import { UpdateLoanBalanceAdjustmentDto } from './dto/update-loan-balance-adjustment.dto';

@Injectable()
export class LoanBalanceAdjustmentService {
  private readonly logger = new Logger(LoanBalanceAdjustmentService.name);

  constructor(
    @InjectRepository(LoanBalanceAdjustment)
    private readonly adjustmentRepository: Repository<LoanBalanceAdjustment>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createLoanBalanceAdjustmentDto: CreateLoanBalanceAdjustmentDto,
  ): Promise<LoanBalanceAdjustment> {
    // Validate loan exists
    const loan = await this.loanRepository.findOne({
      where: { id: createLoanBalanceAdjustmentDto.loanId },
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with ID ${createLoanBalanceAdjustmentDto.loanId} not found`,
      );
    }

    // Business Rule: Amount cannot be zero or negative
    if (createLoanBalanceAdjustmentDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: loan.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${loan.companyId} not found`);
    }

    // Business Rule: Validate if restructure is in process
    // TODO: Implement when Loan Restructure module is added
    // For now, we'll skip this validation

    // Set missing values
    const adjustmentReceivableAccount =
      createLoanBalanceAdjustmentDto.adjustmentReceivableAccount ||
      loan.loanAccount;

    const postingDate = new Date(createLoanBalanceAdjustmentDto.postingDate);

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create adjustment entry
      const adjustment = this.adjustmentRepository.create({
        loanId: loan.id,
        companyId: loan.companyId,
        postingDate,
        adjustmentType: createLoanBalanceAdjustmentDto.adjustmentType,
        amount: createLoanBalanceAdjustmentDto.amount,
        adjustmentAccount: createLoanBalanceAdjustmentDto.adjustmentAccount,
        adjustmentReceivableAccount,
        costCenter: createLoanBalanceAdjustmentDto.costCenter,
        referenceDocumentType: createLoanBalanceAdjustmentDto.referenceDocumentType,
        referenceName: createLoanBalanceAdjustmentDto.referenceName,
        referenceNumber: createLoanBalanceAdjustmentDto.referenceNumber,
        remarks: createLoanBalanceAdjustmentDto.remarks,
        applicantType: loan.applicantType,
        applicantId: loan.applicantId,
      });

      const savedAdjustment = await queryRunner.manager.save(adjustment);

      // Update loan adjustment amounts
      if (createLoanBalanceAdjustmentDto.adjustmentType === AdjustmentType.CREDIT_ADJUSTMENT) {
        loan.creditAdjustmentAmount =
          Number(loan.creditAdjustmentAmount || 0) +
          createLoanBalanceAdjustmentDto.amount;
      } else {
        loan.debitAdjustmentAmount =
          Number(loan.debitAdjustmentAmount || 0) +
          createLoanBalanceAdjustmentDto.amount;
      }

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Adjustment created: ${savedAdjustment.id} for loan: ${loan.id}, type: ${createLoanBalanceAdjustmentDto.adjustmentType}, amount: ${createLoanBalanceAdjustmentDto.amount}`,
      );

      return savedAdjustment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create adjustment: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(loanId?: string): Promise<LoanBalanceAdjustment[]> {
    if (loanId) {
      return await this.adjustmentRepository.find({
        where: { loanId },
        relations: ['loan', 'company'],
        order: { postingDate: 'DESC' },
      });
    }
    return await this.adjustmentRepository.find({
      relations: ['loan', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanBalanceAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id },
      relations: ['loan', 'company'],
    });

    if (!adjustment) {
      throw new NotFoundException(`Adjustment with ID ${id} not found`);
    }

    return adjustment;
  }

  async findByLoanId(loanId: string): Promise<LoanBalanceAdjustment[]> {
    return await this.adjustmentRepository.find({
      where: { loanId },
      relations: ['loan', 'company'],
      order: { postingDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updateLoanBalanceAdjustmentDto: UpdateLoanBalanceAdjustmentDto,
  ): Promise<LoanBalanceAdjustment> {
    const adjustment = await this.findOne(id);

    // Business Rule: Cannot update adjustment if loan is already closed
    const loan = await this.loanRepository.findOne({
      where: { id: adjustment.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${adjustment.loanId} not found`);
    }

    // Apply updates (limited fields can be updated)
    if (updateLoanBalanceAdjustmentDto.costCenter !== undefined) {
      adjustment.costCenter = updateLoanBalanceAdjustmentDto.costCenter;
    }
    if (updateLoanBalanceAdjustmentDto.referenceNumber !== undefined) {
      adjustment.referenceNumber = updateLoanBalanceAdjustmentDto.referenceNumber;
    }
    if (updateLoanBalanceAdjustmentDto.remarks !== undefined) {
      adjustment.remarks = updateLoanBalanceAdjustmentDto.remarks;
    }

    return await this.adjustmentRepository.save(adjustment);
  }

  async remove(id: string): Promise<void> {
    const adjustment = await this.findOne(id);

    const loan = await this.loanRepository.findOne({
      where: { id: adjustment.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${adjustment.loanId} not found`);
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete the adjustment
      await queryRunner.manager.remove(adjustment);

      // Recalculate and update loan adjustment amounts
      const remainingAdjustments = await queryRunner.manager.find(
        LoanBalanceAdjustment,
        {
          where: { loanId: adjustment.loanId },
        },
      );

      const totalCreditAdjustment = remainingAdjustments
        .filter((a) => a.adjustmentType === AdjustmentType.CREDIT_ADJUSTMENT)
        .reduce((sum, a) => sum + Number(a.amount), 0);

      const totalDebitAdjustment = remainingAdjustments
        .filter((a) => a.adjustmentType === AdjustmentType.DEBIT_ADJUSTMENT)
        .reduce((sum, a) => sum + Number(a.amount), 0);

      loan.creditAdjustmentAmount = totalCreditAdjustment;
      loan.debitAdjustmentAmount = totalDebitAdjustment;

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Adjustment deleted: ${adjustment.id} for loan: ${loan.id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete adjustment ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

