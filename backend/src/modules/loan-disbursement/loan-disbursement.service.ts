import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanDisbursement } from './entities/loan-disbursement.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { RepaymentScheduleType } from '../../common/enums/repayment-schedule-type.enum';
import { CreateLoanDisbursementDto } from './dto/create-loan-disbursement.dto';
import { UpdateLoanDisbursementDto } from './dto/update-loan-disbursement.dto';
import { LoanSecurityShortfallService } from '../loan-security-shortfall/loan-security-shortfall.service';
import { LoanSecurityAssignmentService } from '../loan-security-assignment/loan-security-assignment.service';
import { LoanSecurityPriceService } from '../loan-security-price/loan-security-price.service';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../loan/entities/loan-repayment-schedule.entity';
import { CalculationService } from '../calculation/calculation.service';
import { DateUtils } from '../../common/utils/date.utils';
import { LoanChargePostingService } from '../loan-charge-posting/loan-charge-posting.service';
import { AccountingService } from '../accounting/accounting.service';
import { LoanNotificationHelperService } from '../notification/services/loan-notification-helper.service';
import { CurrencyConversionService } from '../currency/services/currency-conversion.service';
import { DisbursementIntegrationService } from './services/disbursement-integration.service';

@Injectable()
export class LoanDisbursementService {
  private readonly logger = new Logger(LoanDisbursementService.name);

  constructor(
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    private readonly shortfallService: LoanSecurityShortfallService,
    private readonly assignmentService: LoanSecurityAssignmentService,
    private readonly priceService: LoanSecurityPriceService,
    private readonly calculationService: CalculationService,
    private readonly chargePostingService: LoanChargePostingService,
    private readonly accountingService: AccountingService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly notificationHelper: LoanNotificationHelperService,
    private readonly currencyConversionService: CurrencyConversionService,
    private readonly disbursementIntegrationService: DisbursementIntegrationService,
  ) {}

  async create(createLoanDisbursementDto: CreateLoanDisbursementDto): Promise<LoanDisbursement> {
    // Validate loan exists with relations
    const loan = await this.loanRepository.findOne({
      where: { id: createLoanDisbursementDto.loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createLoanDisbursementDto.loanId} not found`);
    }

    // Business Rule: Loan must be in SANCTIONED or PARTIALLY_DISBURSED status
    if (
      loan.status !== LoanStatus.SANCTIONED &&
      loan.status !== LoanStatus.PARTIALLY_DISBURSED
    ) {
      throw new BadRequestException(
        `Loan must be in SANCTIONED or PARTIALLY_DISBURSED status to disburse. Current status: ${loan.status}`,
      );
    }

    // Business Rule: Disbursement date must be >= loan posting date
    const disbursementDate = new Date(createLoanDisbursementDto.disbursementDate);
    const postingDate = new Date(loan.postingDate);
    if (disbursementDate < postingDate) {
      throw new BadRequestException(
        `Disbursement date (${disbursementDate.toISOString().split('T')[0]}) cannot be before loan posting date (${postingDate.toISOString().split('T')[0]})`,
      );
    }

    // Business Rule: Validate minimum days between disbursement and first repayment
    if (loan.repaymentStartDate && loan.loanProduct) {
      const repaymentStartDate = new Date(loan.repaymentStartDate);
      const daysDiff = Math.floor(
        (repaymentStartDate.getTime() - disbursementDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const minDays =
        loan.loanProduct.minDaysBwDisbursementFirstRepayment || 0;

      if (daysDiff < minDays) {
        throw new BadRequestException(
          `Days between disbursement and first repayment (${daysDiff}) is less than minimum required (${minDays})`,
      );
      }
    }

    // Calculate total disbursed amount
    const existingDisbursements = await this.disbursementRepository.find({
      where: { loanId: createLoanDisbursementDto.loanId },
    });

    const totalDisbursed = existingDisbursements.reduce(
      (sum, d) => sum + Number(d.disbursedAmount),
      0,
    );

    // Business Rule: Validate disbursed amount > 0
    if (Number(createLoanDisbursementDto.disbursedAmount) <= 0) {
      throw new BadRequestException(
        'Disbursed amount must be greater than 0',
      );
    }

    // Business Rule: Validate disbursement doesn't exceed loan amount (for term loans)
    // For Line of Credit, validate against available limit
    const newTotal = totalDisbursed + Number(createLoanDisbursementDto.disbursedAmount);
    
    if (loan.isTermLoan && loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
      // Term loan: cannot exceed loan amount
      if (newTotal > Number(loan.loanAmount)) {
        throw new BadRequestException(
          `Total disbursement amount (${newTotal}) exceeds loan amount (${loan.loanAmount})`,
        );
      }
    } else if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
      // Line of Credit: validate against available limit
      if (!loan.maximumLimitAmount) {
        throw new BadRequestException(
          'Maximum limit amount is not set for Line of Credit loan',
        );
      }

      // Validate disbursement date is within limit period
      const disbursementDate = new Date(createLoanDisbursementDto.disbursementDate);
      if (loan.limitApplicableStart && disbursementDate < loan.limitApplicableStart) {
        throw new BadRequestException(
          'Disbursement date is before limit applicable start date',
        );
      }
      if (loan.limitApplicableEnd && disbursementDate > loan.limitApplicableEnd) {
        throw new BadRequestException(
          'Disbursement date is after limit applicable end date',
        );
      }

      // Calculate available limit
      const utilizedLimit = Number(loan.utilizedLimitAmount || 0);
      const availableLimit = Number(loan.maximumLimitAmount) - utilizedLimit;

      if (Number(createLoanDisbursementDto.disbursedAmount) > availableLimit) {
        throw new BadRequestException(
          `Disbursement amount (${createLoanDisbursementDto.disbursedAmount}) exceeds available limit (${availableLimit})`,
        );
      }
    } else {
      // Default: cannot exceed loan amount
    if (newTotal > Number(loan.loanAmount)) {
      throw new BadRequestException(
        `Total disbursement amount (${newTotal}) exceeds loan amount (${loan.loanAmount})`,
      );
    }
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    // Create disbursement
    const disbursement = this.disbursementRepository.create({
      ...createLoanDisbursementDto,
      disbursementDate: new Date(createLoanDisbursementDto.disbursementDate),
    });

      // Handle currency conversion if needed
      if (loan.currencyId) {
        const baseCurrency = await this.currencyConversionService.getBaseCurrency();
        
        // If disbursement currency is different from loan currency, convert
        if (createLoanDisbursementDto.currencyId && 
            createLoanDisbursementDto.currencyId !== loan.currencyId) {
          // Validate currency
          const isValid = await this.currencyConversionService.validateCurrency(
            createLoanDisbursementDto.currencyId
          );
          if (!isValid) {
            throw new BadRequestException('Invalid disbursement currency');
          }

          // Convert to loan currency
          const conversion = await this.currencyConversionService.convertAmount(
            createLoanDisbursementDto.disbursedAmount,
            createLoanDisbursementDto.currencyId,
            loan.currencyId,
            new Date(createLoanDisbursementDto.disbursementDate)
          );
          
          disbursement.currencyId = createLoanDisbursementDto.currencyId;
          disbursement.exchangeRate = conversion.exchangeRate;
          // Note: disbursedAmount remains in loan currency after conversion
        } else {
          // Convert to base currency for reporting
          const conversion = await this.currencyConversionService.convertAmount(
            createLoanDisbursementDto.disbursedAmount,
            loan.currencyId,
            baseCurrency.id,
            new Date(createLoanDisbursementDto.disbursementDate)
          );
          
          disbursement.disbursedAmountBaseCurrency = conversion.convertedAmount;
          disbursement.exchangeRate = conversion.exchangeRate;
        }
        
        // Update loan base currency amount if not set
        if (!loan.loanAmountBaseCurrency) {
          const loanConversion = await this.currencyConversionService.convertAmount(
            loan.loanAmount,
            loan.currencyId,
            baseCurrency.id
          );
          loan.loanAmountBaseCurrency = loanConversion.convertedAmount;
          loan.exchangeRateAtDisbursement = loanConversion.exchangeRate;
        }
      }

      const savedDisbursement = await queryRunner.manager.save(disbursement);

    // Update loan disbursed amount
    loan.disbursedAmount = newTotal;
    if (newTotal === Number(loan.loanAmount)) {
      // Fully disbursed - update status to DISBURSED
      loan.status = LoanStatus.DISBURSED;
      loan.disbursementDate = new Date(createLoanDisbursementDto.disbursementDate);
      
      // Auto-generate repayment schedule if term loan
      // Business Rule: Generate schedule automatically when loan is fully disbursed
      if (loan.isTermLoan && loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
        // Check if schedule already exists (shouldn't for first disbursement)
        const existingSchedules = await queryRunner.manager
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('loan_repayment_schedules', 'schedule')
          .where('schedule.loanId = :loanId', { loanId: loan.id })
          .getRawOne();
        
        const scheduleCount = parseInt(existingSchedules?.count || '0', 10);
        
        if (scheduleCount === 0 && loan.repaymentStartDate && loan.repaymentPeriods && loan.repaymentFrequency) {
          // Generate schedule after saving loan
          // We'll do this after commit to avoid transaction issues
          this.logger.log(`Loan ${loan.id} fully disbursed. Schedule will be generated.`);
        }
      }
    } else {
      // Partially disbursed
      loan.status = LoanStatus.PARTIALLY_DISBURSED;
      if (!loan.disbursementDate) {
        loan.disbursementDate = new Date(createLoanDisbursementDto.disbursementDate);
      }
    }

      // Update LOC limit amounts if this is a Line of Credit loan
      if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
        loan.utilizedLimitAmount = Number(loan.utilizedLimitAmount || 0) + Number(createLoanDisbursementDto.disbursedAmount);
        loan.availableLimitAmount = Number(loan.maximumLimitAmount || 0) - Number(loan.utilizedLimitAmount);
      }

      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(`Disbursement created: ${savedDisbursement.id} for loan: ${loan.id}, amount: ${savedDisbursement.disbursedAmount}`);
      
      // Auto-generate repayment schedule if loan is fully disbursed and term loan
      // Do this after commit to avoid transaction issues
      if (newTotal === Number(loan.loanAmount) && 
          loan.isTermLoan && 
          loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
        try {
          // Reload loan to get latest state
          const updatedLoan = await this.loanRepository.findOne({
            where: { id: loan.id },
            relations: ['loanProduct'],
          });
          
          if (updatedLoan && 
              updatedLoan.repaymentStartDate && 
              updatedLoan.repaymentPeriods && 
              updatedLoan.repaymentFrequency) {
            // Check if schedule already exists
            const existingSchedules = await this.scheduleRepository.find({
              where: { loanId: updatedLoan.id },
            });
            
            if (existingSchedules.length === 0) {
              // Generate schedule using the same logic as LoanService
              await this.generateRepaymentScheduleForLoan(updatedLoan);
              this.logger.log(
                `Repayment schedule auto-generated for loan: ${updatedLoan.id}`,
              );
            }
          }
        } catch (error) {
          // Log error but don't fail the disbursement
          this.logger.error(
            `Failed to auto-generate repayment schedule for loan ${loan.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Post charges for disbursement
      try {
        await this.chargePostingService.postChargesForDisbursement(
          loan.id,
          savedDisbursement.id,
          disbursementDate,
          Number(savedDisbursement.disbursedAmount),
        );
        this.logger.log(
          `Charges posted for disbursement: ${savedDisbursement.id}`,
        );
      } catch (error) {
        // Log error but don't fail the disbursement
        this.logger.error(
          `Failed to post charges for disbursement ${savedDisbursement.id}: ${error.message}`,
          error.stack,
        );
      }

      // Create accounting entries for disbursement
      if (loan.loanProduct) {
        try {
          await this.accountingService.createDisbursementEntries(
            loan.id,
            savedDisbursement.id,
            loan.companyId,
            disbursementDate,
            disbursementDate,
            Number(savedDisbursement.disbursedAmount),
            loan.loanProduct.loanAccount,
            loan.loanProduct.disbursementAccount,
            loan.applicantType,
            loan.applicantId,
            undefined, // costCenter - can be added to loan entity later
          );
          this.logger.log(
            `Accounting entries created for disbursement: ${savedDisbursement.id}`,
          );
        } catch (error) {
          // Log error but don't fail the disbursement
          this.logger.error(
            `Failed to create accounting entries for disbursement ${savedDisbursement.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Send notification when loan is disbursed
      try {
        await this.notificationHelper.notifyLoanDisbursed(
          loan,
          savedDisbursement,
          loan.applicantId, // recipientId
          undefined, // recipientEmail - would be fetched from Customer entity
          undefined, // recipientPhone - would be fetched from Customer entity
        );
      } catch (error) {
        // Log error but don't fail the disbursement
        this.logger.error(`Failed to send disbursement notification: ${error.message}`);
      }

      // Send disbursement notification via email with PDF (integration service)
      try {
        await this.disbursementIntegrationService.sendDisbursementNotification(savedDisbursement.id);
      } catch (error) {
        // Log error but don't fail the disbursement
        this.logger.error(
          `Failed to send disbursement email notification: ${error.message}`,
        );
      }

      // Send notification when loan becomes active (fully disbursed)
      if (newTotal === Number(loan.loanAmount) && loan.status === LoanStatus.DISBURSED) {
        try {
          await this.notificationHelper.notifyLoanActive(
            loan,
            loan.applicantId, // recipientId
            undefined, // recipientEmail - would be fetched from Customer entity
            undefined, // recipientPhone - would be fetched from Customer entity
          );
        } catch (error) {
          this.logger.error(`Failed to send loan active notification: ${error.message}`);
        }
      }
      
    return savedDisbursement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(loanId?: string): Promise<LoanDisbursement[]> {
    if (loanId) {
      return await this.disbursementRepository.find({ where: { loanId } });
    }
    return await this.disbursementRepository.find();
  }

  async findOne(id: string): Promise<LoanDisbursement> {
    const disbursement = await this.disbursementRepository.findOne({ where: { id } });
    if (!disbursement) {
      throw new NotFoundException(`Disbursement with ID ${id} not found`);
    }
    return disbursement;
  }

  async findByLoanId(loanId: string): Promise<LoanDisbursement[]> {
    return await this.disbursementRepository.find({ where: { loanId } });
  }

  async update(id: string, updateLoanDisbursementDto: UpdateLoanDisbursementDto): Promise<LoanDisbursement> {
    const disbursement = await this.findOne(id);
    
    // Get loan to validate changes
    const loan = await this.loanRepository.findOne({
      where: { id: disbursement.loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${disbursement.loanId} not found`);
    }

    // Business Rule: Cannot update disbursement if loan is already DISBURSED or ACTIVE
    // (Only allow updates for SANCTIONED or PARTIALLY_DISBURSED loans)
    if (
      loan.status === LoanStatus.DISBURSED ||
      loan.status === LoanStatus.ACTIVE ||
      loan.status === LoanStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Cannot update disbursement for loan in ${loan.status} status. Disbursements can only be updated for SANCTIONED or PARTIALLY_DISBURSED loans.`,
      );
    }

    // Validate disbursement date if being updated
    if (updateLoanDisbursementDto.disbursementDate) {
      const newDisbursementDate = new Date(updateLoanDisbursementDto.disbursementDate);
      const postingDate = new Date(loan.postingDate);
      
      if (newDisbursementDate < postingDate) {
        throw new BadRequestException(
          `Disbursement date cannot be before loan posting date (${postingDate.toISOString().split('T')[0]})`,
        );
      }
    }

    // Validate disbursed amount if being updated
    if (updateLoanDisbursementDto.disbursedAmount !== undefined) {
      if (Number(updateLoanDisbursementDto.disbursedAmount) <= 0) {
        throw new BadRequestException('Disbursed amount must be greater than 0');
      }

      // Calculate total from other disbursements (excluding this one)
      const otherDisbursements = await this.disbursementRepository.find({
        where: { loanId: disbursement.loanId },
      });
      
      const otherTotal = otherDisbursements
        .filter(d => d.id !== id)
        .reduce((sum, d) => sum + Number(d.disbursedAmount), 0);
      
      const newTotal = otherTotal + Number(updateLoanDisbursementDto.disbursedAmount);
      
      if (newTotal > Number(loan.loanAmount)) {
        throw new BadRequestException(
          `Updated total disbursement amount (${newTotal}) would exceed loan amount (${loan.loanAmount})`,
        );
      }
    }

    // Apply updates
    if (updateLoanDisbursementDto.disbursementDate) {
      disbursement.disbursementDate = new Date(updateLoanDisbursementDto.disbursementDate);
    }
    if (updateLoanDisbursementDto.disbursedAmount !== undefined) {
      disbursement.disbursedAmount = updateLoanDisbursementDto.disbursedAmount;
    }
    if (updateLoanDisbursementDto.referenceNumber !== undefined) {
      disbursement.referenceNumber = updateLoanDisbursementDto.referenceNumber;
    }
    if (updateLoanDisbursementDto.modeOfPayment !== undefined) {
      disbursement.modeOfPayment = updateLoanDisbursementDto.modeOfPayment;
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedDisbursement = await queryRunner.manager.save(disbursement);

      // Recalculate and update loan disbursed amount
      const allDisbursements = await queryRunner.manager.find(LoanDisbursement, {
        where: { loanId: disbursement.loanId },
      });
      
      const totalDisbursed = allDisbursements.reduce(
        (sum, d) => sum + Number(d.disbursedAmount),
        0,
      );

      loan.disbursedAmount = totalDisbursed;
      
      if (totalDisbursed === Number(loan.loanAmount)) {
        loan.status = LoanStatus.DISBURSED;
      } else if (totalDisbursed > 0) {
        loan.status = LoanStatus.PARTIALLY_DISBURSED;
      } else {
        loan.status = LoanStatus.SANCTIONED;
      }
      
      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(`Disbursement updated: ${updatedDisbursement.id} for loan: ${loan.id}`);
      return updatedDisbursement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update disbursement ${id}: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const disbursement = await this.findOne(id);
    
    // Get loan to validate deletion
    const loan = await this.loanRepository.findOne({
      where: { id: disbursement.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${disbursement.loanId} not found`);
    }

    // Business Rule: Cannot delete disbursement if loan is DISBURSED, ACTIVE, or CLOSED
    // (Only allow deletion for SANCTIONED or PARTIALLY_DISBURSED loans)
    if (
      loan.status === LoanStatus.DISBURSED ||
      loan.status === LoanStatus.ACTIVE ||
      loan.status === LoanStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Cannot delete disbursement for loan in ${loan.status} status. Disbursements can only be deleted for SANCTIONED or PARTIALLY_DISBURSED loans.`,
      );
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete the disbursement
      await queryRunner.manager.remove(disbursement);

      // Recalculate and update loan disbursed amount
      const remainingDisbursements = await queryRunner.manager.find(LoanDisbursement, {
        where: { loanId: disbursement.loanId },
      });
      
      const totalDisbursed = remainingDisbursements.reduce(
        (sum, d) => sum + Number(d.disbursedAmount),
        0,
      );

      loan.disbursedAmount = totalDisbursed;
      
      if (totalDisbursed === 0) {
        loan.status = LoanStatus.SANCTIONED;
        loan.disbursementDate = null;
      } else if (totalDisbursed < Number(loan.loanAmount)) {
        loan.status = LoanStatus.PARTIALLY_DISBURSED;
      }
      
      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      this.logger.log(`Disbursement deleted: ${disbursement.id} for loan: ${loan.id}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete disbursement ${id}: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getDisbursalAmount(
    loanId: string,
    onCurrentSecurityPrice: boolean = false,
  ): Promise<{ disbursalAmount: number; pendingPrincipalAmount: number }> {
    // Get loan details
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    // Business Rule: Check for security shortfall (if secured loan)
    // If pending shortfall exists, disbursal amount = 0
    if (loan.isSecuredLoan) {
      const hasShortfall = await this.shortfallService.hasPendingShortfall(loanId);
      if (hasShortfall) {
        return {
          disbursalAmount: 0,
          pendingPrincipalAmount: this.calculatePendingPrincipal(loan),
        };
      }
    }

    // Calculate pending principal amount using proper business rules
    const pendingPrincipalAmount = this.calculatePendingPrincipal(loan);

    // Calculate security value based on business rules
    const securityValue = await this.calculateSecurityValue(
      loan,
      onCurrentSecurityPrice,
    );

    // Calculate disbursal amount
    let disbursalAmount = securityValue - pendingPrincipalAmount;

    // Business Rule: For term loans, ensure disbursal doesn't exceed remaining loan amount
    if (loan.isTermLoan) {
      const remainingLoanAmount =
        Number(loan.loanAmount) - Number(loan.disbursedAmount);
      disbursalAmount = Math.min(disbursalAmount, remainingLoanAmount);
    }

    // Ensure non-negative
    disbursalAmount = Math.max(0, disbursalAmount);

    return {
      disbursalAmount: Number(disbursalAmount.toFixed(2)),
      pendingPrincipalAmount: Number(pendingPrincipalAmount.toFixed(2)),
    };
  }

  /**
   * Calculate pending principal amount based on loan status and type
   * Implements business rules for pending principal calculation
   */
  private calculatePendingPrincipal(loan: Loan): number {
    // Note: Cancelled status not in enum, but if needed can be added
    // For now, we proceed with other status checks

    // Business Rule: Line of Credit requires per-disbursement tracking
    // For now, we use simplified calculation until per-disbursement tracking is implemented
    if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
      // Simplified: disbursed - principal paid
      // TODO: Implement per-disbursement tracking when principalAmountPaid is added to LoanDisbursement
      return Math.max(
        0,
        Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
      );
    }

    // Business Rule: For Disbursed/Closed/Active loans, use full formula
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
   * Calculate security value based on loan type and security price flag
   * Implements Frappe business rules for security valuation
   */
  private async calculateSecurityValue(
    loan: Loan,
    onCurrentSecurityPrice: boolean,
  ): Promise<number> {
    // Business Rule: Unsecured loans use loan amount as security value
    if (!loan.isSecuredLoan) {
      return Number(loan.loanAmount);
    }

    // Business Rule: Secured loans with current security price
    if (onCurrentSecurityPrice) {
      return await this.getTotalPledgedSecurityValue(loan.id);
    }

    // Business Rule: Secured loans use maximum loan amount from security assignment
    // This is set when securities are pledged
    if (loan.maximumLoanAmount) {
      return Number(loan.maximumLoanAmount);
    }

    // Fallback: try to get from assignments, otherwise use loan amount
    const maxAmount = await this.assignmentService.getMaximumLoanAmount(loan.id);
    return maxAmount > 0 ? maxAmount : Number(loan.loanAmount);
  }

  /**
   * Get total pledged security value using current prices
   * Implements Frappe business rule: sum(qty * current_price * (1 - haircut/100))
   */
  private async getTotalPledgedSecurityValue(loanId: string): Promise<number> {
    // Get pledged security quantities
    const pledgedQty = await this.assignmentService.getPledgedSecurityQty(loanId);

    if (pledgedQty.size === 0) {
      return 0;
    }

    // Get current prices for all pledged securities
    const securityIds = Array.from(pledgedQty.keys());
    const currentPrices = await this.priceService.getPricesForSecurities(
      securityIds,
    );

    // Get assignments to access haircut information
    const assignments = await this.assignmentService.findByLoanId(loanId);

    let totalSecurityValue = 0;

    // Calculate value for each security
    for (const assignment of assignments) {
      for (const pledge of assignment.pledges) {
        const qty = Number(pledge.qty);
        const currentPrice = currentPrices.get(pledge.loanSecurityId);

        if (currentPrice !== undefined) {
          // Use current price if available
          const amount = qty * currentPrice;
          const haircut = Number(pledge.haircut || 0);
          const postHaircutAmount = amount * (1 - haircut / 100);
          totalSecurityValue += postHaircutAmount;
        } else {
          // Fallback to pledge price if current price not available
          const amount = Number(pledge.amount);
          const haircut = Number(pledge.haircut || 0);
          const postHaircutAmount = amount * (1 - haircut / 100);
          totalSecurityValue += postHaircutAmount;
        }
      }
    }

    return totalSecurityValue;
  }

  /**
   * Generate repayment schedule for a loan
   * This method duplicates the logic from LoanService to avoid circular dependencies
   */
  private async generateRepaymentScheduleForLoan(
    loan: Loan,
  ): Promise<LoanRepaymentSchedule[]> {
    // Calculate EMI
    const emi = this.calculationService.calculateEMI(
      Number(loan.loanAmount),
      Number(loan.rateOfInterest),
      loan.repaymentPeriods,
      loan.repaymentFrequency,
    );

    const schedules: LoanRepaymentSchedule[] = [];
    let currentDate = new Date(loan.repaymentStartDate);
    let remainingPrincipal = Number(loan.loanAmount);

    for (let i = 1; i <= loan.repaymentPeriods; i++) {
      // Calculate interest for this period
      const days = DateUtils.daysBetween(
        i === 1 ? loan.disbursementDate || loan.postingDate : currentDate,
        currentDate,
      );
      const interest = this.calculationService.calculateInterest(
        remainingPrincipal,
        Number(loan.rateOfInterest),
        days,
        'Actual/365',
        currentDate,
      );

      // Calculate principal
      const principal = Math.min(emi - interest, remainingPrincipal);

      // Update remaining principal
      remainingPrincipal -= principal;

      // Create schedule entry
      const schedule = this.scheduleRepository.create({
        loanId: loan.id,
        installmentNumber: i,
        paymentDate: new Date(currentDate),
        principalAmount: principal,
        interestAmount: interest,
        totalPayment: principal + interest,
        balanceLoanAmount: remainingPrincipal,
        days,
        status: ScheduleEntryStatus.PENDING,
        demandGenerated: false,
      });

      schedules.push(schedule);

      // Calculate next payment date
      currentDate = DateUtils.getNextPaymentDate(
        currentDate,
        loan.repaymentFrequency,
      );
    }

    // Save all schedules
    return await this.scheduleRepository.save(schedules);
  }
}

