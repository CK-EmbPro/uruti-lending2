import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanRestructure } from './entities/loan-restructure.entity';
import { Loan } from '../loan/entities/loan.entity';
import {
  LoanRepaymentSchedule,
  ScheduleEntryStatus,
} from '../loan/entities/loan-repayment-schedule.entity';
import {
  LoanDemand,
  DemandStatus,
} from '../loan-demand/entities/loan-demand.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import {
  RestructureType,
  RestructureStatus,
  InterestTreatment,
} from '../../common/enums/restructure-type.enum';
import { CreateLoanRestructureDto } from './dto/create-loan-restructure.dto';
import { UpdateLoanRestructureDto } from './dto/update-loan-restructure.dto';
import { LoanRepaymentService } from '../loan-repayment/loan-repayment.service';
import { RepaymentType } from '../../common/enums/repayment-type.enum';
import { DateUtils } from '../../common/utils/date.utils';
import { RestructureValidationService } from './services/restructure-validation.service';
import { RestructureImpactAnalysisService } from './services/restructure-impact-analysis.service';
import { RestructureAcknowledgmentService } from './services/restructure-acknowledgment.service';
import { RestructureFeeService } from './services/restructure-fee.service';
import { LoanService } from '../loan/loan.service';

@Injectable()
export class LoanRestructureService {
  constructor(
    @InjectRepository(LoanRestructure)
    private readonly restructureRepository: Repository<LoanRestructure>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(LoanDemand)
    private readonly demandRepository: Repository<LoanDemand>,
    private readonly repaymentService: LoanRepaymentService,
    private readonly dataSource: DataSource,
    private readonly validationService: RestructureValidationService,
    private readonly impactAnalysisService: RestructureImpactAnalysisService,
    private readonly acknowledgmentService: RestructureAcknowledgmentService,
    private readonly feeService: RestructureFeeService,
    private readonly loanService: LoanService,
  ) {}

  async create(
    createDto: CreateLoanRestructureDto,
  ): Promise<LoanRestructure> {
    const loan = await this.loanRepository.findOne({
      where: { id: createDto.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
    }

    // Business Rule: Only active loans can be restructured
    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.DISBURSED
    ) {
      throw new BadRequestException(
        `Loan can only be restructured if in ACTIVE or DISBURSED status. Current status: ${loan.status}`,
      );
    }

    // Business Rule: Check if another restructure is already initiated
    const existingRestructure = await this.restructureRepository.findOne({
      where: {
        loanId: loan.id,
        status: RestructureStatus.INITIATED,
      },
    });

    if (existingRestructure) {
      throw new BadRequestException(
        `Another restructure is already initiated for this loan. Restructure ID: ${existingRestructure.id}`,
      );
    }

    const restructureDate = new Date(createDto.restructureDate);

    // Calculate overdue amounts
    const overdueAmounts = await this.calculateOverdueAmounts(
      loan.id,
      restructureDate,
    );

    // Calculate completed tenure
    const completedTenure = await this.calculateCompletedTenure(
      loan.id,
      restructureDate,
    );

    // Business Rule: Validate maximum 2 restructures allowed per loan
    await this.validationService.validateRestructureCount(loan.id);

    // Get current restructure count
    const approvedRestructureCount = await this.restructureRepository.count({
      where: { loanId: loan.id, status: RestructureStatus.APPROVED },
    });
    const currentRestructureCount = approvedRestructureCount + 1;

    // Calculate pending principal
    const pendingPrincipal = this.calculatePendingPrincipal(loan);

    // Validate tenure extension if new tenure is provided
    if (createDto.newRepaymentPeriodInMonths) {
      await this.validationService.validateTenureExtension(
        loan.id,
        createDto.newRepaymentPeriodInMonths,
      );
    }

    // Create restructure entity
    const restructure = this.restructureRepository.create({
      loanId: loan.id,
      companyId: loan.companyId,
      restructureType: createDto.restructureType,
      status: RestructureStatus.INITIATED,
      restructureDate,
      reasonForRestructure: createDto.reasonForRestructure,
      // Pre-restructure details
      oldLoanAmount: Number(loan.loanAmount),
      disbursedAmount: Number(loan.disbursedAmount),
      oldTenure: loan.repaymentPeriods || 0,
      completedTenure,
      oldRateOfInterest: Number(loan.rateOfInterest),
      oldEmi: this.calculateOldEmi(loan),
      currentRestructureCount,
      preRestructureDpd: loan.daysPastDue || 0,
      // Overdue amounts
      totalOverdueAmount: overdueAmounts.total,
      principalOverdue: overdueAmounts.principal,
      interestOverdue: overdueAmounts.interest,
      penaltyOverdue: overdueAmounts.penalty,
      chargesOverdue: overdueAmounts.charges,
      unaccruedInterest: overdueAmounts.unaccruedInterest,
      // Principal adjustments
      pendingPrincipalAmount: pendingPrincipal,
      principalAdjusted: createDto.principalAdjusted || 0,
      balancePrincipal: pendingPrincipal - (createDto.principalAdjusted || 0),
      // Interest adjustments
      adjustedInterestAmount: createDto.adjustedInterestAmount || 0,
      adjustedUnaccruedInterest: createDto.adjustedUnaccruedInterest || 0,
      interestWaiverAmount: createDto.interestWaiverAmount || 0,
      unaccruedInterestWaiver: createDto.unaccruedInterestWaiver || 0,
      balanceInterestAmount:
        overdueAmounts.interest -
        (createDto.adjustedInterestAmount || 0) -
        (createDto.interestWaiverAmount || 0),
      balanceUnaccruedInterest:
        overdueAmounts.unaccruedInterest -
        (createDto.adjustedUnaccruedInterest || 0) -
        (createDto.unaccruedInterestWaiver || 0),
      // Penalty adjustments
      penalInterestWaiver: createDto.penalInterestWaiver || 0,
      balancePenaltyAmount:
        overdueAmounts.penalty - (createDto.penalInterestWaiver || 0),
      // Charges adjustments
      otherChargesWaiver: createDto.otherChargesWaiver || 0,
      balanceCharges: overdueAmounts.charges - (createDto.otherChargesWaiver || 0),
      // Treatment options
      treatmentOfNormalInterest:
        createDto.treatmentOfNormalInterest || InterestTreatment.CAPITALIZE,
      unaccruedInterestTreatment:
        createDto.unaccruedInterestTreatment || InterestTreatment.CAPITALIZE,
      treatmentOfPenalInterest:
        createDto.treatmentOfPenalInterest || InterestTreatment.CAPITALIZE,
      treatmentOfOtherCharges:
        createDto.treatmentOfOtherCharges || InterestTreatment.CAPITALIZE,
      // New loan details
      newRateOfInterest:
        createDto.newRateOfInterest || Number(loan.rateOfInterest),
      repaymentStartDate: createDto.repaymentStartDate
        ? new Date(createDto.repaymentStartDate)
        : null,
      newRepaymentMethod: createDto.newRepaymentMethod,
      newRepaymentPeriodInMonths: createDto.newRepaymentPeriodInMonths,
      newMonthlyRepaymentAmount: createDto.newMonthlyRepaymentAmount,
      // Restructure charges - auto-calculate if not provided
      restructureCharges:
        createDto.restructureCharges !== undefined
          ? createDto.restructureCharges
          : await this.feeService.calculateRestructureFee(
              loan.id,
              currentRestructureCount,
            ),
      waiveOffRestructureCharges:
        createDto.waiveOffRestructureCharges ||
        this.feeService.shouldWaiveFee(createDto.restructureType),
      // Watch period
      watchPeriodEndDate: createDto.watchPeriodEndDate
        ? new Date(createDto.watchPeriodEndDate)
        : null,
    });

    // Calculate new loan amount based on treatments
    restructure.newLoanAmount = this.calculateNewLoanAmount(restructure);

    return await this.restructureRepository.save(restructure);
  }

  /**
   * Approve restructure and apply changes to loan
   */
  async approve(id: string, requireAcknowledgment: boolean = true): Promise<LoanRestructure> {
    const restructure = await this.findOne(id);

    if (restructure.status !== RestructureStatus.INITIATED) {
      throw new BadRequestException(
        `Restructure can only be approved from INITIATED status. Current status: ${restructure.status}`,
      );
    }

    // Validate borrower acknowledgment if required
    if (requireAcknowledgment && !restructure.borrowerAcknowledged) {
      throw new BadRequestException(
        `Restructure cannot be approved without borrower acknowledgment. ` +
        `The borrower must acknowledge the terms change before approval.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const loan = await queryRunner.manager.findOne(Loan, {
        where: { id: restructure.loanId },
      });

      if (!loan) {
        throw new NotFoundException(`Loan not found`);
      }

      // Apply waivers first
      await this.applyWaivers(restructure, loan);

      // Apply adjustments
      await this.applyAdjustments(restructure, loan);

      // Update loan with new terms
      await this.updateLoanTerms(restructure, loan);

      // Regenerate repayment schedule
      await this.regenerateSchedule(restructure, loan);

      // Update restructure status
      restructure.status = RestructureStatus.APPROVED;
      await queryRunner.manager.save(restructure);

      await queryRunner.commitTransaction();

      return restructure;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calculate overdue amounts
   */
  private async calculateOverdueAmounts(
    loanId: string,
    restructureDate: Date,
  ): Promise<{
    total: number;
    principal: number;
    interest: number;
    penalty: number;
    charges: number;
    unaccruedInterest: number;
  }> {
    // Get outstanding demands
    const outstandingDemands = await this.demandRepository.find({
      where: {
        loanId,
        status: DemandStatus.PENDING,
      },
    });

    let principal = 0;
    let interest = 0;
    let penalty = 0;
    let charges = 0;

    for (const demand of outstandingDemands) {
      if (new Date(demand.dueDate) <= restructureDate) {
        principal += Number(demand.principalAmount || 0);
        interest += Number(demand.interestAmount || 0);
        penalty += Number(demand.penaltyAmount || 0);
        charges += 0; // Charges would come from loan charges entity
      }
    }

    // TODO: Calculate unaccrued interest from interest accrual entries

    const total = principal + interest + penalty + charges;

    return {
      total,
      principal,
      interest,
      penalty,
      charges,
      unaccruedInterest: 0, // TODO: Calculate from accruals
    };
  }

  /**
   * Calculate completed tenure in months
   */
  private async calculateCompletedTenure(
    loanId: string,
    restructureDate: Date,
  ): Promise<number> {
    const completedSchedules = await this.scheduleRepository.count({
      where: {
        loanId,
        status: ScheduleEntryStatus.COMPLETED,
      },
    });

    return completedSchedules;
  }

  /**
   * Calculate pending principal
   */
  private calculatePendingPrincipal(loan: Loan): number {
    return Math.max(
      0,
      Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
    );
  }

  /**
   * Calculate old EMI
   */
  private calculateOldEmi(loan: Loan): number {
    // Simple calculation - in reality would use calculation service
    if (loan.repaymentPeriods && loan.repaymentPeriods > 0) {
      return Number(loan.loanAmount) / loan.repaymentPeriods;
    }
    return 0;
  }

  /**
   * Calculate new loan amount based on treatments
   */
  private calculateNewLoanAmount(restructure: LoanRestructure): number {
    let newAmount = restructure.balancePrincipal;

    // Add capitalized amounts based on treatment
    if (
      restructure.treatmentOfNormalInterest === InterestTreatment.CAPITALIZE
    ) {
      newAmount += restructure.balanceInterestAmount;
    }

    if (
      restructure.unaccruedInterestTreatment === InterestTreatment.CAPITALIZE
    ) {
      newAmount += restructure.balanceUnaccruedInterest;
    }

    if (
      restructure.treatmentOfPenalInterest === InterestTreatment.CAPITALIZE
    ) {
      newAmount += restructure.balancePenaltyAmount;
    }

    if (
      restructure.treatmentOfOtherCharges === InterestTreatment.CAPITALIZE
    ) {
      newAmount += restructure.balanceCharges;
    }

    // Add restructure charges if not waived
    if (!restructure.waiveOffRestructureCharges) {
      newAmount += restructure.restructureCharges;
    }

    return Math.max(0, newAmount);
  }

  /**
   * Apply waivers to loan
   */
  private async applyWaivers(
    restructure: LoanRestructure,
    loan: Loan,
  ): Promise<void> {
    // Create waiver repayments if amounts > 0
    if (restructure.interestWaiverAmount > 0) {
      await this.repaymentService.create({
        loanId: loan.id,
        postingDate: restructure.restructureDate.toISOString().split('T')[0],
        amountPaid: 0,
        repaymentType: RepaymentType.INTEREST_WAIVER,
        interestPaid: restructure.interestWaiverAmount,
      }, loan.companyId);
    }

    if (restructure.penalInterestWaiver > 0) {
      await this.repaymentService.create({
        loanId: loan.id,
        postingDate: restructure.restructureDate.toISOString().split('T')[0],
        amountPaid: 0,
        repaymentType: RepaymentType.PENALTY_WAIVER,
        penaltyPaid: restructure.penalInterestWaiver,
      }, loan.companyId);
    }

    if (restructure.otherChargesWaiver > 0) {
      await this.repaymentService.create({
        loanId: loan.id,
        postingDate: restructure.restructureDate.toISOString().split('T')[0],
        amountPaid: 0,
        repaymentType: RepaymentType.CHARGES_WAIVER,
        chargesPaid: restructure.otherChargesWaiver,
      }, loan.companyId);
    }
  }

  /**
   * Apply adjustments to loan
   */
  private async applyAdjustments(
    restructure: LoanRestructure,
    loan: Loan,
  ): Promise<void> {
    // Apply principal adjustment
    if (restructure.principalAdjusted !== 0) {
      if (restructure.principalAdjusted > 0) {
        loan.debitAdjustmentAmount =
          Number(loan.debitAdjustmentAmount || 0) +
          restructure.principalAdjusted;
      } else {
        loan.creditAdjustmentAmount =
          Number(loan.creditAdjustmentAmount || 0) +
          Math.abs(restructure.principalAdjusted);
      }
    }

    // Apply interest adjustments (capitalize if needed)
    if (
      restructure.treatmentOfNormalInterest === InterestTreatment.CAPITALIZE
    ) {
      loan.debitAdjustmentAmount =
        Number(loan.debitAdjustmentAmount || 0) +
        restructure.balanceInterestAmount;
    }
  }

  /**
   * Update loan with new terms
   */
  private async updateLoanTerms(
    restructure: LoanRestructure,
    loan: Loan,
  ): Promise<void> {
    if (restructure.newRateOfInterest) {
      loan.rateOfInterest = restructure.newRateOfInterest;
    }

    if (restructure.repaymentStartDate) {
      loan.repaymentStartDate = restructure.repaymentStartDate;
    }

    if (restructure.newRepaymentMethod) {
      loan.repaymentMethod = restructure.newRepaymentMethod;
    }

    if (restructure.newRepaymentPeriodInMonths) {
      loan.repaymentPeriods = restructure.newRepaymentPeriodInMonths;
    }

    if (restructure.newLoanAmount) {
      loan.loanAmount = restructure.newLoanAmount;
    }

    if (restructure.watchPeriodEndDate) {
      loan.watchPeriodEndDate = restructure.watchPeriodEndDate;
    }

    // Update loan status back to ACTIVE if it was DISBURSED
    if (loan.status === LoanStatus.DISBURSED) {
      loan.status = LoanStatus.ACTIVE;
    }
  }

  /**
   * Regenerate repayment schedule with impact analysis
   */
  private async regenerateSchedule(
    restructure: LoanRestructure,
    loan: Loan,
  ): Promise<void> {
    // Get old schedule for comparison
    const oldSchedule = await this.scheduleRepository.find({
      where: {
        loanId: loan.id,
        status: ScheduleEntryStatus.PENDING,
      },
      order: { paymentDate: 'ASC' },
    });

    // Close existing pending schedules and mark with version
    // Get current max version before closing
    const maxVersionResult = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('MAX(schedule.version)', 'maxVersion')
      .where('schedule.loanId = :loanId', { loanId: loan.id })
      .getRawOne();
    const currentVersion = maxVersionResult?.maxVersion || 1;

    await this.scheduleRepository.update(
      { loanId: loan.id, status: ScheduleEntryStatus.PENDING },
      { status: ScheduleEntryStatus.COMPLETED },
    );

    // Generate new schedule based on new terms
    if (restructure.newRepaymentPeriodInMonths && restructure.repaymentStartDate) {
      // Update loan temporarily for schedule generation
      const originalPeriods = loan.repaymentPeriods;
      const originalStartDate = loan.repaymentStartDate;
      const originalRate = loan.rateOfInterest;
      const originalAmount = loan.loanAmount;

      loan.repaymentPeriods = restructure.newRepaymentPeriodInMonths;
      loan.repaymentStartDate = restructure.repaymentStartDate;
      if (restructure.newRateOfInterest) {
        loan.rateOfInterest = restructure.newRateOfInterest;
      }
      if (restructure.newLoanAmount) {
        loan.loanAmount = restructure.newLoanAmount;
      }

      // Calculate next version (increment from current version)
      const nextVersion = currentVersion + 1;

      // Generate new schedule (allow regeneration for restructure)
      await this.loanService.generateRepaymentSchedule(loan.id, loan.companyId, true);

      // Restore original values (schedule is already generated)
      loan.repaymentPeriods = originalPeriods;
      loan.repaymentStartDate = originalStartDate;
      loan.rateOfInterest = originalRate;
      loan.loanAmount = originalAmount;

      // Get new schedule for impact analysis and versioning
      const newSchedule = await this.scheduleRepository.find({
        where: {
          loanId: loan.id,
          status: ScheduleEntryStatus.PENDING,
        },
        order: { paymentDate: 'ASC' },
      });

      // Update new schedules with version and restructureId
      if (newSchedule.length > 0) {
        await this.scheduleRepository.update(
          { loanId: loan.id, status: ScheduleEntryStatus.PENDING },
          {
            version: nextVersion,
            restructureId: restructure.id,
          },
        );
      }

      // Perform impact analysis
      if (oldSchedule.length > 0 && newSchedule.length > 0) {
        const impactAnalysis = await this.impactAnalysisService.analyzeImpact(
          restructure,
          oldSchedule,
          newSchedule,
        );

        // Store impact analysis in restructure
        restructure.oldScheduleSummary = {
          totalPayments: impactAnalysis.oldSchedule.totalPayments,
          totalInterest: impactAnalysis.oldSchedule.totalInterest,
          totalPrincipal: impactAnalysis.oldSchedule.totalPrincipal,
          totalCost: impactAnalysis.oldSchedule.totalCost,
          numberOfPayments: impactAnalysis.oldSchedule.numberOfPayments,
        };

        restructure.newScheduleSummary = {
          totalPayments: impactAnalysis.newSchedule.totalPayments,
          totalInterest: impactAnalysis.newSchedule.totalInterest,
          totalPrincipal: impactAnalysis.newSchedule.totalPrincipal,
          totalCost: impactAnalysis.newSchedule.totalCost,
          numberOfPayments: impactAnalysis.newSchedule.numberOfPayments,
        };

        restructure.impactAnalysis = {
          interestDifference: impactAnalysis.impact.interestDifference,
          totalCostDifference: impactAnalysis.impact.totalCostDifference,
          paymentDifference: impactAnalysis.impact.paymentDifference,
          extensionMonths: impactAnalysis.impact.extensionMonths,
          percentageIncrease: impactAnalysis.impact.percentageIncrease,
        };

        await this.restructureRepository.save(restructure);
      }
    }
  }

  async findAll(loanId?: string): Promise<LoanRestructure[]> {
    const where: any = {};
    if (loanId) {
      where.loanId = loanId;
    }

    return await this.restructureRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanRestructure> {
    const restructure = await this.restructureRepository.findOne({
      where: { id },
      relations: ['loan'],
    });

    if (!restructure) {
      throw new NotFoundException(
        `Loan restructure with ID ${id} not found`,
      );
    }

    return restructure;
  }

  async update(
    id: string,
    updateDto: UpdateLoanRestructureDto,
  ): Promise<LoanRestructure> {
    const restructure = await this.findOne(id);

    if (restructure.status !== RestructureStatus.INITIATED) {
      throw new BadRequestException(
        `Restructure can only be updated in INITIATED status. Current status: ${restructure.status}`,
      );
    }

    Object.assign(restructure, updateDto);
    return await this.restructureRepository.save(restructure);
  }

  async reject(id: string): Promise<LoanRestructure> {
    const restructure = await this.findOne(id);

    if (restructure.status !== RestructureStatus.INITIATED) {
      throw new BadRequestException(
        `Restructure can only be rejected from INITIATED status. Current status: ${restructure.status}`,
      );
    }

    restructure.status = RestructureStatus.REJECTED;
    return await this.restructureRepository.save(restructure);
  }

  async remove(id: string): Promise<void> {
    const restructure = await this.findOne(id);

    if (restructure.status !== RestructureStatus.INITIATED) {
      throw new BadRequestException(
        `Restructure can only be deleted in INITIATED status. Current status: ${restructure.status}`,
      );
    }

    await this.restructureRepository.remove(restructure);
  }
}

