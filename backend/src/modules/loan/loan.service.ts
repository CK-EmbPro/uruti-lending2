import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Loan } from './entities/loan.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from './entities/loan-repayment-schedule.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { ApplicantType } from '../../common/enums/applicant-type.enum';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CalculationService } from '../calculation/calculation.service';
import { DateUtils } from '../../common/utils/date.utils';
import { RepaymentFrequency } from '../../common/enums/repayment-frequency.enum';
import { RepaymentScheduleType, RepaymentStructureType } from '../../common/enums/repayment-schedule-type.enum';
import { LoanDemand } from '../loan-demand/entities/loan-demand.entity';
import { RepaymentStructureService } from '../loan-calculator/services/repayment-structure.service';
import { LoanWriteOffService } from '../loan-write-off/loan-write-off.service';
import { LoanTransferService } from '../loan-transfer/loan-transfer.service';
import { WorkflowIntegrationService } from '../workflow/workflow-integration.service';
import { FldgTriggerService } from '../loan-partner/services/fldg-trigger.service';
import { LoanNotificationHelperService } from '../notification/services/loan-notification-helper.service';
import { IntegrationService } from '../integration/services/integration.service';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanRepaymentSchedule)
    private scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(LoanDemand)
    private demandRepository: Repository<LoanDemand>,
    private calculationService: CalculationService,
    private loanWriteOffService: LoanWriteOffService,
    private loanTransferService: LoanTransferService,
    private workflowIntegrationService: WorkflowIntegrationService,
    private fldgTriggerService: FldgTriggerService,
    private notificationHelper: LoanNotificationHelperService,
    @Inject(forwardRef(() => IntegrationService))
    private readonly integrationService: IntegrationService,
    private readonly repaymentStructureService: RepaymentStructureService,
  ) {}

  async create(createLoanDto: CreateLoanDto, companyId: string): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Ensure companyId matches (security check)
    if (createLoanDto.companyId && createLoanDto.companyId !== companyId) {
      throw new BadRequestException(
        'Cannot create loan for a different company',
      );
    }

    // Validate loan product exists and belongs to same company
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: createLoanDto.loanProductId, companyId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${createLoanDto.loanProductId} not found or does not belong to your company`,
      );
    }

    // Validate loan amount
    if (
      loanProduct.maximumLoanAmount &&
      createLoanDto.loanAmount > loanProduct.maximumLoanAmount
    ) {
      throw new BadRequestException(
        `Loan amount exceeds maximum loan amount of ${loanProduct.maximumLoanAmount}`,
      );
    }

    // Create loan entity with companyId
    const loan = this.loanRepository.create({
      ...createLoanDto,
      companyId, // Set companyId from authenticated user
      postingDate: new Date(createLoanDto.postingDate),
      repaymentStartDate: createLoanDto.repaymentStartDate
        ? new Date(createLoanDto.repaymentStartDate)
        : null,
      status: LoanStatus.DRAFT,
      rateOfInterest:
        createLoanDto.rateOfInterest ?? loanProduct.rateOfInterest,
      penaltyInterestRate:
        createLoanDto.penaltyInterestRate ??
        loanProduct.penaltyInterestRate,
      isTermLoan: createLoanDto.isTermLoan ?? loanProduct.isTermLoan,
      repaymentScheduleType:
        createLoanDto.repaymentScheduleType ??
        loanProduct.repaymentScheduleType,
      repaymentStructure: createLoanDto.repaymentStructure, // Store borrower's selected structure
      // Copy accounts from loan product
      disbursementAccount: loanProduct.disbursementAccount,
      paymentAccount: loanProduct.paymentAccount,
      loanAccount: loanProduct.loanAccount,
      interestIncomeAccount: loanProduct.interestIncomeAccount,
      penaltyIncomeAccount: loanProduct.penaltyIncomeAccount,
    });

    return await this.loanRepository.save(loan);
  }

  async findAll(companyId: string): Promise<Loan[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    return await this.loanRepository.find({
      where: { companyId }, // Enforce company isolation
      relations: ['loanProduct'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.loanRepository.findOne({
      where: { id, companyId }, // Enforce company isolation
      relations: ['loanProduct', 'disbursements', 'repayments'],
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with ID ${id} not found or you do not have access to this loan`,
      );
    }

    return loan;
  }

  async findByLoanNumber(loanNumber: string, companyId: string): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.loanRepository.findOne({
      where: { loanNumber, companyId }, // Enforce company isolation
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with number ${loanNumber} not found or you do not have access to this loan`,
      );
    }

    return loan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto, companyId: string): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(id, companyId); // Verify company access

    // Validate status transitions
    const oldStatus = loan.status;
    if (updateLoanDto.status && updateLoanDto.status !== loan.status) {
      this.validateStatusTransition(loan.status, updateLoanDto.status);
    }

    Object.assign(loan, updateLoanDto);
    const savedLoan = await this.loanRepository.save(loan);

    // Notify external platforms if loan status changed
    if (updateLoanDto.status && updateLoanDto.status !== oldStatus) {
      try {
        await this.integrationService.updateExternalApplicationStatus(
          savedLoan.id,
          savedLoan.status,
        );
      } catch (error) {
        this.logger.error(
          `Failed to notify external platforms of loan status change: ${error.message}`,
        );
        // Don't throw - loan update succeeded, webhook failure is logged
      }
    }

    return savedLoan;
  }

  async submit(
    id: string,
    companyId: string,
    userId?: string,
    userRoles?: string[],
    comments?: string,
  ): Promise<Loan> {
    const loan = await this.findOne(id, companyId);

    // Check if workflow is enabled
    const workflowEnabled =
      await this.workflowIntegrationService.isWorkflowEnabled('Loan');

    if (workflowEnabled && userId) {
      // Use workflow engine
      const result = await this.workflowIntegrationService.performWorkflowAction(
        'Loan',
        loan.id,
        loan.status,
        'Submit for Review',
        userId,
        undefined,
        comments,
        userRoles,
      );
      loan.status = result.newState as LoanStatus;
    } else {
      // Fallback: direct status update
      if (loan.status !== LoanStatus.DRAFT) {
        throw new BadRequestException(
          `Cannot submit loan in ${loan.status} status`,
        );
      }
      loan.status = LoanStatus.SANCTIONED;
    }

    const savedLoan = await this.loanRepository.save(loan);

    // Notify external platforms of status change
    try {
      await this.integrationService.updateExternalApplicationStatus(
        savedLoan.id,
        savedLoan.status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify external platforms of loan status change: ${error.message}`,
      );
      // Don't throw - loan submission succeeded, webhook failure is logged
    }

    return savedLoan;
  }

  async cancel(id: string, companyId: string): Promise<Loan> {
    const loan = await this.findOne(id, companyId);

    if (loan.status === LoanStatus.CLOSED) {
      throw new BadRequestException('Cannot cancel closed loan');
    }

    loan.status = LoanStatus.DRAFT;
    return await this.loanRepository.save(loan);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const loan = await this.findOne(id, companyId);

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot delete loan that is not in Draft status',
      );
    }

    await this.loanRepository.remove(loan);
  }

  async requestLoanClosure(
    id: string,
    companyId: string,
    postingDate?: Date,
    autoClose: boolean = false,
  ): Promise<Loan> {
    const loan = await this.findOne(id, companyId);

    // Validate loan can be closed
    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.DISBURSED &&
      loan.status !== LoanStatus.LOAN_CLOSURE_REQUESTED
    ) {
      throw new BadRequestException(
        `Loan can only be closed if in ACTIVE, DISBURSED, or LOAN_CLOSURE_REQUESTED status. Current status: ${loan.status}`,
      );
    }

    const closureDate = postingDate || new Date();

    // Get loan product for validation
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: loan.loanProductId },
    });

    if (!loanProduct) {
      throw new NotFoundException(
        `Loan Product with ID ${loan.loanProductId} not found`,
      );
    }

    // Calculate outstanding amounts properly
    const amounts = await this.calculateLoanAmounts(loan, closureDate);

    // Calculate pending amount (outstanding - excess)
    const pendingAmount =
      amounts.pendingPrincipalAmount +
      amounts.interestAmount +
      amounts.penaltyAmount -
      amounts.excessAmountPaid;

    const precision = 2; // Currency precision
    const roundedPendingAmount = Math.round(pendingAmount * 100) / 100;

    // Business Rule: Auto write-off if pending amount is less than write_off_amount
    const writeOffLimit = Number(loanProduct.writeOffAmount || 0);

    if (
      roundedPendingAmount > 0 &&
      Math.abs(roundedPendingAmount) < writeOffLimit
    ) {
      // Auto create loan write-off
      try {
        await this.loanWriteOffService.create({
          loanId: loan.id,
          postingDate: closureDate.toISOString().split('T')[0],
          writeOffAmount: roundedPendingAmount,
          isSettlementWriteOff: false,
        });
        // After write-off, pending amount should be 0
      } catch (error) {
        // If write-off fails, continue with normal closure validation
        throw new BadRequestException(
          `Failed to create auto write-off: ${error.message}`,
        );
      }
    } else if (roundedPendingAmount > 0) {
      // Business Rule: Cannot close if there is outstanding amount
      throw new BadRequestException(
        `Cannot close loan as there is an outstanding amount of ${roundedPendingAmount.toFixed(precision)}. Outstanding Principal: ${amounts.pendingPrincipalAmount.toFixed(precision)}, Interest: ${amounts.interestAmount.toFixed(precision)}, Penalty: ${amounts.penaltyAmount.toFixed(precision)}`,
      );
    }

    // Business Rule: Validate excess amount against limit
    const excessAmountLimit = Number(
      loanProduct.excessAmountAcceptanceLimit || 0,
    );
    if (amounts.excessAmountPaid > excessAmountLimit) {
      throw new BadRequestException(
        `Excess amount (${amounts.excessAmountPaid.toFixed(precision)}) exceeds acceptance limit (${excessAmountLimit.toFixed(precision)})`,
      );
    }

    // Determine status
    let newStatus: LoanStatus;
    if (autoClose) {
      newStatus = LoanStatus.CLOSED;
    } else {
      newStatus = LoanStatus.LOAN_CLOSURE_REQUESTED;
    }

    // Update loan status
    loan.status = newStatus;
    if (newStatus === LoanStatus.CLOSED) {
      loan.closureDate = closureDate;

      // Close all active repayment schedules
      const activeSchedules = await this.scheduleRepository.find({
        where: {
          loanId: loan.id,
          status: ScheduleEntryStatus.PENDING,
        },
      });

      for (const schedule of activeSchedules) {
        schedule.status = ScheduleEntryStatus.COMPLETED;
        await this.scheduleRepository.save(schedule);
      }
    }

    const savedLoan = await this.loanRepository.save(loan);

    // Notify external platforms of status change
    try {
      await this.integrationService.updateExternalApplicationStatus(
        savedLoan.id,
        savedLoan.status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify external platforms of loan status change: ${error.message}`,
      );
      // Don't throw - loan closure succeeded, webhook failure is logged
    }

    // Send notification when loan is closed
    if (newStatus === LoanStatus.CLOSED) {
      try {
        await this.notificationHelper.notifyLoanClosed(
          savedLoan,
          savedLoan.applicantId, // recipientId
          undefined, // recipientEmail - would be fetched from Customer entity
          undefined, // recipientPhone - would be fetched from Customer entity
        );
      } catch (error) {
        // Log error but don't fail the closure
        console.error(`Failed to send loan closed notification: ${error.message}`);
      }
    }

    return savedLoan;
  }

  /**
   * Calculate loan amounts for closure validation
   * Implements business rules for amount calculation
   */
  private async calculateLoanAmounts(
    loan: Loan,
    postingDate: Date,
  ): Promise<{
    pendingPrincipalAmount: number;
    interestAmount: number;
    penaltyAmount: number;
    excessAmountPaid: number;
  }> {
    // Calculate pending principal using the same logic as disbursement service
    const pendingPrincipalAmount = this.calculatePendingPrincipalAmount(loan);

    // Calculate outstanding interest and penalty from demands
    // Outstanding demands are those that are not paid
    const outstandingDemands = await this.demandRepository
      .createQueryBuilder('demand')
      .where('demand.loanId = :loanId', { loanId: loan.id })
      .andWhere('demand.status != :paidStatus', { paidStatus: 'Paid' })
      .andWhere('demand.dueDate <= :postingDate', { postingDate })
      .getMany();

    let interestAmount = 0;
    let penaltyAmount = 0;

    for (const demand of outstandingDemands) {
      interestAmount += Number(demand.interestAmount || 0);
      penaltyAmount += Number(demand.penaltyAmount || 0);
    }

    // Get excess amount paid
    const excessAmountPaid = Number(loan.excessAmountPaid || 0);

    return {
      pendingPrincipalAmount,
      interestAmount,
      penaltyAmount,
      excessAmountPaid,
    };
  }

  /**
   * Calculate pending principal amount (reused from disbursement logic)
   */
  private calculatePendingPrincipalAmount(loan: Loan): number {
    // Business Rule: Line of Credit requires per-disbursement tracking
    if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
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

  async closeUnsecuredTermLoan(id: string, companyId: string): Promise<Loan> {
    const loan = await this.findOne(id, companyId);

    if (loan.isSecuredLoan) {
      throw new BadRequestException('This method is only for unsecured term loans');
    }

    if (!loan.isTermLoan) {
      throw new BadRequestException('This method is only for term loans');
    }

    return await this.requestLoanClosure(id, companyId, new Date(), true);
  }

  async generateRepaymentSchedule(
    loanId: string,
    companyId: string,
    allowRegeneration: boolean = false,
  ): Promise<LoanRepaymentSchedule[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(loanId, companyId);

    // Validate loan can have schedule generated
    if (!loan.isTermLoan) {
      throw new BadRequestException('Repayment schedule can only be generated for term loans');
    }

    if (!loan.repaymentStartDate) {
      throw new BadRequestException('Repayment start date is required to generate schedule');
    }

    if (!loan.repaymentPeriods || loan.repaymentPeriods <= 0) {
      throw new BadRequestException('Repayment periods must be greater than 0');
    }

    if (!loan.repaymentFrequency) {
      throw new BadRequestException('Repayment frequency is required');
    }

    // Check if schedule already exists (only check for PENDING if regeneration is allowed)
    if (allowRegeneration) {
      const existingPendingSchedules = await this.scheduleRepository.find({
        where: { loanId: loan.id, status: ScheduleEntryStatus.PENDING },
      });
      if (existingPendingSchedules.length > 0) {
        throw new BadRequestException('Pending repayment schedule already exists for this loan');
      }
    } else {
      const existingSchedules = await this.scheduleRepository.find({
        where: { loanId: loan.id },
      });
      if (existingSchedules.length > 0) {
        throw new BadRequestException('Repayment schedule already exists for this loan');
      }
    }

    // Calculate EMI
    const emi = this.calculationService.calculateEMI(
      Number(loan.loanAmount),
      Number(loan.rateOfInterest),
      loan.repaymentPeriods,
      loan.repaymentFrequency,
    );

    // Check if loan uses variable repayment structure
    let useVariableStructure = false;
    let structurePayments: Array<{
      period: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }> | null = null;

    if (loan.repaymentStructure && 
        loan.repaymentStructure !== RepaymentScheduleType.FIXED &&
        loan.repaymentStructure !== RepaymentScheduleType.MONTHLY_AS_PER_START_DATE &&
        loan.repaymentStructure !== RepaymentScheduleType.PRO_RATED_CALENDAR_MONTHS &&
        loan.repaymentStructure !== RepaymentScheduleType.MONTHLY_AS_PER_CYCLE_DATE &&
        loan.repaymentStructure !== RepaymentScheduleType.LINE_OF_CREDIT) {
      // Calculate structure payments
      useVariableStructure = true;
      // Map RepaymentFrequency enum to the expected string type
      const frequencyMap: Record<string, 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'> = {
        'Monthly': 'Monthly',
        'Quarterly': 'Quarterly',
        'Semi-Annual': 'Semi-Annual',
        'Annual': 'Annual',
      };
      const repaymentFrequency = loan.repaymentFrequency 
        ? (frequencyMap[loan.repaymentFrequency] || 'Monthly')
        : 'Monthly';
      
      const structureDto = {
        loanAmount: Number(loan.loanAmount),
        interestRate: Number(loan.rateOfInterest),
        tenureMonths: loan.repaymentPeriods,
        repaymentFrequency,
      };

      let structureResult;
      switch (loan.repaymentStructure) {
        case RepaymentScheduleType.GRADUATED:
          structureResult = this.repaymentStructureService.calculateGraduatedStructure(structureDto);
          break;
        case RepaymentScheduleType.SEASONAL:
          structureResult = this.repaymentStructureService.calculateSeasonalStructure(structureDto);
          break;
        case RepaymentScheduleType.BULLET:
          structureResult = this.repaymentStructureService.calculateBulletStructure(structureDto);
          break;
        default:
          useVariableStructure = false;
      }

      if (structureResult) {
        structurePayments = structureResult.monthlyPayments;
      }
    }

    // Calculate moratorium end date if moratorium is set
    let moratoriumEndDate: Date | null = null;
    if (loan.moratoriumTenure && loan.moratoriumTenure > 0) {
      moratoriumEndDate = this.calculateMoratoriumEndDate(
        loan.repaymentStartDate,
        loan.moratoriumTenure,
        loan.repaymentFrequency,
        loan.repaymentScheduleType,
      );
      loan.moratoriumEndDate = moratoriumEndDate;
      await this.loanRepository.save(loan);
    }

    const schedules: LoanRepaymentSchedule[] = [];
    let currentDate = new Date(loan.repaymentStartDate);
    let previousPaymentDate: Date | null = null;
    let remainingPrincipal = Number(loan.loanAmount);
    const monthlyRate = Number(loan.rateOfInterest) / (12 * 100);
    let moratoriumInterest = 0; // Accumulated interest during moratorium
    let installmentNumber = 0;

    // Skip moratorium period
    if (moratoriumEndDate) {
      // Calculate interest during moratorium
      const moratoriumDays = DateUtils.daysBetween(
        loan.disbursementDate || loan.postingDate,
        moratoriumEndDate,
      );
      moratoriumInterest = this.calculationService.calculateInterest(
        remainingPrincipal,
        Number(loan.rateOfInterest),
        moratoriumDays,
        'Actual/365',
        moratoriumEndDate,
      );

      // Handle interest treatment
      if (loan.interestTreatmentDuringMoratorium === 'Capitalize') {
        remainingPrincipal += moratoriumInterest;
      }

      // Start from after moratorium
      currentDate = new Date(moratoriumEndDate);
      currentDate = DateUtils.getNextPaymentDate(
        currentDate,
        loan.repaymentFrequency,
      );
    }

    // Generate schedules for all periods (excluding moratorium)
    const totalPeriods = loan.repaymentPeriods;
    for (let i = 1; i <= totalPeriods; i++) {
      installmentNumber++;
      
      // Skip if this period falls during moratorium
      if (moratoriumEndDate && currentDate <= moratoriumEndDate) {
        // Move to next period
        currentDate = DateUtils.getNextPaymentDate(
          currentDate,
          loan.repaymentFrequency,
        );
        continue;
      }

      // Calculate days based on schedule type
      let days: number;
      const startDate =
        i === 1 && !moratoriumEndDate
          ? loan.disbursementDate || loan.postingDate
          : previousPaymentDate || currentDate;

      if (
        loan.repaymentScheduleType ===
        RepaymentScheduleType.PRO_RATED_CALENDAR_MONTHS
      ) {
        // Pro-rated: calculate actual days in calendar month
        if (i === 1 && !moratoriumEndDate) {
          // First period: from disbursement to first payment date
          days = DateUtils.daysBetween(
            loan.disbursementDate || loan.postingDate,
            currentDate,
          );
        } else {
          // Subsequent periods: days in the calendar month
          const firstDay = DateUtils.getFirstDayOfMonth(currentDate);
          const lastDay = DateUtils.getLastDayOfMonth(currentDate);
          days = DateUtils.daysBetween(firstDay, lastDay) + 1;
        }
      } else if (
        loan.repaymentScheduleType ===
        RepaymentScheduleType.MONTHLY_AS_PER_CYCLE_DATE
      ) {
        // Cycle date: days between previous and current payment
        days = DateUtils.daysBetween(startDate, currentDate);
      } else {
        // Monthly as per start date: standard calculation
        days = DateUtils.daysBetween(startDate, currentDate);
      }
      const interest = this.calculationService.calculateInterest(
        remainingPrincipal,
        Number(loan.rateOfInterest),
        days,
        'Actual/365',
        currentDate,
      );

      // Calculate principal and payment based on structure
      let principal: number;
      let payment: number;

      if (useVariableStructure && structurePayments && structurePayments[i - 1]) {
        // Use structure-specific payment
        const structurePayment = structurePayments[i - 1];
        payment = structurePayment.payment;
        principal = structurePayment.principal;
        // Update remaining principal from structure
        remainingPrincipal = structurePayment.balance;
      } else {
        // Standard calculation
        principal = Math.min(emi - interest, remainingPrincipal);
        payment = emi;
        remainingPrincipal -= principal;
      }

      // Add moratorium interest to first EMI after moratorium if treatment is "Add to First EMI"
      let finalInterest = interest;
      if (
        installmentNumber === 1 &&
        moratoriumInterest > 0 &&
        loan.interestTreatmentDuringMoratorium === 'Add to First EMI'
      ) {
        finalInterest += moratoriumInterest;
      }

      // Create schedule entry
      const schedule = this.scheduleRepository.create({
        loanId: loan.id,
        installmentNumber: installmentNumber,
        paymentDate: new Date(currentDate),
        principalAmount: principal,
        interestAmount: finalInterest,
        totalPayment: useVariableStructure && structurePayments ? payment : principal + finalInterest,
        balanceLoanAmount: remainingPrincipal,
        days,
        status: ScheduleEntryStatus.PENDING,
        demandGenerated: false,
        moratoriumEndDate: moratoriumEndDate,
      });

      schedules.push(schedule);

      // Store current date as previous for next iteration
      previousPaymentDate = new Date(currentDate);

      // Calculate next payment date based on schedule type
      currentDate = DateUtils.getNextPaymentDate(
        currentDate,
        loan.repaymentFrequency,
        loan.repaymentScheduleType,
        loan.loanProduct?.cyclicDayOfTheMonth,
        loan.loanProduct?.repaymentDateOn,
      );
    }

    // Save all schedules
    return await this.scheduleRepository.save(schedules);
  }

  /**
   * Calculate moratorium end date based on tenure and frequency
   */
  private calculateMoratoriumEndDate(
    repaymentStartDate: Date,
    moratoriumTenure: number,
    repaymentFrequency: RepaymentFrequency,
    repaymentScheduleType?: RepaymentScheduleType,
  ): Date {
    const startDate = new Date(repaymentStartDate);
    let endDate = new Date(startDate);

    if (repaymentFrequency === RepaymentFrequency.MONTHLY) {
      if (
        repaymentScheduleType === RepaymentScheduleType.MONTHLY_AS_PER_CYCLE_DATE
      ) {
        // For cycle date, tenure - 1 months
        endDate.setMonth(endDate.getMonth() + moratoriumTenure - 1);
      } else {
        // For other types, tenure months
        endDate.setMonth(endDate.getMonth() + moratoriumTenure);
        if (
          repaymentScheduleType === RepaymentScheduleType.PRO_RATED_CALENDAR_MONTHS
        ) {
          endDate.setDate(endDate.getDate() - 1);
        }
      }
    } else {
      // For non-monthly frequencies, calculate based on frequency
      const daysPerPeriod = this.getDaysPerPeriod(repaymentFrequency);
      const totalDays = moratoriumTenure * daysPerPeriod;
      endDate.setDate(endDate.getDate() + totalDays);
    }

    return endDate;
  }

  /**
   * Get days per period for a given frequency
   */
  private getDaysPerPeriod(frequency: RepaymentFrequency): number {
    switch (frequency) {
      case RepaymentFrequency.DAILY:
        return 1;
      case RepaymentFrequency.WEEKLY:
        return 7;
      case RepaymentFrequency.MONTHLY:
        return 30;
      case RepaymentFrequency.QUARTERLY:
        return 90;
      default:
        return 30;
    }
  }

  async updateDaysPastDue(companyId: string, loanId?: string, postingDate?: Date): Promise<void> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const targetDate = postingDate || new Date();
    const query = this.loanRepository.createQueryBuilder('loan');

    query.where('loan.status IN (:...statuses)', {
      statuses: [
        LoanStatus.DISBURSED,
        LoanStatus.ACTIVE,
        LoanStatus.PARTIALLY_DISBURSED,
      ],
    })
    .andWhere('loan.companyId = :companyId', { companyId }); // Enforce company isolation

    if (loanId) {
      query.andWhere('loan.id = :loanId', { loanId });
    }

    const loans = await query.getMany();

    for (const loan of loans) {
      // Skip if unmark_npa is set and watch period hasn't ended
      if (loan.unmarkNpa && loan.watchPeriodEndDate) {
        if (loan.watchPeriodEndDate > targetDate) {
          continue; // Skip this loan, watch period not ended
        }
      }

      // Find the most recent unpaid schedule entry
      const unpaidSchedule = await this.scheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.loanId = :loanId', { loanId: loan.id })
        .andWhere('schedule.status != :status', {
          status: ScheduleEntryStatus.COMPLETED,
        })
        .andWhere('schedule.paymentDate < :targetDate', { targetDate })
        .orderBy('schedule.paymentDate', 'DESC')
        .getOne();

      let daysPastDue = 0;
      let shouldBeNpa = false;

      if (unpaidSchedule) {
        daysPastDue = DateUtils.daysBetween(
          unpaidSchedule.paymentDate,
          targetDate,
        );

        // Check if loan should be classified as NPA
        const loanProduct = await this.loanProductRepository.findOne({
          where: { id: loan.loanProductId },
        });

        if (
          loanProduct?.daysPastDueThresholdForNpa &&
          daysPastDue > loanProduct.daysPastDueThresholdForNpa
        ) {
          shouldBeNpa = true;
        }
      }

      // Update DPD
      loan.daysPastDue = daysPastDue;

      // Update NPA status if not manually set
      if (!loan.manualNpa) {
        const wasNpa = loan.isNpa;
        loan.isNpa = shouldBeNpa;

        // If loan becomes NPA, update all loans for the same customer
        if (shouldBeNpa && !wasNpa) {
          await this.updateAllLoansForCustomerNpaStatus(
            loan.applicantType,
            loan.applicantId,
            true,
            targetDate,
            loan.id,
          );
        } else if (!shouldBeNpa && wasNpa) {
          // Check if we can unmark NPA (all loans for customer must have DPD = 0)
          await this.updateAllLoansForCustomerNpaStatus(
            loan.applicantType,
            loan.applicantId,
            false,
            targetDate,
            loan.id,
          );
        }
      }

      // Update classification code based on DPD
      await this.updateClassificationCode(loan, daysPastDue);

      await this.loanRepository.save(loan);
    }
  }

  /**
   * Manually mark loan as NPA
   */
  async markAsNpa(
    id: string,
    companyId: string,
    postingDate?: Date,
    manualNpa: boolean = true,
  ): Promise<Loan> {
    const loan = await this.findOne(id, companyId);

    // Business Rule: Loan must be in active status
    if (
      loan.status !== LoanStatus.DISBURSED &&
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.PARTIALLY_DISBURSED
    ) {
      throw new BadRequestException(
        `Loan can only be marked as NPA if in DISBURSED, ACTIVE, or PARTIALLY_DISBURSED status. Current status: ${loan.status}`,
      );
    }

    const targetDate = postingDate || new Date();

    loan.isNpa = true;
    loan.manualNpa = manualNpa;

    // Update all loans for the same customer
    await this.updateAllLoansForCustomerNpaStatus(
      loan.applicantType,
      loan.applicantId,
      true,
      targetDate,
      loan.id,
      manualNpa,
    );

    await this.loanRepository.save(loan);

    return loan;
  }

  /**
   * Unmark loan as NPA
   */
  async unmarkAsNpa(
    id: string,
    companyId: string,
    postingDate?: Date,
  ): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(id, companyId);

    if (!loan.isNpa) {
      throw new BadRequestException('Loan is not marked as NPA');
    }

    const targetDate = postingDate || new Date();

    // Business Rule: Can only unmark if watch period has ended
    if (loan.watchPeriodEndDate && loan.watchPeriodEndDate > targetDate) {
      throw new BadRequestException(
        `Cannot unmark NPA. Watch period ends on ${loan.watchPeriodEndDate.toISOString().split('T')[0]}`,
      );
    }

    // Business Rule: Can only unmark if DPD is 0
    if (loan.daysPastDue > 0) {
      throw new BadRequestException(
        `Cannot unmark NPA. Loan has ${loan.daysPastDue} days past due. Please ensure all payments are up to date.`,
      );
    }

    loan.isNpa = false;
    loan.manualNpa = false;
    loan.unmarkNpa = true;

    // Check if we can unmark all loans for the customer
    await this.updateAllLoansForCustomerNpaStatus(
      loan.applicantType,
      loan.applicantId,
      false,
      targetDate,
      loan.id,
    );

    await this.loanRepository.save(loan);

    return loan;
  }

  /**
   * Update all loans for the same customer with NPA status
   * Business Rule: When one loan becomes NPA, all loans for the same customer become NPA
   */
  private async updateAllLoansForCustomerNpaStatus(
    applicantType: string,
    applicantId: string,
    isNpa: boolean,
    postingDate: Date,
    currentLoanId: string,
    manualNpa: boolean = false,
  ): Promise<void> {
    const customerLoans = await this.loanRepository.find({
      where: {
        applicantType: applicantType as ApplicantType,
        applicantId,
        status: In([
          LoanStatus.DISBURSED,
          LoanStatus.ACTIVE,
          LoanStatus.PARTIALLY_DISBURSED,
        ]),
      },
    });

    for (const customerLoan of customerLoans) {
      // Skip the current loan (already updated)
      if (customerLoan.id === currentLoanId) {
        continue;
      }

      // Skip if unmark_npa is set and watch period hasn't ended
      if (customerLoan.unmarkNpa && customerLoan.watchPeriodEndDate) {
        if (customerLoan.watchPeriodEndDate > postingDate) {
          continue; // Skip this loan, watch period not ended
        }
      }

      // Only update if not manually set (unless we're unmarking)
      if (!customerLoan.manualNpa || !isNpa) {
        customerLoan.isNpa = isNpa;
        if (manualNpa && isNpa) {
          customerLoan.manualNpa = true;
        } else if (!isNpa) {
          customerLoan.manualNpa = false;
        }
        await this.loanRepository.save(customerLoan);
      }
    }
  }

  /**
   * Update classification code based on days past due
   */
  private async updateClassificationCode(
    loan: Loan,
    daysPastDue: number,
  ): Promise<void> {
    // Classification codes based on DPD ranges
    // These ranges can be configured in loan product or settings
    let classificationCode: string | null = null;
    let classificationName: string | null = null;

    if (daysPastDue === 0) {
      classificationCode = 'STANDARD';
      classificationName = 'Standard';
    } else if (daysPastDue > 0 && daysPastDue <= 90) {
      classificationCode = 'SUB_STANDARD';
      classificationName = 'Sub Standard';
    } else if (daysPastDue > 90 && daysPastDue <= 180) {
      classificationCode = 'DOUBTFUL';
      classificationName = 'Doubtful';
    } else if (daysPastDue > 180) {
      classificationCode = 'LOSS';
      classificationName = 'Loss';
    }

    loan.classificationCode = classificationCode;
    loan.classificationName = classificationName;
  }

  /**
   * Update available limit amount for Line of Credit loans
   */
  async updateAvailableLimitAmount(loanId: string, companyId: string): Promise<Loan> {
    const loan = await this.findOne(loanId, companyId);

    if (loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
      throw new BadRequestException(
        'Available limit can only be updated for Line of Credit loans',
      );
    }

    if (!loan.maximumLimitAmount) {
      throw new BadRequestException('Maximum limit amount is not set');
    }

    // Calculate utilized amount from disbursements
    const totalDisbursed = Number(loan.disbursedAmount || 0);
    loan.utilizedLimitAmount = totalDisbursed;
    loan.availableLimitAmount =
      Number(loan.maximumLimitAmount) - totalDisbursed;

    if (loan.availableLimitAmount < 0) {
      throw new BadRequestException(
        'Utilized limit amount cannot exceed maximum limit amount',
      );
    }

    return await this.loanRepository.save(loan);
  }

  /**
   * Update maximum limit amount for Line of Credit loans
   */
  async updateMaximumLimitAmount(
    loanId: string,
    companyId: string,
    newMaximumLimit: number,
  ): Promise<Loan> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(loanId, companyId);

    if (loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
      throw new BadRequestException(
        'Maximum limit can only be updated for Line of Credit loans',
      );
    }

    if (newMaximumLimit < Number(loan.utilizedLimitAmount || 0)) {
      throw new BadRequestException(
        'New maximum limit amount cannot be less than utilized limit amount',
      );
    }

    const oldMaximumLimit = Number(loan.maximumLimitAmount || 0);
    loan.maximumLimitAmount = newMaximumLimit;

    // Update available limit
    loan.availableLimitAmount =
      newMaximumLimit - Number(loan.utilizedLimitAmount || 0);

    return await this.loanRepository.save(loan);
  }

  /**
   * Get available limit for Line of Credit loan
   */
  async getAvailableLimit(loanId: string, companyId: string): Promise<{
    maximumLimit: number;
    utilizedLimit: number;
    availableLimit: number;
    limitStartDate: Date | null;
    limitEndDate: Date | null;
  }> {
    const loan = await this.findOne(loanId, companyId);

    if (loan.repaymentScheduleType !== RepaymentScheduleType.LINE_OF_CREDIT) {
      throw new BadRequestException(
        'Available limit can only be retrieved for Line of Credit loans',
      );
    }

    return {
      maximumLimit: Number(loan.maximumLimitAmount || 0),
      utilizedLimit: Number(loan.utilizedLimitAmount || 0),
      availableLimit: Number(loan.availableLimitAmount || 0),
      limitStartDate: loan.limitApplicableStart,
      limitEndDate: loan.limitApplicableEnd,
    };
  }

  /**
   * Transfer loan to a new customer/applicant
   * Updates applicant information and creates transfer history
   */
  async transferLoan(
    loanId: string,
    companyId: string,
    newApplicantType: ApplicantType,
    newApplicantId: string,
    transferDate?: Date,
    referenceNumber?: string,
    remarks?: string,
  ): Promise<Loan> {
    const loan = await this.findOne(loanId, companyId);

    // Validate loan can be transferred
    if (
      [
        LoanStatus.CLOSED,
        LoanStatus.SETTLED,
        LoanStatus.WRITTEN_OFF,
      ].includes(loan.status)
    ) {
      throw new BadRequestException(
        `Loan cannot be transferred in ${loan.status} status`,
      );
    }

    // Validate new applicant is different
    if (
      loan.applicantType === newApplicantType &&
      loan.applicantId === newApplicantId
    ) {
      throw new BadRequestException(
        'New applicant must be different from current applicant',
      );
    }

    // Store old applicant info for history
    const oldApplicantType = loan.applicantType;
    const oldApplicantId = loan.applicantId;

    // Update loan with new applicant
    loan.applicantType = newApplicantType;
    loan.applicantId = newApplicantId;

    // Save loan
    const updatedLoan = await this.loanRepository.save(loan);

    // Create loan transfer history record
    const transferDateToUse = transferDate || new Date();
    await this.loanTransferService.createTransfer(
      loan.id,
      oldApplicantType,
      oldApplicantId,
      newApplicantType,
      newApplicantId,
      transferDateToUse,
      referenceNumber,
      remarks,
      // TODO: Get current user ID from context
      undefined,
    );

    return updatedLoan;
  }

  private validateStatusTransition(
    currentStatus: LoanStatus,
    newStatus: LoanStatus,
  ): void {
    const validTransitions: Record<LoanStatus, LoanStatus[]> = {
      [LoanStatus.DRAFT]: [LoanStatus.SANCTIONED],
      [LoanStatus.SANCTIONED]: [
        LoanStatus.PARTIALLY_DISBURSED,
        LoanStatus.DISBURSED,
      ],
      [LoanStatus.PARTIALLY_DISBURSED]: [
        LoanStatus.PARTIALLY_DISBURSED,
        LoanStatus.DISBURSED,
      ],
      [LoanStatus.DISBURSED]: [LoanStatus.ACTIVE],
      [LoanStatus.ACTIVE]: [
        LoanStatus.LOAN_CLOSURE_REQUESTED,
        LoanStatus.WRITTEN_OFF,
        LoanStatus.SETTLED,
      ],
      [LoanStatus.LOAN_CLOSURE_REQUESTED]: [LoanStatus.CLOSED],
      [LoanStatus.CLOSED]: [],
      [LoanStatus.WRITTEN_OFF]: [],
      [LoanStatus.SETTLED]: [],
    };

    const allowedStatuses = validTransitions[currentStatus];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async performWorkflowAction(
    id: string,
    companyId: string,
    action: string,
    userId: string,
    userRoles?: string[],
    comments?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(id, companyId);
    const result = await this.workflowIntegrationService.performWorkflowAction(
      'Loan',
      loan.id,
      loan.status,
      action,
      userId,
      undefined,
      comments,
      userRoles,
    );
    loan.status = result.newState as LoanStatus;
    const savedLoan = await this.loanRepository.save(loan);

    // Notify external platforms of status change
    try {
      await this.integrationService.updateExternalApplicationStatus(
        savedLoan.id,
        savedLoan.status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify external platforms of loan status change: ${error.message}`,
      );
      // Don't throw - workflow action succeeded, webhook failure is logged
    }

    return savedLoan;
  }

  async getAvailableActions(id: string, companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    const loan = await this.findOne(id, companyId);
    return await this.workflowIntegrationService.getAvailableActions(
      'Loan',
      loan.status as string,
    );
  }

  async getWorkflowHistory(id: string, companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    // Verify loan exists and belongs to company
    await this.findOne(id, companyId);
    return await this.workflowIntegrationService.getWorkflowHistory(
      'Loan',
      id,
    );
  }

  async triggerFldg(id: string, companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    // Verify loan exists and belongs to company
    await this.findOne(id, companyId);
    return await this.fldgTriggerService.manualTriggerFldg(id);
  }

  async checkFldg(id: string, companyId: string) {
    return await this.fldgTriggerService.checkAndTriggerFldg(id);
  }
}

