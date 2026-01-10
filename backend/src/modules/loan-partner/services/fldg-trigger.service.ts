import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanPartnerService } from '../loan-partner.service';
import { Loan } from '../../loan/entities/loan.entity';
import { AccountingService } from '../../accounting/accounting.service';
import { FldgLimitCalculationComponent } from '../entities/loan-partner.entity';

/**
 * Service for handling FLDG (First Loss Default Guarantee) triggers
 */
@Injectable()
export class FldgTriggerService {
  constructor(
    private readonly loanPartnerService: LoanPartnerService,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly accountingService: AccountingService,
  ) {}

  /**
   * Check and trigger FLDG if conditions are met
   */
  async checkAndTriggerFldg(loanId: string): Promise<{
    triggered: boolean;
    fldgAmount?: number;
    message?: string;
  }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new BadRequestException(`Loan with ID ${loanId} not found`);
    }

    if (!loan.loanPartnerId) {
      return {
        triggered: false,
        message: 'Loan does not have a partner',
      };
    }

    if (loan.fldgTriggered) {
      return {
        triggered: false,
        message: 'FLDG has already been triggered for this loan',
      };
    }

    // Check if FLDG should be triggered based on DPD
    const shouldTrigger = await this.loanPartnerService.shouldTriggerFldg(
      loan.loanPartnerId,
      loan.daysPastDue || 0,
    );

    if (!shouldTrigger) {
      return {
        triggered: false,
        message: `FLDG trigger condition not met. DPD: ${loan.daysPastDue}, Required: ${(await this.loanPartnerService.findOne(loan.loanPartnerId)).fldgTriggerDpd}`,
      };
    }

    // Calculate FLDG limit amount
    const partner = await this.loanPartnerService.findOne(loan.loanPartnerId);
    let baseAmount = 0;

    if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.DISBURSEMENT
    ) {
      baseAmount = loan.disbursedAmount || 0;
    } else if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.OUTSTANDING_PRINCIPAL
    ) {
      // Calculate outstanding principal
      baseAmount =
        (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    } else if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.OUTSTANDING_PRINCIPAL_AND_INTEREST
    ) {
      // Calculate outstanding principal + interest
      baseAmount =
        (loan.loanAmount || 0) -
        (loan.totalPrincipalPaid || 0) +
        (loan.totalInterestPayable || 0) -
        (loan.totalInterestPaid || 0);
    }

    const fldgAmount = await this.loanPartnerService.calculateFldgLimit(
      loan.loanPartnerId,
      baseAmount,
    );

    if (fldgAmount <= 0) {
      return {
        triggered: false,
        message: 'FLDG amount is zero or negative',
      };
    }

    // Update loan with FLDG trigger
    loan.fldgTriggered = true;
    loan.fldgTriggerDate = new Date();
    await this.loanRepository.save(loan);

    // Create FLDG accounting entries
    if (partner.enablePartnerAccounting && partner.fldgAccount) {
      await this.createFldgJournalEntry(loan, partner, fldgAmount);
    }

    return {
      triggered: true,
      fldgAmount,
      message: `FLDG triggered successfully. Amount: ${fldgAmount}`,
    };
  }

  /**
   * Create FLDG journal entry
   */
  private async createFldgJournalEntry(
    loan: Loan,
    partner: any,
    fldgAmount: number,
  ): Promise<void> {
    if (!partner.payableAccount || !partner.fldgAccount) {
      throw new BadRequestException(
        'Partner payable account or FLDG account not configured',
      );
    }

    await this.accountingService.createSimpleJournalEntry(
      new Date(),
      new Date(),
      loan.companyId,
      loan.id,
      fldgAmount,
      partner.fldgAccount,
      partner.payableAccount,
      `FLDG invocation for loan ${loan.loanNumber}`,
    );
  }

  /**
   * Manually trigger FLDG for a loan
   */
  async manualTriggerFldg(loanId: string): Promise<{
    triggered: boolean;
    fldgAmount?: number;
    message?: string;
  }> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new BadRequestException(`Loan with ID ${loanId} not found`);
    }

    if (!loan.loanPartnerId) {
      throw new BadRequestException('Loan does not have a partner');
    }

    if (loan.fldgTriggered) {
      throw new BadRequestException('FLDG has already been triggered');
    }

    // Calculate FLDG limit amount
    const partner = await this.loanPartnerService.findOne(loan.loanPartnerId);
    let baseAmount = 0;

    if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.DISBURSEMENT
    ) {
      baseAmount = loan.disbursedAmount || 0;
    } else if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.OUTSTANDING_PRINCIPAL
    ) {
      baseAmount =
        (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    } else if (
      partner.fldgLimitCalculationComponent ===
      FldgLimitCalculationComponent.OUTSTANDING_PRINCIPAL_AND_INTEREST
    ) {
      baseAmount =
        (loan.loanAmount || 0) -
        (loan.totalPrincipalPaid || 0) +
        (loan.totalInterestPayable || 0) -
        (loan.totalInterestPaid || 0);
    }

    const fldgAmount = await this.loanPartnerService.calculateFldgLimit(
      loan.loanPartnerId,
      baseAmount,
    );

    // Update loan with FLDG trigger
    loan.fldgTriggered = true;
    loan.fldgTriggerDate = new Date();
    await this.loanRepository.save(loan);

    // Create FLDG accounting entries
    if (partner.enablePartnerAccounting && partner.fldgAccount) {
      await this.createFldgJournalEntry(loan, partner, fldgAmount);
    }

    return {
      triggered: true,
      fldgAmount,
      message: `FLDG manually triggered. Amount: ${fldgAmount}`,
    };
  }
}

