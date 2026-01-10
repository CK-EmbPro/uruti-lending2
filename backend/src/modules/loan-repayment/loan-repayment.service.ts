import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { PrepaymentCharge } from './entities/prepayment-charge.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { RepaymentType } from '../../common/enums/repayment-type.enum';
import { CreateLoanRepaymentDto } from './dto/create-loan-repayment.dto';
import { UpdateLoanRepaymentDto } from './dto/update-loan-repayment.dto';
import { BulkRepaymentDto } from './dto/bulk-repayment.dto';
import {
  LoanDemand,
  DemandStatus,
} from '../loan-demand/entities/loan-demand.entity';
import { AccountingService } from '../accounting/accounting.service';
import { LoanNotificationHelperService } from '../notification/services/loan-notification-helper.service';
import { CurrencyConversionService } from '../currency/services/currency-conversion.service';
import { IntegrationService } from '../integration/services/integration.service';
import { RepaymentIntegrationService } from './services/repayment-integration.service';

@Injectable()
export class LoanRepaymentService {
  private readonly logger = new Logger(LoanRepaymentService.name);

  constructor(
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(PrepaymentCharge)
    private readonly prepaymentChargeRepository: Repository<PrepaymentCharge>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanDemand)
    private readonly demandRepository: Repository<LoanDemand>,
    private readonly accountingService: AccountingService,
    private readonly notificationHelper: LoanNotificationHelperService,
    private readonly currencyConversionService: CurrencyConversionService,
    @Inject(forwardRef(() => IntegrationService))
    private readonly integrationService: IntegrationService,
    private readonly repaymentIntegrationService: RepaymentIntegrationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createLoanRepaymentDto: CreateLoanRepaymentDto, companyId: string): Promise<LoanRepayment> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const repaymentType =
      createLoanRepaymentDto.repaymentType || RepaymentType.NORMAL_REPAYMENT;

    // Validate loan exists and belongs to company
    const loan = await this.loanRepository.findOne({
      where: { id: createLoanRepaymentDto.loanId, companyId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(
        `Loan with ID ${createLoanRepaymentDto.loanId} not found or access denied`,
      );
    }

    // Get loan product for waiver accounts (verify it belongs to company)
    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: loan.loanProductId, companyId },
    });

    // Validate loan status based on repayment type
    this.validateRepaymentType(loan, repaymentType);

    // Validate moratorium period
    this.validateMoratoriumPeriod(loan, createLoanRepaymentDto.postingDate, repaymentType);

    // Handle different repayment types
    switch (repaymentType) {
      case RepaymentType.INTEREST_WAIVER:
        return await this.createInterestWaiver(
          createLoanRepaymentDto,
          loan,
          loanProduct,
        );
      case RepaymentType.PENALTY_WAIVER:
        return await this.createPenaltyWaiver(
          createLoanRepaymentDto,
          loan,
          loanProduct,
        );
      case RepaymentType.CHARGES_WAIVER:
        return await this.createChargesWaiver(
          createLoanRepaymentDto,
          loan,
          loanProduct,
        );
      case RepaymentType.FULL_SETTLEMENT:
      case RepaymentType.WRITE_OFF_SETTLEMENT:
        return await this.createSettlement(
          createLoanRepaymentDto,
          loan,
          repaymentType,
        );
      case RepaymentType.LOAN_CLOSURE:
        return await this.createLoanClosureRepayment(
          createLoanRepaymentDto,
          loan,
        );
      default:
        return await this.createNormalRepayment(createLoanRepaymentDto, loan);
    }
  }

  /**
   * Validate moratorium period
   * Blocks repayments during moratorium period
   */
  private validateMoratoriumPeriod(
    loan: Loan,
    postingDate: string,
    repaymentType: RepaymentType,
  ): void {
    if (!loan.moratoriumEndDate) {
      return; // No moratorium set
    }

    const moratoriumEnd = new Date(loan.moratoriumEndDate);
    const repaymentDate = new Date(postingDate);

    // Check if repayment is during moratorium
    if (repaymentDate <= moratoriumEnd) {
      // Block Pre Payment and Advance Payment during moratorium
      if (
        repaymentType === RepaymentType.PRE_PAYMENT ||
        repaymentType === RepaymentType.ADVANCE_PAYMENT
      ) {
        throw new BadRequestException(
          `Cannot make ${repaymentType} during moratorium period. Moratorium End Date: ${moratoriumEnd.toISOString().split('T')[0]}, Posting Date: ${repaymentDate.toISOString().split('T')[0]}`,
        );
      }

      // Block normal repayments if moratorium type is EMI
      if (
        loan.moratoriumType === 'EMI' &&
        repaymentType === RepaymentType.NORMAL_REPAYMENT
      ) {
        throw new BadRequestException(
          `Cannot make normal repayments during EMI moratorium period. Moratorium End Date: ${moratoriumEnd.toISOString().split('T')[0]}`,
        );
      }
    }
  }

  /**
   * Validate repayment type against loan status
   */
  private validateRepaymentType(loan: Loan, repaymentType: RepaymentType): void {
    const validStatuses = [
      LoanStatus.DISBURSED,
      LoanStatus.ACTIVE,
      LoanStatus.PARTIALLY_DISBURSED,
    ];

    // Settlements and closure can be done on written-off loans
    if (
      [
        RepaymentType.FULL_SETTLEMENT,
        RepaymentType.WRITE_OFF_SETTLEMENT,
        RepaymentType.LOAN_CLOSURE,
      ].includes(repaymentType)
    ) {
      validStatuses.push(LoanStatus.WRITTEN_OFF);
    }

    if (!validStatuses.includes(loan.status)) {
      throw new BadRequestException(
        `Repayment type ${repaymentType} cannot be made for loan in status ${loan.status}`,
      );
    }
  }

  /**
   * Create normal repayment
   */
  private async createNormalRepayment(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
  ): Promise<LoanRepayment> {
    // Calculate outstanding amounts from demands
    const outstandingDemands = await this.demandRepository.find({
      where: {
        loanId: loan.id,
        status: DemandStatus.PENDING,
      },
    });

    let outstandingInterest = 0;
    let outstandingPenalty = 0;
    for (const demand of outstandingDemands) {
      outstandingInterest += Number(demand.interestAmount || 0);
      outstandingPenalty += Number(demand.penaltyAmount || 0);
    }

    // Calculate outstanding principal
    const outstandingPrincipal = Math.max(
      0,
      Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
    );

    // Auto-allocate if not provided
    let principalPaid = dto.principalPaid ?? 0;
    let interestPaid = dto.interestPaid ?? 0;
    let penaltyPaid = dto.penaltyPaid ?? 0;
    let chargesPaid = dto.chargesPaid ?? 0;
    let excessAmount = dto.excessAmount ?? 0;

    const totalAllocated = principalPaid + interestPaid + penaltyPaid + chargesPaid;
    const amountPaid = Number(dto.amountPaid);

    if (totalAllocated === 0) {
      // Auto-allocate: first to penalty, then interest, then principal
      let remaining = amountPaid;

      // Allocate to penalty first
      if (remaining > 0 && outstandingPenalty > 0) {
        penaltyPaid = Math.min(remaining, outstandingPenalty);
        remaining -= penaltyPaid;
      }

      // Then to interest
      if (remaining > 0 && outstandingInterest > 0) {
        interestPaid = Math.min(remaining, outstandingInterest);
        remaining -= interestPaid;
      }

      // Then to principal
      if (remaining > 0 && outstandingPrincipal > 0) {
        principalPaid = Math.min(remaining, outstandingPrincipal);
        remaining -= principalPaid;
      }

      // Excess amount
      excessAmount = remaining;
    } else if (totalAllocated !== amountPaid) {
      throw new BadRequestException(
        `Allocated amounts (${totalAllocated}) must equal amount paid (${amountPaid})`,
      );
    }

    // Create repayment
    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType: RepaymentType.NORMAL_REPAYMENT,
      postingDate: new Date(dto.postingDate),
      principalPaid,
      interestPaid,
      penaltyPaid,
      chargesPaid,
      excessAmount,
    });

    // Handle currency conversion if needed
    if (loan.currencyId && dto.paymentCurrencyId) {
      // Validate payment currency
      const isValid = await this.currencyConversionService.validateCurrency(
        dto.paymentCurrencyId
      );
      if (!isValid) {
        throw new BadRequestException('Invalid payment currency');
      }

      // Convert payment amount to loan currency
      const conversion = await this.currencyConversionService.convertAmount(
        dto.amountPaid,
        dto.paymentCurrencyId,
        loan.currencyId,
        new Date(dto.postingDate)
      );
      
      repayment.paymentCurrencyId = dto.paymentCurrencyId;
      repayment.exchangeRate = conversion.exchangeRate;
      
      // Convert to base currency for reporting
      const baseCurrency = await this.currencyConversionService.getBaseCurrency();
      const baseConversion = await this.currencyConversionService.convertAmount(
        dto.amountPaid,
        dto.paymentCurrencyId,
        baseCurrency.id,
        new Date(dto.postingDate)
      );
      
      repayment.amountPaidBaseCurrency = baseConversion.convertedAmount;
    } else if (loan.currencyId) {
      // Convert to base currency for reporting
      const baseCurrency = await this.currencyConversionService.getBaseCurrency();
      const conversion = await this.currencyConversionService.convertAmount(
        dto.amountPaid,
        loan.currencyId,
        baseCurrency.id,
        new Date(dto.postingDate)
      );
      
      repayment.amountPaidBaseCurrency = conversion.convertedAmount;
      repayment.exchangeRate = conversion.exchangeRate;
    }

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan totals
    await this.updateLoanTotals(loan, {
      principalPaid,
      interestPaid,
      penaltyPaid,
      chargesPaid,
      amountPaid,
      excessAmount,
    });

    // Create accounting entries via accounting service
    if (this.accountingService && loan.loanProduct) {
      const postingDate = new Date(savedRepayment.postingDate);
      const valueDate = savedRepayment.valueDate 
        ? new Date(savedRepayment.valueDate)
        : postingDate;
      
      await this.accountingService.createRepaymentEntries(
        savedRepayment.loanId,
        savedRepayment.id,
        loan.companyId,
        postingDate,
        valueDate,
        loan.loanProduct.paymentAccount,
        loan.loanProduct.loanAccount,
        savedRepayment.principalPaid || 0,
        savedRepayment.interestPaid || 0,
        savedRepayment.penaltyPaid || 0,
        loan.loanProduct.interestReceivableAccount,
        loan.loanProduct.penaltyReceivableAccount,
        loan.applicantType,
        loan.applicantId,
        loan.costCenter,
        savedRepayment.repaymentType,
      );
    }

    // Send notification when payment is received
    try {
      await this.notificationHelper.notifyPaymentReceived(
        loan,
        savedRepayment,
        loan.applicantId, // recipientId
        undefined, // recipientEmail - would be fetched from Customer entity
        undefined, // recipientPhone - would be fetched from Customer entity
      );
    } catch (error) {
      // Log error but don't fail the repayment
      this.logger.error(`Failed to send payment received notification: ${error.message}`);
    }

    // Send payment receipt via email with PDF (integration service)
    try {
      await this.repaymentIntegrationService.sendPaymentReceipt(savedRepayment.id);
    } catch (error) {
      // Log error but don't fail the repayment
      this.logger.error(`Failed to send payment receipt: ${error.message}`);
    }

    // Notify external platform if this is an external loan
    // Only notify for non-external repayments (external repayments already send webhook in postExternalRepayment)
    try {
      await this.integrationService.notifyRepaymentPosted(
        loan.id,
        savedRepayment.id,
        amountPaid,
        new Date(savedRepayment.postingDate),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send external platform webhook for repayment: ${error.message}`,
      );
      // Don't throw - repayment succeeded, webhook failure is logged
    }

    return savedRepayment;
  }

  /**
   * Create interest waiver
   */
  private async createInterestWaiver(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
    loanProduct: LoanProduct,
  ): Promise<LoanRepayment> {
    if (!loanProduct?.interestWaiverAccount) {
      throw new BadRequestException(
        'Interest waiver account not configured in loan product',
      );
    }

    // Get outstanding interest from demands
    const outstandingDemands = await this.demandRepository.find({
      where: {
        loanId: loan.id,
        status: DemandStatus.PENDING,
      },
    });

    let outstandingInterest = 0;
    for (const demand of outstandingDemands) {
      outstandingInterest += Number(demand.interestAmount || 0);
    }

    const waiverAmount = dto.amountPaid || outstandingInterest;

    if (waiverAmount <= 0) {
      throw new BadRequestException('Interest waiver amount must be greater than 0');
    }

    if (waiverAmount > outstandingInterest) {
      throw new BadRequestException(
        `Interest waiver amount (${waiverAmount}) cannot exceed outstanding interest (${outstandingInterest})`,
      );
    }

    // Create waiver repayment (no actual payment, just adjustment)
    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType: RepaymentType.INTEREST_WAIVER,
      postingDate: new Date(dto.postingDate),
      amountPaid: 0, // No actual payment for waiver
      principalPaid: 0,
      interestPaid: waiverAmount,
      penaltyPaid: 0,
      chargesPaid: 0,
      excessAmount: 0,
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan totals (interest is waived, not paid)
    loan.totalInterestPaid = Number(loan.totalInterestPaid) + waiverAmount;
    await this.loanRepository.save(loan);

    // Create accounting entries for waiver
    await this.createRepaymentAccountingEntries(
      savedRepayment,
      loan,
      loan.loanProduct,
    );

    return savedRepayment;
  }

  /**
   * Create penalty waiver
   */
  private async createPenaltyWaiver(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
    loanProduct: LoanProduct,
  ): Promise<LoanRepayment> {
    if (!loanProduct?.penaltyWaiverAccount) {
      throw new BadRequestException(
        'Penalty waiver account not configured in loan product',
      );
    }

    // Get outstanding penalty from demands
    const outstandingDemands = await this.demandRepository.find({
      where: {
        loanId: loan.id,
        status: DemandStatus.PENDING,
      },
    });

    let outstandingPenalty = 0;
    for (const demand of outstandingDemands) {
      outstandingPenalty += Number(demand.penaltyAmount || 0);
    }

    const waiverAmount = dto.amountPaid || outstandingPenalty;

    if (waiverAmount <= 0) {
      throw new BadRequestException('Penalty waiver amount must be greater than 0');
    }

    if (waiverAmount > outstandingPenalty) {
      throw new BadRequestException(
        `Penalty waiver amount (${waiverAmount}) cannot exceed outstanding penalty (${outstandingPenalty})`,
      );
    }

    // Create waiver repayment
    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType: RepaymentType.PENALTY_WAIVER,
      postingDate: new Date(dto.postingDate),
      amountPaid: 0, // No actual payment for waiver
      principalPaid: 0,
      interestPaid: 0,
      penaltyPaid: waiverAmount,
      chargesPaid: 0,
      excessAmount: 0,
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan totals
    loan.totalPenaltyPaid = Number(loan.totalPenaltyPaid) + waiverAmount;
    await this.loanRepository.save(loan);

    // Create accounting entries for waiver
    await this.createRepaymentAccountingEntries(
      savedRepayment,
      loan,
      loan.loanProduct,
    );

    return savedRepayment;
  }

  /**
   * Create charges waiver
   */
  private async createChargesWaiver(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
    loanProduct: LoanProduct,
  ): Promise<LoanRepayment> {
    // For charges waiver, we need loan charges entity (not implemented yet)
    // For now, just create the repayment entry
    const waiverAmount = dto.amountPaid || dto.chargesPaid || 0;

    if (waiverAmount <= 0) {
      throw new BadRequestException('Charges waiver amount must be greater than 0');
    }

    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType: RepaymentType.CHARGES_WAIVER,
      postingDate: new Date(dto.postingDate),
      amountPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      penaltyPaid: 0,
      chargesPaid: waiverAmount,
      excessAmount: 0,
    });

    return await this.repaymentRepository.save(repayment);
  }

  /**
   * Create settlement repayment
   */
  private async createSettlement(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
    repaymentType: RepaymentType,
  ): Promise<LoanRepayment> {
    // Settlement requires full payment of all outstanding amounts
    const outstandingDemands = await this.demandRepository.find({
      where: {
        loanId: loan.id,
        status: DemandStatus.PENDING,
      },
    });

    let outstandingInterest = 0;
    let outstandingPenalty = 0;
    for (const demand of outstandingDemands) {
      outstandingInterest += Number(demand.interestAmount || 0);
      outstandingPenalty += Number(demand.penaltyAmount || 0);
    }

    const outstandingPrincipal = Math.max(
      0,
      Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
    );

    const totalOutstanding =
      outstandingPrincipal + outstandingInterest + outstandingPenalty;

    if (dto.amountPaid < totalOutstanding) {
      throw new BadRequestException(
        `Settlement amount (${dto.amountPaid}) must cover all outstanding amounts (${totalOutstanding})`,
      );
    }

    // Create settlement repayment
    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType,
      postingDate: new Date(dto.postingDate),
      principalPaid: outstandingPrincipal,
      interestPaid: outstandingInterest,
      penaltyPaid: outstandingPenalty,
      chargesPaid: dto.chargesPaid || 0,
      excessAmount: dto.amountPaid - totalOutstanding - (dto.chargesPaid || 0),
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan totals and close loan
    await this.updateLoanTotals(loan, {
      principalPaid: outstandingPrincipal,
      interestPaid: outstandingInterest,
      penaltyPaid: outstandingPenalty,
      chargesPaid: dto.chargesPaid || 0,
      amountPaid: dto.amountPaid,
      excessAmount: dto.amountPaid - totalOutstanding - (dto.chargesPaid || 0),
    });

    // Close loan on settlement
    loan.status = LoanStatus.SETTLED;
    loan.closureDate = new Date(dto.postingDate);
    await this.loanRepository.save(loan);

    // Create accounting entries via accounting service
    if (this.accountingService && loan.loanProduct) {
      const postingDate = new Date(savedRepayment.postingDate);
      const valueDate = savedRepayment.valueDate 
        ? new Date(savedRepayment.valueDate)
        : postingDate;
      
      await this.accountingService.createRepaymentEntries(
        savedRepayment.loanId,
        savedRepayment.id,
        loan.companyId,
        postingDate,
        valueDate,
        loan.loanProduct.paymentAccount,
        loan.loanProduct.loanAccount,
        savedRepayment.principalPaid || 0,
        savedRepayment.interestPaid || 0,
        savedRepayment.penaltyPaid || 0,
        loan.loanProduct.interestReceivableAccount,
        loan.loanProduct.penaltyReceivableAccount,
        loan.applicantType,
        loan.applicantId,
        loan.costCenter,
        savedRepayment.repaymentType,
      );
    }

    return savedRepayment;
  }

  /**
   * Create loan closure repayment
   */
  private async createLoanClosureRepayment(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
  ): Promise<LoanRepayment> {
    // Similar to settlement, but specifically for loan closure
    return await this.createSettlement(dto, loan, RepaymentType.LOAN_CLOSURE);
  }

  /**
   * Create prepayment repayment
   */
  private async createPrePayment(
    dto: CreateLoanRepaymentDto,
    loan: Loan,
  ): Promise<LoanRepayment> {
    // Calculate outstanding principal
    const outstandingPrincipal = Math.max(
      0,
      Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
    );

    // For prepayment, principal paid should be specified
    const principalPaid = dto.principalPaid || 0;

    if (principalPaid <= 0) {
      throw new BadRequestException(
        'Prepayment requires principal amount to be paid',
      );
    }

    if (principalPaid > outstandingPrincipal) {
      throw new BadRequestException(
        `Prepayment amount (${principalPaid}) cannot exceed outstanding principal (${outstandingPrincipal})`,
      );
    }

    // Calculate prepayment charges if provided
    let prepaymentChargesTotal = 0;
    const prepaymentCharges: PrepaymentCharge[] = [];

    if (dto.prepaymentCharges && dto.prepaymentCharges.length > 0) {
      for (const chargeDto of dto.prepaymentCharges) {
        if (chargeDto.amount > 0) {
          prepaymentChargesTotal += chargeDto.amount;
          const charge = this.prepaymentChargeRepository.create({
            charge: chargeDto.charge,
            amount: chargeDto.amount,
          });
          prepaymentCharges.push(charge);
        }
      }
    }

    // Create repayment
    const repayment = this.repaymentRepository.create({
      ...dto,
      repaymentType: RepaymentType.PRE_PAYMENT,
      postingDate: new Date(dto.postingDate),
      amountPaid: dto.amountPaid,
      principalPaid: principalPaid,
      interestPaid: dto.interestPaid || 0,
      penaltyPaid: dto.penaltyPaid || 0,
      chargesPaid: dto.chargesPaid || 0,
      excessAmount: dto.excessAmount || 0,
      prepaymentChargesTotal,
      prepaymentCharges,
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);

    // Update loan totals
    await this.updateLoanTotals(loan, {
      principalPaid,
      interestPaid: dto.interestPaid || 0,
      penaltyPaid: dto.penaltyPaid || 0,
      chargesPaid: dto.chargesPaid || 0,
      amountPaid: dto.amountPaid,
      excessAmount: dto.excessAmount || 0,
    });

    // TODO: Reschedule repayment schedule if prepayment reduces tenure
    // This would involve:
    // 1. Calculating new tenure based on remaining principal
    // 2. Regenerating repayment schedule
    // 3. Updating loan repayment periods

    // Create accounting entries via accounting service
    if (this.accountingService && loan.loanProduct) {
      const postingDate = new Date(savedRepayment.postingDate);
      const valueDate = savedRepayment.valueDate 
        ? new Date(savedRepayment.valueDate)
        : postingDate;
      
      await this.accountingService.createRepaymentEntries(
        savedRepayment.loanId,
        savedRepayment.id,
        loan.companyId,
        postingDate,
        valueDate,
        loan.loanProduct.paymentAccount,
        loan.loanProduct.loanAccount,
        savedRepayment.principalPaid || 0,
        savedRepayment.interestPaid || 0,
        savedRepayment.penaltyPaid || 0,
        loan.loanProduct.interestReceivableAccount,
        loan.loanProduct.penaltyReceivableAccount,
        loan.applicantType,
        loan.applicantId,
        loan.costCenter,
        savedRepayment.repaymentType,
      );
    }

    return savedRepayment;
  }

  /**
   * Update loan totals after repayment
   */
  private async updateLoanTotals(
    loan: Loan,
    amounts: {
      principalPaid: number;
      interestPaid: number;
      penaltyPaid: number;
      chargesPaid: number;
      amountPaid: number;
      excessAmount: number;
    },
  ): Promise<void> {
    loan.totalPrincipalPaid =
      Number(loan.totalPrincipalPaid) + amounts.principalPaid;
    loan.totalInterestPaid =
      Number(loan.totalInterestPaid) + amounts.interestPaid;
    loan.totalPenaltyPaid = Number(loan.totalPenaltyPaid) + amounts.penaltyPaid;
    loan.totalAmountPaid = Number(loan.totalAmountPaid) + amounts.amountPaid;
    loan.excessAmountPaid =
      Number(loan.excessAmountPaid) + amounts.excessAmount;

    // Update loan status if fully paid
    const outstandingPrincipal = Math.max(
      0,
      Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
    );

    if (outstandingPrincipal <= 0 && loan.status !== LoanStatus.SETTLED) {
      loan.status = LoanStatus.CLOSED;
      if (!loan.closureDate) {
        loan.closureDate = new Date();
      }
    } else if (loan.status === LoanStatus.DISBURSED) {
      loan.status = LoanStatus.ACTIVE;
    }

    await this.loanRepository.save(loan);
  }

  async findAll(
    companyId: string,
    filters?: {
      loanId?: string;
      repaymentType?: string;
      fromDate?: string;
      toDate?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: LoanRepayment[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const query = this.repaymentRepository
      .createQueryBuilder('repayment')
      .innerJoin('repayment.loan', 'loan')
      .where('loan.companyId = :companyId', { companyId }); // Enforce company isolation
    
    // Apply filters
    if (filters?.loanId) {
      query.andWhere('repayment.loanId = :loanId', { loanId: filters.loanId });
    }
    
    if (filters?.repaymentType) {
      query.andWhere('repayment.repaymentType = :repaymentType', { repaymentType: filters.repaymentType });
    }
    
    if (filters?.fromDate) {
      query.andWhere('repayment.postingDate >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }
    
    if (filters?.toDate) {
      query.andWhere('repayment.postingDate <= :toDate', { toDate: new Date(filters.toDate) });
    }
    
    if (filters?.minAmount !== undefined) {
      query.andWhere('repayment.amountPaid >= :minAmount', { minAmount: filters.minAmount });
    }
    
    if (filters?.maxAmount !== undefined) {
      query.andWhere('repayment.amountPaid <= :maxAmount', { maxAmount: filters.maxAmount });
    }
    
    if (filters?.search) {
      query.andWhere(
        '(LOWER(repayment.referenceNumber) LIKE LOWER(:search) OR ' +
          'LOWER(repayment.modeOfPayment) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'postingDate';
    const sortOrder = filters?.sortOrder || 'DESC';
    const allowedSortFields = ['createdAt', 'postingDate', 'amountPaid', 'repaymentType'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'postingDate';
    query.orderBy(`repayment.${finalSortBy}`, sortOrder);

    // Get total count before pagination
    const total = await query.getCount();

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Execute query
    const data = await query.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async findOne(id: string, companyId: string): Promise<LoanRepayment> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const repayment = await this.repaymentRepository.findOne({
      where: { id },
      relations: ['loan'],
    });

    if (!repayment) {
      throw new NotFoundException(`Repayment with ID ${id} not found`);
    }

    // Verify repayment belongs to company via loan
    if (repayment.loan.companyId !== companyId) {
      throw new NotFoundException('Repayment not found or access denied');
    }

    return repayment;
  }

  async findByLoanId(loanId: string, companyId: string): Promise<LoanRepayment[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Verify loan belongs to company first
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found or access denied`);
    }

    return await this.repaymentRepository.find({ where: { loanId } });
  }

  async update(id: string, updateLoanRepaymentDto: UpdateLoanRepaymentDto, companyId: string): Promise<LoanRepayment> {
    const repayment = await this.findOne(id, companyId); // Verify company access
    Object.assign(repayment, updateLoanRepaymentDto);
    return await this.repaymentRepository.save(repayment);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const repayment = await this.findOne(id, companyId); // Verify company access
    await this.repaymentRepository.remove(repayment);
  }

  /**
   * Process bulk repayments
   * Creates multiple repayments in a single transaction
   * Implements bulk payment processing logic
   */
  async processBulkRepayment(
    bulkDto: BulkRepaymentDto,
    companyId: string,
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      loanId: string;
      success: boolean;
      repaymentId?: string;
      error?: string;
    }>;
  }> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Validate all loans exist and belong to company before processing
    const loanIds = bulkDto.repayments.map((r) => r.loanId);
    const uniqueLoanIds = [...new Set(loanIds)];
    
    const existingLoans = await this.loanRepository.find({
      where: { id: In(uniqueLoanIds), companyId }, // Enforce company isolation
    });

    const existingLoanIds = new Set(existingLoans.map((l) => l.id));
    const nonExistentLoans = uniqueLoanIds.filter(
      (id) => !existingLoanIds.has(id),
    );

    if (nonExistentLoans.length > 0) {
      throw new BadRequestException(
        `The following loans do not exist: ${nonExistentLoans.join(', ')}`,
      );
    }

    // Sort repayments by loan ID and value date (for consistency)
    const sortedRepayments = [...bulkDto.repayments].sort((a, b) => {
      if (a.loanId !== b.loanId) {
        return a.loanId.localeCompare(b.loanId);
      }
      return new Date(bulkDto.valueDate).getTime() - new Date(bulkDto.valueDate).getTime();
    });

    const results: Array<{
      loanId: string;
      success: boolean;
      repaymentId?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    // Process each repayment
    for (const item of sortedRepayments) {
      try {
        // Create repayment DTO from bulk item
        const repaymentDto: CreateLoanRepaymentDto = {
          loanId: item.loanId,
          postingDate: bulkDto.postingDate,
          valueDate: bulkDto.valueDate,
          amountPaid: item.amountPaid,
          principalPaid: item.principalPaid,
          interestPaid: item.interestPaid,
          penaltyPaid: item.penaltyPaid,
          chargesPaid: item.chargesPaid,
          repaymentType: item.repaymentType || RepaymentType.NORMAL_REPAYMENT,
          referenceNumber: bulkDto.referenceNumber,
          modeOfPayment: bulkDto.modeOfPayment,
        };

        // Create repayment
        const repayment = await this.create(repaymentDto, companyId);

        results.push({
          loanId: item.loanId,
          success: true,
          repaymentId: repayment.id,
        });
        successCount++;
      } catch (error) {
        results.push({
          loanId: item.loanId,
          success: false,
          error: error.message || 'Unknown error',
        });
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Create accounting entries for repayment
   * Helper method to extract parameters and call accounting service
   */
  private async createRepaymentAccountingEntries(
    savedRepayment: LoanRepayment,
    loan: Loan,
    loanProduct: LoanProduct,
  ): Promise<void> {
    if (!this.accountingService || !loanProduct) {
      return;
    }

    const postingDate = new Date(savedRepayment.postingDate);
    const valueDate = savedRepayment.valueDate
      ? new Date(savedRepayment.valueDate)
      : postingDate;

    await this.accountingService.createRepaymentEntries(
      savedRepayment.loanId,
      savedRepayment.id,
      loan.companyId,
      postingDate,
      valueDate,
      loanProduct.paymentAccount,
      loanProduct.loanAccount,
      savedRepayment.principalPaid || 0,
      savedRepayment.interestPaid || 0,
      savedRepayment.penaltyPaid || 0,
      loanProduct.interestReceivableAccount,
      loanProduct.penaltyReceivableAccount,
      loan.applicantType,
      loan.applicantId,
      loan.costCenter,
      savedRepayment.repaymentType,
    );
  }
}

