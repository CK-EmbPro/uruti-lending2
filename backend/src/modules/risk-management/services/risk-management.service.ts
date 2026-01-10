import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanSecurity } from '../../loan-security/entities/loan-security.entity';
import { LoanSecurityAssignment } from '../../loan-security-assignment/entities/loan-security-assignment.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { ConcentrationRisk, ConcentrationType, RiskLevel } from '../entities/concentration-risk.entity';
import { StressTest, StressTestType, StressTestStatus } from '../entities/stress-test.entity';
import { EarlyWarningSignal, SignalType, SignalSeverity, SignalStatus } from '../entities/early-warning-signal.entity';
import { CollateralRevaluation, RevaluationType, RevaluationStatus } from '../entities/collateral-revaluation.entity';
import { AssessConcentrationRiskDto, SetConcentrationLimitDto, TakeCorrectiveActionDto } from '../dto/concentration-risk.dto';
import { CreateStressTestDto, RunStressTestDto } from '../dto/stress-test.dto';
import { DetectEarlyWarningSignalsDto, InvestigateSignalDto, ResolveSignalDto } from '../dto/early-warning-signal.dto';
import { InitiateRevaluationDto, UpdateValuationDto, TakeRevaluationActionDto } from '../dto/collateral-revaluation.dto';

/**
 * Risk Management Service
 * UC-040: Concentration Risk Monitoring
 * UC-041: Stress Testing
 * UC-042: Early Warning Signal Detection
 * UC-043: Collateral Revaluation
 */
@Injectable()
export class RiskManagementService {
  private readonly logger = new Logger(RiskManagementService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanSecurity)
    private readonly securityRepository: Repository<LoanSecurity>,
    @InjectRepository(LoanSecurityAssignment)
    private readonly securityAssignmentRepository: Repository<LoanSecurityAssignment>,
    @InjectRepository(ConcentrationRisk)
    private readonly concentrationRiskRepository: Repository<ConcentrationRisk>,
    @InjectRepository(StressTest)
    private readonly stressTestRepository: Repository<StressTest>,
    @InjectRepository(EarlyWarningSignal)
    private readonly earlyWarningSignalRepository: Repository<EarlyWarningSignal>,
    @InjectRepository(CollateralRevaluation)
    private readonly collateralRevaluationRepository: Repository<CollateralRevaluation>,
  ) {}

  /**
   * UC-040: Concentration Risk Monitoring
   * Assesses concentration risk by geography, industry, product, or customer
   */
  async assessConcentrationRisk(dto: AssessConcentrationRiskDto, userId: string, userName: string): Promise<ConcentrationRisk[]> {
    const assessmentDate = dto.assessmentDate ? new Date(dto.assessmentDate) : new Date();

    // Get all active loans
    const query = this.loanRepository.createQueryBuilder('loan');
    query.where('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
    });

    if (dto.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: dto.companyId });
    }

    const loans = await query.getMany();

    // Calculate total portfolio
    const portfolioTotal = loans.reduce((sum, loan) => {
      const outstanding = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, outstanding);
    }, 0);

    // Group loans by concentration type
    const segmentMap = new Map<string, { identifier: string; name: string; loans: Loan[] }>();

    for (const loan of loans) {
      let segmentIdentifier: string;
      let segmentName: string;

      switch (dto.concentrationType) {
        case ConcentrationType.PRODUCT:
          segmentIdentifier = loan.loanProductId;
          segmentName = `Product ${loan.loanProductId}`; // TODO: Join with LoanProduct for name
          break;
        case ConcentrationType.GEOGRAPHY:
          // Note: Geography would come from customer/application data
          // For now, using a placeholder - would need customer address data
          segmentIdentifier = 'UNKNOWN';
          segmentName = 'Unknown Geography';
          break;
        case ConcentrationType.INDUSTRY:
          // Note: Industry would come from customer/application data
          segmentIdentifier = 'UNKNOWN';
          segmentName = 'Unknown Industry';
          break;
        case ConcentrationType.CUSTOMER:
          segmentIdentifier = loan.applicantId;
          segmentName = `Customer ${loan.applicantId}`;
          break;
        default:
          segmentIdentifier = 'OTHER';
          segmentName = 'Other';
      }

      if (!segmentMap.has(segmentIdentifier)) {
        segmentMap.set(segmentIdentifier, { identifier: segmentIdentifier, name: segmentName, loans: [] });
      }
      segmentMap.get(segmentIdentifier).loans.push(loan);
    }

    // Calculate concentration for each segment
    const risks: ConcentrationRisk[] = [];

    for (const [identifier, segment] of segmentMap.entries()) {
      const segmentExposure = segment.loans.reduce((sum, loan) => {
        const outstanding = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, outstanding);
      }, 0);

      const concentrationPercentage = portfolioTotal > 0 ? (segmentExposure / portfolioTotal) * 100 : 0;

      // Get existing limits (would be stored in a limits table - simplified here)
      const limitPercentage = 25; // Default 25% limit
      const limitAmount = portfolioTotal * (limitPercentage / 100);

      const limitExceeded = concentrationPercentage > limitPercentage || segmentExposure > limitAmount;
      const excessPercentage = limitExceeded ? Math.max(0, concentrationPercentage - limitPercentage) : 0;
      const excessAmount = limitExceeded ? Math.max(0, segmentExposure - limitAmount) : 0;

      // Determine risk level
      let riskLevel: RiskLevel;
      if (concentrationPercentage > 50) {
        riskLevel = RiskLevel.CRITICAL;
      } else if (concentrationPercentage > 35) {
        riskLevel = RiskLevel.HIGH;
      } else if (concentrationPercentage > 25) {
        riskLevel = RiskLevel.MEDIUM;
      } else {
        riskLevel = RiskLevel.LOW;
      }

      // Get loan breakdown if requested
      let loanBreakdown: any = null;
      if (dto.includeLoanBreakdown) {
        loanBreakdown = segment.loans.map((loan) => ({
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          outstanding: Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0),
        }));
      }

      const risk = this.concentrationRiskRepository.create({
        assessmentDate,
        concentrationType: dto.concentrationType,
        segmentIdentifier: identifier,
        segmentName: segment.name,
        totalExposure: segmentExposure,
        portfolioTotal,
        concentrationPercentage,
        limitPercentage,
        limitAmount,
        riskLevel,
        limitExceeded,
        excessPercentage,
        excessAmount,
        loanBreakdown,
        actionRequired: limitExceeded,
        companyId: dto.companyId,
      });

      risks.push(await this.concentrationRiskRepository.save(risk));
    }

    return risks.sort((a, b) => b.concentrationPercentage - a.concentrationPercentage);
  }

  async takeCorrectiveAction(id: string, dto: TakeCorrectiveActionDto, userId: string, userName: string): Promise<ConcentrationRisk> {
    const risk = await this.concentrationRiskRepository.findOne({ where: { id } });
    if (!risk) {
      throw new Error('Concentration risk record not found');
    }

    risk.actionTaken = true;
    risk.actionTakenBy = userId;
    risk.actionTakenAt = new Date();
    risk.correctiveAction = dto.correctiveAction;
    risk.remarks = dto.remarks;

    return await this.concentrationRiskRepository.save(risk);
  }

  /**
   * UC-041: Stress Testing
   * Creates and runs stress test scenarios
   */
  async createStressTest(dto: CreateStressTestDto, userId: string, userName: string): Promise<StressTest> {
    const testDate = dto.testDate ? new Date(dto.testDate) : new Date();

    const stressTest = this.stressTestRepository.create({
      testName: dto.testName,
      testType: dto.testType,
      testDate,
      status: StressTestStatus.DRAFT,
      companyId: dto.companyId,
      scenarioParameters: dto.scenarioParameters || {},
    });

    return await this.stressTestRepository.save(stressTest);
  }

  async runStressTest(id: string, dto: RunStressTestDto, userId: string, userName: string): Promise<StressTest> {
    const stressTest = await this.stressTestRepository.findOne({ where: { id } });
    if (!stressTest) {
      throw new Error('Stress test not found');
    }

    const startTime = Date.now();
    stressTest.status = StressTestStatus.RUNNING;
    stressTest.executedBy = userId;
    stressTest.executedAt = new Date();
    await this.stressTestRepository.save(stressTest);

    try {
      // Get portfolio snapshot
      const query = this.loanRepository.createQueryBuilder('loan');
      query.where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
      });

      if (stressTest.companyId) {
        query.andWhere('loan.companyId = :companyId', { companyId: stressTest.companyId });
      }

      if (dto.loanProductId) {
        query.andWhere('loan.loanProductId = :loanProductId', { loanProductId: dto.loanProductId });
      }

      const loans = await query.getMany();

      const portfolioTotal = loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0);
      const totalOutstanding = loans.reduce((sum, loan) => {
        const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, out);
      }, 0);

      // Apply stress scenario
      const params = stressTest.scenarioParameters || {};
      const defaultRate = params.defaultRate || 0.05; // 5% default rate
      const lossRate = params.lossRate || 0.03; // 3% loss rate

      const projectedDefaults = totalOutstanding * defaultRate;
      const projectedLosses = totalOutstanding * lossRate;

      // Calculate capital requirements (simplified)
      const capitalRequired = projectedLosses;
      const capitalAvailable = totalOutstanding * 0.1; // Assume 10% capital
      const capitalAdequacyRatio = capitalAvailable > 0 ? (capitalAvailable / capitalRequired) * 100 : 0;

      // Results by segment (simplified)
      const resultsBySegment = {
        byProduct: {},
        byStatus: {},
      };

      stressTest.portfolioTotal = portfolioTotal;
      stressTest.totalOutstanding = totalOutstanding;
      stressTest.totalLoans = loans.length;
      stressTest.projectedDefaults = projectedDefaults;
      stressTest.projectedLosses = projectedLosses;
      stressTest.defaultRate = defaultRate * 100;
      stressTest.lossRate = lossRate * 100;
      stressTest.capitalRequired = capitalRequired;
      stressTest.capitalAvailable = capitalAvailable;
      stressTest.capitalAdequacyRatio = capitalAdequacyRatio;
      stressTest.resultsBySegment = resultsBySegment;
      stressTest.status = StressTestStatus.COMPLETED;
      stressTest.completedAt = new Date();
      stressTest.executionTimeMs = Date.now() - startTime;

      return await this.stressTestRepository.save(stressTest);
    } catch (error) {
      stressTest.status = StressTestStatus.FAILED;
      stressTest.errorMessage = error.message;
      stressTest.executionTimeMs = Date.now() - startTime;
      await this.stressTestRepository.save(stressTest);
      throw error;
    }
  }

  /**
   * UC-042: Early Warning Signal Detection
   * Monitors accounts for risk signals and payment pattern changes
   */
  async detectEarlyWarningSignals(dto: DetectEarlyWarningSignalsDto, userId: string, userName: string): Promise<EarlyWarningSignal[]> {
    const analysisDate = dto.analysisDate ? new Date(dto.analysisDate) : new Date();

    // Get loans to analyze
    const query = this.loanRepository.createQueryBuilder('loan');
    query.where('loan.status IN (:...statuses)', {
      statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
    });

    if (dto.loanId) {
      query.andWhere('loan.id = :loanId', { loanId: dto.loanId });
    }

    if (dto.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: dto.companyId });
    }

    const loans = await query.getMany();
    const signals: EarlyWarningSignal[] = [];

    for (const loan of loans) {
      // Check for payment pattern changes
      const repayments = await this.repaymentRepository.find({
        where: { loanId: loan.id },
        order: { postingDate: 'DESC' },
        take: 6, // Last 6 payments
      });

      if (repayments.length >= 3) {
        // Analyze payment patterns
        const recentPayments = repayments.slice(0, 3);
        const olderPayments = repayments.slice(3, 6);

        if (olderPayments.length > 0) {
          const recentAvg = recentPayments.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0) / recentPayments.length;
          const olderAvg = olderPayments.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0) / olderPayments.length;

          // Detect payment amount decrease
          if (recentAvg < olderAvg * 0.8) {
            const signal = this.earlyWarningSignalRepository.create({
              loanId: loan.id,
              signalType: SignalType.PAYMENT_AMOUNT_DECREASE,
              signalDate: analysisDate,
              severity: SignalSeverity.MEDIUM,
              status: SignalStatus.ACTIVE,
              title: 'Payment Amount Decrease Detected',
              description: `Payment amounts have decreased by ${((1 - recentAvg / olderAvg) * 100).toFixed(2)}%`,
              signalData: {
                recentAverage: recentAvg,
                previousAverage: olderAvg,
                decreasePercentage: ((1 - recentAvg / olderAvg) * 100),
              },
              historicalContext: {
                recentPayments: recentPayments.map((r) => ({
                  date: r.postingDate,
                  amount: r.amountPaid,
                })),
                olderPayments: olderPayments.map((r) => ({
                  date: r.postingDate,
                  amount: r.amountPaid,
                })),
              },
              paymentAmountChange: recentAvg - olderAvg,
              patternDeviation: ((1 - recentAvg / olderAvg) * 100),
            });
            signals.push(await this.earlyWarningSignalRepository.save(signal));
          }
        }

        // Check for delayed payments
        const lastPayment = repayments[0];
        if (lastPayment) {
          const daysSinceLastPayment = Math.floor(
            (analysisDate.getTime() - lastPayment.postingDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          // If no payment in last 30 days and loan is active
          if (daysSinceLastPayment > 30 && loan.status === LoanStatus.ACTIVE) {
            const signal = this.earlyWarningSignalRepository.create({
              loanId: loan.id,
              signalType: SignalType.DELAYED_PAYMENT,
              signalDate: analysisDate,
              severity: daysSinceLastPayment > 60 ? SignalSeverity.HIGH : SignalSeverity.MEDIUM,
              status: SignalStatus.ACTIVE,
              title: 'Delayed Payment Detected',
              description: `No payment received in ${daysSinceLastPayment} days`,
              signalData: {
                daysSinceLastPayment,
                lastPaymentDate: lastPayment.postingDate,
                lastPaymentAmount: lastPayment.amountPaid,
              },
              daysSinceLastPayment,
              requiresAction: daysSinceLastPayment > 60,
            });
            signals.push(await this.earlyWarningSignalRepository.save(signal));
          }
        }
      }
    }

    return signals;
  }

  async investigateSignal(id: string, dto: InvestigateSignalDto, userId: string, userName: string): Promise<EarlyWarningSignal> {
    const signal = await this.earlyWarningSignalRepository.findOne({ where: { id } });
    if (!signal) {
      throw new Error('Early warning signal not found');
    }

    signal.status = SignalStatus.INVESTIGATING;
    signal.investigatedBy = userId;
    signal.investigatedAt = new Date();
    signal.investigationNotes = dto.investigationNotes;
    signal.requiresAction = dto.requiresAction || false;
    signal.recommendedAction = dto.recommendedAction;

    return await this.earlyWarningSignalRepository.save(signal);
  }

  async resolveSignal(id: string, dto: ResolveSignalDto, userId: string, userName: string): Promise<EarlyWarningSignal> {
    const signal = await this.earlyWarningSignalRepository.findOne({ where: { id } });
    if (!signal) {
      throw new Error('Early warning signal not found');
    }

    signal.status = SignalStatus.RESOLVED;
    signal.resolvedBy = userId;
    signal.resolvedAt = new Date();
    signal.resolutionNotes = dto.resolutionNotes;
    signal.remarks = dto.remarks;

    return await this.earlyWarningSignalRepository.save(signal);
  }

  /**
   * UC-043: Collateral Revaluation
   * Initiates and processes collateral revaluations
   */
  async initiateRevaluation(dto: InitiateRevaluationDto, userId: string, userName: string): Promise<CollateralRevaluation> {
    const revaluationDate = dto.revaluationDate ? new Date(dto.revaluationDate) : new Date();

    // Get loan
    const loan = await this.loanRepository.findOne({ where: { id: dto.loanId } });
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (!loan.isSecuredLoan) {
      throw new Error('Loan is not secured');
    }

    // Get security assignments
    const assignments = await this.securityAssignmentRepository.find({
      where: { loanId: dto.loanId },
      relations: ['security'],
    });

    if (assignments.length === 0) {
      throw new Error('No security assignments found for loan');
    }

    // Get previous valuation
    const previousRevaluation = await this.collateralRevaluationRepository.findOne({
      where: { loanId: dto.loanId },
      order: { revaluationDate: 'DESC' },
    });

    const previousValuation = previousRevaluation?.newValuation || 0;
    const previousValuationDate = previousRevaluation?.valuationEffectiveDate || null;

    // Calculate current outstanding
    const outstandingBalance =
      Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);

    // Calculate previous LTV
    const previousLTV = previousValuation > 0 ? (outstandingBalance / previousValuation) * 100 : 0;

    const revaluation = this.collateralRevaluationRepository.create({
      loanId: dto.loanId,
      securityId: dto.securityId || assignments[0]?.id,
      revaluationType: dto.revaluationType || RevaluationType.AUTOMATED,
      revaluationDate,
      status: RevaluationStatus.PENDING,
      previousValuation,
      previousValuationDate,
      loanAmount: Number(loan.loanAmount || 0),
      outstandingBalance,
      previousLTV,
      maxAllowedLTV: 80, // Default 80% LTV limit
      initiatedBy: userId,
      initiatedAt: new Date(),
    });

    return await this.collateralRevaluationRepository.save(revaluation);
  }

  async updateValuation(id: string, dto: UpdateValuationDto, userId: string, userName: string): Promise<CollateralRevaluation> {
    const revaluation = await this.collateralRevaluationRepository.findOne({ where: { id } });
    if (!revaluation) {
      throw new Error('Collateral revaluation not found');
    }

    const newValuation = dto.newValuation;
    const valuationEffectiveDate = new Date(dto.valuationEffectiveDate);

    // Calculate valuation change
    const previousValuation = revaluation.previousValuation || 0;
    const valuationChangePercentage =
      previousValuation > 0 ? ((newValuation - previousValuation) / previousValuation) * 100 : 0;

    // Calculate new LTV
    const newLTV = newValuation > 0 ? (revaluation.outstandingBalance / newValuation) * 100 : 0;
    const ltvChange = newLTV - (revaluation.previousLTV || 0);

    // Check if under-collateralized
    const maxAllowedLTV = revaluation.maxAllowedLTV || 80;
    const underCollateralized = newLTV > maxAllowedLTV;
    const collateralShortfall = underCollateralized
      ? Math.max(0, revaluation.outstandingBalance - newValuation * (maxAllowedLTV / 100))
      : 0;

    revaluation.newValuation = newValuation;
    revaluation.valuationEffectiveDate = valuationEffectiveDate;
    revaluation.valuationChangePercentage = valuationChangePercentage;
    revaluation.newLTV = newLTV;
    revaluation.ltvChange = ltvChange;
    revaluation.underCollateralized = underCollateralized;
    revaluation.collateralShortfall = collateralShortfall;
    revaluation.valuationSource = dto.valuationSource;
    revaluation.valuationReference = dto.valuationReference;
    revaluation.valuationNotes = dto.valuationNotes;
    revaluation.appraisalDetails = dto.appraisalDetails;
    revaluation.status = RevaluationStatus.COMPLETED;
    revaluation.completedBy = userId;
    revaluation.completedAt = new Date();
    revaluation.actionRequired = underCollateralized;

    if (underCollateralized) {
      revaluation.requiredAction = `Loan is under-collateralized. LTV of ${newLTV.toFixed(2)}% exceeds maximum of ${maxAllowedLTV}%. Shortfall: $${collateralShortfall.toFixed(2)}`;
    }

    return await this.collateralRevaluationRepository.save(revaluation);
  }

  async takeRevaluationAction(id: string, dto: TakeRevaluationActionDto, userId: string, userName: string): Promise<CollateralRevaluation> {
    const revaluation = await this.collateralRevaluationRepository.findOne({ where: { id } });
    if (!revaluation) {
      throw new Error('Collateral revaluation not found');
    }

    revaluation.actionTaken = true;
    revaluation.actionTakenBy = userId;
    revaluation.actionTakenAt = new Date();
    revaluation.remarks = dto.remarks;

    return await this.collateralRevaluationRepository.save(revaluation);
  }

  // Query methods
  async getConcentrationRisks(filters: {
    concentrationType?: ConcentrationType;
    riskLevel?: RiskLevel;
    limitExceeded?: boolean;
    companyId?: string;
  }): Promise<ConcentrationRisk[]> {
    const query = this.concentrationRiskRepository.createQueryBuilder('risk');

    if (filters.concentrationType) {
      query.andWhere('risk.concentrationType = :concentrationType', { concentrationType: filters.concentrationType });
    }

    if (filters.riskLevel) {
      query.andWhere('risk.riskLevel = :riskLevel', { riskLevel: filters.riskLevel });
    }

    if (filters.limitExceeded !== undefined) {
      query.andWhere('risk.limitExceeded = :limitExceeded', { limitExceeded: filters.limitExceeded });
    }

    if (filters.companyId) {
      query.andWhere('risk.companyId = :companyId', { companyId: filters.companyId });
    }

    query.orderBy('risk.concentrationPercentage', 'DESC');

    return await query.getMany();
  }

  async getStressTests(filters: { testType?: StressTestType; status?: StressTestStatus; companyId?: string }): Promise<StressTest[]> {
    const query = this.stressTestRepository.createQueryBuilder('test');

    if (filters.testType) {
      query.andWhere('test.testType = :testType', { testType: filters.testType });
    }

    if (filters.status) {
      query.andWhere('test.status = :status', { status: filters.status });
    }

    if (filters.companyId) {
      query.andWhere('test.companyId = :companyId', { companyId: filters.companyId });
    }

    query.orderBy('test.testDate', 'DESC');

    return await query.getMany();
  }

  async getEarlyWarningSignals(filters: {
    loanId?: string;
    signalType?: SignalType;
    severity?: SignalSeverity;
    status?: SignalStatus;
  }): Promise<EarlyWarningSignal[]> {
    const query = this.earlyWarningSignalRepository.createQueryBuilder('signal');

    if (filters.loanId) {
      query.andWhere('signal.loanId = :loanId', { loanId: filters.loanId });
    }

    if (filters.signalType) {
      query.andWhere('signal.signalType = :signalType', { signalType: filters.signalType });
    }

    if (filters.severity) {
      query.andWhere('signal.severity = :severity', { severity: filters.severity });
    }

    if (filters.status) {
      query.andWhere('signal.status = :status', { status: filters.status });
    }

    query.orderBy('signal.signalDate', 'DESC');

    return await query.getMany();
  }

  async getCollateralRevaluations(filters: {
    loanId?: string;
    securityId?: string;
    status?: RevaluationStatus;
    underCollateralized?: boolean;
  }): Promise<CollateralRevaluation[]> {
    const query = this.collateralRevaluationRepository.createQueryBuilder('reval');

    if (filters.loanId) {
      query.andWhere('reval.loanId = :loanId', { loanId: filters.loanId });
    }

    if (filters.securityId) {
      query.andWhere('reval.securityId = :securityId', { securityId: filters.securityId });
    }

    if (filters.status) {
      query.andWhere('reval.status = :status', { status: filters.status });
    }

    if (filters.underCollateralized !== undefined) {
      query.andWhere('reval.underCollateralized = :underCollateralized', { underCollateralized: filters.underCollateralized });
    }

    query.orderBy('reval.revaluationDate', 'DESC');

    return await query.getMany();
  }
}

