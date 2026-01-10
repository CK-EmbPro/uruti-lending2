import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  AutoRepaymentRequestDto,
  AutoRepaymentResultDto,
  RepaymentMethod,
  PaymentScenario,
  ReconciliationStatus,
  ReconciliationResultDto,
} from '../dto/auto-repayment.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentService } from '../../loan-repayment/loan-repayment.service';
import { RepaymentType } from '../../../common/enums/repayment-type.enum';
import axios from 'axios';

const RECONCILIATION_SLA_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AutoRepaymentCaptureService {
  private readonly logger = new Logger(AutoRepaymentCaptureService.name);
  private readonly paymentApiUrl?: string;
  private readonly reconciliationApiUrl?: string;

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly loanRepaymentService: LoanRepaymentService,
    private readonly configService: ConfigService,
  ) {
    this.paymentApiUrl = this.configService.get('PAYMENT_API_URL');
    this.reconciliationApiUrl = this.configService.get('RECONCILIATION_API_URL');
  }

  /**
   * Capture repayment automatically
   */
  async captureAutoRepayment(
    dto: AutoRepaymentRequestDto,
    companyId: string,
  ): Promise<AutoRepaymentResultDto> {
    this.logger.log(`Capturing auto-repayment for loan ${dto.loanId}`);

    // Get loan
    const loan = await this.loanRepository.findOne({
      where: { id: dto.loanId, companyId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${dto.loanId} not found`);
    }

    // Determine payment scenario
    const scenario = this.determinePaymentScenario(loan, dto.amount);

    // Process payment based on method
    let repaymentId: string;
    let reconciliation: ReconciliationResultDto;

    switch (dto.paymentDetails.method) {
      case RepaymentMethod.DIRECT_DEBIT:
      case RepaymentMethod.MOBILE_MONEY_AUTO_DEBIT:
      case RepaymentMethod.CARD_AUTO_CHARGE:
        repaymentId = await this.processPrimaryMethod(loan, dto, companyId);
        break;

      case RepaymentMethod.MANUAL_TRANSFER:
        repaymentId = await this.processManualTransfer(loan, dto, companyId);
        break;

      default:
        throw new BadRequestException(`Unsupported payment method: ${dto.paymentDetails.method}`);
    }

    // Auto-reconcile payment
    reconciliation = await this.autoReconcilePayment(
      dto.loanId,
      repaymentId,
      dto.paymentDetails,
    );

    return {
      id: repaymentId,
      loanId: dto.loanId,
      amount: dto.amount,
      scenario,
      method: dto.paymentDetails.method,
      reconciliation,
      createdAt: new Date(),
    };
  }

  /**
   * Process primary payment methods (direct debit, mobile money, card)
   */
  private async processPrimaryMethod(
    loan: Loan,
    dto: AutoRepaymentRequestDto,
    companyId: string,
  ): Promise<string> {
    try {
      if (this.paymentApiUrl) {
        // Call external payment API
        const response = await axios.post(
          `${this.paymentApiUrl}/charge`,
          {
            loanId: loan.id,
            amount: dto.amount,
            method: dto.paymentDetails.method,
            accountNumber: dto.paymentDetails.accountNumber,
          },
          { timeout: 30000 },
        );

        // Create repayment record
        const repayment = await this.loanRepaymentService.create(
          {
            loanId: loan.id,
            postingDate: dto.paymentDate || new Date().toISOString().split('T')[0], // Convert to ISO date string
            amountPaid: dto.amount,
            repaymentType: RepaymentType.NORMAL_REPAYMENT,
            modeOfPayment: dto.paymentDetails.method,
            referenceNumber: response.data.transactionReference,
          },
          companyId,
        );

        return repayment.id;
      } else {
        // Simulate payment for development
        this.logger.warn('Payment API not configured, using simulation');

        const repayment = await this.loanRepaymentService.create(
          {
            loanId: loan.id,
            postingDate: dto.paymentDate || new Date().toISOString().split('T')[0], // Convert to ISO date string
            amountPaid: dto.amount,
            repaymentType: RepaymentType.NORMAL_REPAYMENT,
            modeOfPayment: dto.paymentDetails.method,
            referenceNumber: `PAY-${loan.id}-${Date.now()}`,
          },
          companyId,
        );

        return repayment.id;
      }
    } catch (error: any) {
      this.logger.error(`Primary payment method failed: ${error.message}`);
      throw new BadRequestException(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Process manual transfer with reference number
   */
  private async processManualTransfer(
    loan: Loan,
    dto: AutoRepaymentRequestDto,
    companyId: string,
  ): Promise<string> {
    if (!dto.paymentDetails.referenceNumber) {
      throw new BadRequestException('Reference number is required for manual transfers');
    }

    // Create repayment record with reference number
    const repayment = await this.loanRepaymentService.create(
      {
        loanId: loan.id,
        postingDate: dto.paymentDate || new Date().toISOString().split('T')[0], // Convert to ISO date string
        amountPaid: dto.amount,
        repaymentType: RepaymentType.NORMAL_REPAYMENT,
        modeOfPayment: RepaymentMethod.MANUAL_TRANSFER,
        referenceNumber: dto.paymentDetails.referenceNumber,
      },
      companyId,
    );

    return repayment.id;
  }

  /**
   * Determine payment scenario (exact, partial, over, under)
   */
  private determinePaymentScenario(loan: Loan, paymentAmount: number): PaymentScenario {
    // Calculate amount due (simplified - would use actual calculation service)
    const outstandingBalance = loan.loanAmount - (loan.totalPrincipalPaid || 0);
    const interestDue = (loan.totalInterestPaid || 0) * 0.1; // Simplified
    const totalDue = outstandingBalance + interestDue;

    const tolerance = 0.01; // Allow small rounding differences

    if (Math.abs(paymentAmount - totalDue) < tolerance) {
      return PaymentScenario.EXACT;
    } else if (paymentAmount < totalDue) {
      return PaymentScenario.UNDER;
    } else if (paymentAmount > totalDue * 1.1) {
      return PaymentScenario.OVER;
    } else {
      return PaymentScenario.PARTIAL;
    }
  }

  /**
   * Auto-reconcile payment within 1 hour
   */
  private async autoReconcilePayment(
    loanId: string,
    repaymentId: string,
    paymentDetails: {
      method: RepaymentMethod;
      referenceNumber?: string;
      externalTransactionId?: string;
    },
  ): Promise<ReconciliationResultDto> {
    const startTime = Date.now();

    try {
      if (this.reconciliationApiUrl) {
        // Call external reconciliation API
        const response = await axios.post(
          `${this.reconciliationApiUrl}/reconcile`,
          {
            loanId,
            repaymentId,
            referenceNumber: paymentDetails.referenceNumber,
            externalTransactionId: paymentDetails.externalTransactionId,
          },
          { timeout: 10000 },
        );

        const reconciliationTimeMs = Date.now() - startTime;

        return {
          status: response.data.matched
            ? ReconciliationStatus.MATCHED
            : ReconciliationStatus.UNMATCHED,
          reconciliationTimeMs,
          matchedRepaymentId: response.data.matchedRepaymentId,
          reconciledAt: new Date(),
        };
      } else {
        // Simulate reconciliation for development
        // In production, this would match against bank statements or payment gateway records
        await this.sleep(100); // Simulate processing time

        const reconciliationTimeMs = Date.now() - startTime;

        // Simulate: Match if reference number exists
        const matched = !!paymentDetails.referenceNumber;

        return {
          status: matched
            ? ReconciliationStatus.MATCHED
            : ReconciliationStatus.PENDING,
          reconciliationTimeMs,
          matchedRepaymentId: matched ? repaymentId : undefined,
          reconciledAt: matched ? new Date() : undefined,
        };
      }
    } catch (error: any) {
      this.logger.error(`Reconciliation failed: ${error.message}`);
      return {
        status: ReconciliationStatus.FAILED,
        reconciliationTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

