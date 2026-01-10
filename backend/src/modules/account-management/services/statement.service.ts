import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanStatement, StatementType, StatementStatus, DeliveryMethod } from '../entities/loan-statement.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { CreateStatementDto } from '../dto/loan-statement.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service for statement generation
 * UC-020: Statement Generation
 */
@Injectable()
export class StatementService {
  private readonly logger = new Logger(StatementService.name);

  constructor(
    @InjectRepository(LoanStatement)
    private readonly statementRepository: Repository<LoanStatement>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Generate statement
   */
  async generateStatement(createDto: CreateStatementDto): Promise<LoanStatement> {
    const loan = await this.loanRepository.findOne({ where: { id: createDto.loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    const statementDate = createDto.statementDate ? new Date(createDto.statementDate) : new Date();
    const statementType = createDto.statementType || StatementType.ON_DEMAND;

    // Calculate period dates
    let periodStartDate: Date;
    let periodEndDate: Date = new Date(statementDate);

    if (statementType === StatementType.MONTHLY) {
      periodStartDate = new Date(statementDate.getFullYear(), statementDate.getMonth(), 1);
      periodEndDate = new Date(statementDate.getFullYear(), statementDate.getMonth() + 1, 0);
    } else if (statementType === StatementType.ANNUAL) {
      periodStartDate = new Date(statementDate.getFullYear(), 0, 1);
      periodEndDate = new Date(statementDate.getFullYear(), 11, 31);
    } else {
      // On-demand: last 30 days
      periodStartDate = new Date(statementDate);
      periodStartDate.setDate(periodStartDate.getDate() - 30);
    }

    // Get repayments in period
    const repayments = await this.repaymentRepository.find({
      where: {
        loanId: createDto.loanId,
      },
    });

    const periodRepayments = repayments.filter(
      (r) =>
        new Date(r.postingDate) >= periodStartDate && new Date(r.postingDate) <= periodEndDate,
    );

    // Calculate statement amounts
    const principalPaid = periodRepayments.reduce((sum, r) => sum + Number(r.principalPaid), 0);
    const interestPaid = periodRepayments.reduce((sum, r) => sum + Number(r.interestPaid), 0);
    const penaltyPaid = periodRepayments.reduce((sum, r) => sum + Number(r.penaltyPaid), 0);

    // Calculate balances
    const openingBalance = loan.loanAmount - (loan.totalPrincipalPaid || 0) + principalPaid;
    const closingBalance = loan.loanAmount - (loan.totalPrincipalPaid || 0);
    const principalReduction = principalPaid;
    const interestAccrued = this.calculateInterestAccrued(loan, periodStartDate, periodEndDate);

    const statement = this.statementRepository.create({
      ...createDto,
      loanId: createDto.loanId,
      statementType,
      statementDate,
      periodStartDate,
      periodEndDate,
      openingBalance,
      closingBalance,
      principalPaid,
      interestPaid,
      penaltyPaid,
      interestAccrued,
      principalReduction,
      status: StatementStatus.GENERATED,
      deliveryMethod: createDto.deliveryMethod || DeliveryMethod.EMAIL,
    });

    const savedStatement = await this.statementRepository.save(statement);

    // In production, would generate PDF and store file
    // savedStatement.filePath = await this.generatePDF(savedStatement);
    // savedStatement.fileUrl = await this.uploadToStorage(savedStatement.filePath);
    // await this.statementRepository.save(savedStatement);

    this.logger.log(`Statement generated: ${savedStatement.id} for loan ${loan.loanNumber}`);

    return savedStatement;
  }

  /**
   * Send statement
   */
  async sendStatement(statementId: string): Promise<LoanStatement> {
    const statement = await this.statementRepository.findOne({
      where: { id: statementId },
      relations: ['loan'],
    });

    if (!statement) {
      throw new NotFoundException(`Statement with ID ${statementId} not found`);
    }

    // In production, would send via email/mail based on deliveryMethod
    // await this.notificationService.sendStatement(statement);

    statement.status = StatementStatus.SENT;
    statement.sentAt = new Date();
    await this.statementRepository.save(statement);

    this.logger.log(`Statement sent: ${statementId}`);

    return statement;
  }

  /**
   * Get statements for loan
   */
  async getStatementsForLoan(loanId: string): Promise<LoanStatement[]> {
    return await this.statementRepository.find({
      where: { loanId },
      order: { statementDate: 'DESC' },
    });
  }

  /**
   * Scheduled job: Generate monthly statements
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyStatements(): Promise<void> {
    this.logger.log('Generating monthly statements...');

    const loans = await this.loanRepository.find({
      where: { status: LoanStatus.ACTIVE }, // Or appropriate status
    });

    for (const loan of loans) {
      try {
        await this.generateStatement({
          loanId: loan.id,
          statementType: StatementType.MONTHLY,
          deliveryMethod: DeliveryMethod.EMAIL,
        });
      } catch (error) {
        this.logger.error(`Failed to generate statement for loan ${loan.id}: ${error.message}`);
      }
    }

    this.logger.log(`Generated statements for ${loans.length} loans`);
  }

  /**
   * Calculate interest accrued in period
   */
  private calculateInterestAccrued(loan: Loan, startDate: Date, endDate: Date): number {
    // Simplified calculation - would use actual interest accrual service
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const outstandingBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    return outstandingBalance * dailyRate * days;
  }
}

