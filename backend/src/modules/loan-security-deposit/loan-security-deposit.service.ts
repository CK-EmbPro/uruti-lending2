import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';
import {
  LoanSecurityDepositUsage,
  SecurityDepositUsageType,
} from './entities/loan-security-deposit-usage.entity';
import { CreateSecurityDepositUsageDto } from './dto/create-security-deposit-usage.dto';

@Injectable()
export class LoanSecurityDepositService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanSecurityDepositUsage)
    private readonly usageRepository: Repository<LoanSecurityDepositUsage>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Add security deposit to loan
   */
  async addSecurityDeposit(
    loanId: string,
    amount: number,
  ): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    if (amount <= 0) {
      throw new BadRequestException('Security deposit amount must be greater than 0');
    }

    loan.securityDepositAmount =
      (loan.securityDepositAmount || 0) + amount;
    loan.securityDepositAvailable =
      (loan.securityDepositAvailable || 0) + amount;

    return await this.loanRepository.save(loan);
  }

  /**
   * Use security deposit for payment
   */
  async useSecurityDeposit(
    loanId: string,
    usageDto: CreateSecurityDepositUsageDto,
  ): Promise<{
    loan: Loan;
    usage: LoanSecurityDepositUsage;
    remainingAmount: number;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const loan = await queryRunner.manager.findOne(Loan, {
        where: { id: loanId },
      });

      if (!loan) {
        throw new NotFoundException(`Loan with ID ${loanId} not found`);
      }

      const availableDeposit = loan.securityDepositAvailable || 0;

      if (usageDto.amount > availableDeposit) {
        throw new BadRequestException(
          `Insufficient security deposit. Available: ${availableDeposit}, Requested: ${usageDto.amount}`,
        );
      }

      // Create usage record
      const usage = queryRunner.manager.create(LoanSecurityDepositUsage, {
        loanId,
        usageType: usageDto.usageType,
        amount: usageDto.amount,
        usageDate: new Date(usageDto.usageDate),
        referenceDocumentType: usageDto.referenceDocumentType,
        referenceDocumentId: usageDto.referenceDocumentId,
        referenceNumber: usageDto.referenceNumber,
        remarks: usageDto.remarks,
        usedBy: usageDto.usedBy,
        balanceBefore: availableDeposit,
        balanceAfter: availableDeposit - usageDto.amount,
      });

      await queryRunner.manager.save(usage);

      // Update loan
      loan.securityDepositUsed =
        (loan.securityDepositUsed || 0) + usageDto.amount;
      loan.securityDepositAvailable = availableDeposit - usageDto.amount;

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();

      return {
        loan,
        usage,
        remainingAmount: loan.securityDepositAvailable,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Refund security deposit
   */
  async refundSecurityDeposit(
    loanId: string,
    amount: number,
    remarks?: string,
  ): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    const usedDeposit = loan.securityDepositUsed || 0;

    if (amount > usedDeposit) {
      throw new BadRequestException(
        `Refund amount cannot exceed used deposit. Used: ${usedDeposit}, Requested: ${amount}`,
      );
    }

    // Create refund usage record
    const refundUsage = this.usageRepository.create({
      loanId,
      usageType: SecurityDepositUsageType.OTHER,
      amount: -amount, // Negative amount for refund
      usageDate: new Date(),
      remarks: remarks || 'Security deposit refund',
      balanceBefore: loan.securityDepositAvailable || 0,
      balanceAfter: (loan.securityDepositAvailable || 0) + amount,
    });

    await this.usageRepository.save(refundUsage);

    // Update loan
    loan.securityDepositUsed = usedDeposit - amount;
    loan.securityDepositAvailable =
      (loan.securityDepositAvailable || 0) + amount;

    return await this.loanRepository.save(loan);
  }

  /**
   * Get security deposit usage history
   */
  async getUsageHistory(loanId: string): Promise<LoanSecurityDepositUsage[]> {
    return await this.usageRepository.find({
      where: { loanId },
      order: { usageDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get security deposit summary
   */
  async getSecurityDepositSummary(loanId: string): Promise<{
    totalDeposit: number;
    usedDeposit: number;
    availableDeposit: number;
    usageCount: number;
    lastUsageDate: Date | null;
  }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const usages = await this.getUsageHistory(loanId);
    const positiveUsages = usages.filter((u) => u.amount > 0);

    return {
      totalDeposit: loan.securityDepositAmount || 0,
      usedDeposit: loan.securityDepositUsed || 0,
      availableDeposit: loan.securityDepositAvailable || 0,
      usageCount: positiveUsages.length,
      lastUsageDate:
        positiveUsages.length > 0 ? positiveUsages[0].usageDate : null,
    };
  }

  /**
   * Auto-use security deposit for overdue payments
   */
  async autoUseForOverdue(
    loanId: string,
    overdueAmount: number,
  ): Promise<{
    used: number;
    remaining: number;
  }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    const availableDeposit = loan.securityDepositAvailable || 0;

    if (availableDeposit <= 0 || overdueAmount <= 0) {
      return {
        used: 0,
        remaining: overdueAmount,
      };
    }

    const amountToUse = Math.min(availableDeposit, overdueAmount);

    await this.useSecurityDeposit(loanId, {
      loanId,
      usageType: SecurityDepositUsageType.INTEREST_PAYMENT,
      amount: amountToUse,
      usageDate: new Date().toISOString(),
      remarks: 'Auto-used for overdue payment',
      balanceBefore: availableDeposit,
      balanceAfter: availableDeposit - amountToUse,
    });

    return {
      used: amountToUse,
      remaining: overdueAmount - amountToUse,
    };
  }
}

