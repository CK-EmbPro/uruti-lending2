import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { WeightedCreditScoringService } from './weighted-credit-scoring.service';
import { ScoringTrigger } from '../entities/credit-score-history.entity';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

/**
 * Service to listen for events and trigger automatic rescoring
 * Handles payment, transaction, and other events that should trigger score updates
 */
@Injectable()
export class ScoringEventListenerService {
  private readonly logger = new Logger(ScoringEventListenerService.name);

  constructor(
    private readonly weightedScoringService: WeightedCreditScoringService,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Listen for payment received events
   * Triggers rescoring when a payment is processed
   */
  @OnEvent('payment.received')
  async handlePaymentReceived(payload: {
    loanId: string;
    applicantId: string;
    amount: number;
    companyId: string;
    repaymentId?: string;
  }) {
    this.logger.log(`Payment received event for loan ${payload.loanId}, triggering rescoring`);

    try {
      // Get loan to determine segment
      const loan = await this.loanRepository.findOne({
        where: { id: payload.loanId },
      });

      if (!loan) {
        this.logger.warn(`Loan ${payload.loanId} not found, skipping rescoring`);
        return;
      }

      // Determine segment based on loan amount
      const segment = this.determineSegment(loan.loanAmount);

      // Prepare scoring request (minimal data, will use existing data)
      const scoringRequest = {
        applicantId: payload.applicantId,
        // Note: applicationId not stored on Loan entity
        // Note: In production, you might want to fetch latest data here
        // For now, we'll use existing data and let the scoring service pull what it needs
      };

      // Trigger rescoring with PAYMENT_RECEIVED trigger
      await this.weightedScoringService.calculateWeightedScore(
        scoringRequest,
        payload.companyId,
        true, // useML
        segment,
        ScoringTrigger.PAYMENT_RECEIVED,
        {
          loanId: payload.loanId,
          repaymentId: payload.repaymentId,
          paymentAmount: payload.amount,
          timestamp: new Date().toISOString(),
        },
      );

      this.logger.log(`Rescoring completed for loan ${payload.loanId} after payment`);
    } catch (error) {
      this.logger.error(`Failed to rescore after payment: ${error.message}`, error.stack);
    }
  }

  /**
   * Listen for transaction processed events
   * Triggers rescoring when a significant transaction is processed
   */
  @OnEvent('transaction.processed')
  async handleTransactionProcessed(payload: {
    applicantId: string;
    transactionId: string;
    amount: number;
    companyId: string;
    applicationId?: string;
    loanId?: string;
  }) {
    this.logger.log(`Transaction processed event for applicant ${payload.applicantId}, triggering rescoring`);

    try {
      // Determine segment if we have loan/application info
      let segment: 'MICRO' | 'SME' | 'ENTERPRISE' = 'SME';

      if (payload.loanId) {
        const loan = await this.loanRepository.findOne({
          where: { id: payload.loanId },
        });
        if (loan) {
          segment = this.determineSegment(loan.loanAmount);
        }
      } else if (payload.applicationId) {
        const application = await this.applicationRepository.findOne({
          where: { id: payload.applicationId },
        });
        if (application) {
          segment = this.determineSegment(application.requestedAmount);
        }
      }

      const scoringRequest = {
        applicantId: payload.applicantId,
        applicationId: payload.applicationId,
      };

      // Only rescore for significant transactions (configurable threshold)
      const significantThreshold = 1000; // $1000 or more
      if (Math.abs(payload.amount) >= significantThreshold) {
        await this.weightedScoringService.calculateWeightedScore(
          scoringRequest,
          payload.companyId,
          true,
          segment,
          ScoringTrigger.TRANSACTION_PROCESSED,
          {
            transactionId: payload.transactionId,
            transactionAmount: payload.amount,
            timestamp: new Date().toISOString(),
          },
        );

        this.logger.log(`Rescoring completed for applicant ${payload.applicantId} after transaction`);
      } else {
        this.logger.debug(`Transaction amount ${payload.amount} below threshold, skipping rescoring`);
      }
    } catch (error) {
      this.logger.error(`Failed to rescore after transaction: ${error.message}`, error.stack);
    }
  }

  /**
   * Listen for external data update events
   * Triggers rescoring when external data (credit bureau, bank data, etc.) is updated
   */
  @OnEvent('external.data.updated')
  async handleExternalDataUpdated(payload: {
    applicantId: string;
    dataSource: string;
    companyId: string;
    applicationId?: string;
    loanId?: string;
    data?: any;
  }) {
    this.logger.log(`External data updated event for applicant ${payload.applicantId} from ${payload.dataSource}`);

    try {
      let segment: 'MICRO' | 'SME' | 'ENTERPRISE' = 'SME';

      if (payload.loanId) {
        const loan = await this.loanRepository.findOne({
          where: { id: payload.loanId },
        });
        if (loan) {
          segment = this.determineSegment(loan.loanAmount);
        }
      } else if (payload.applicationId) {
        const application = await this.applicationRepository.findOne({
          where: { id: payload.applicationId },
        });
        if (application) {
          segment = this.determineSegment(application.requestedAmount);
        }
      }

      const scoringRequest = {
        applicantId: payload.applicantId,
        applicationId: payload.applicationId,
        // Include updated data if provided
        creditBureauData: payload.dataSource === 'credit_bureau' ? payload.data : undefined,
        bankAccountData: payload.dataSource === 'bank_account' ? payload.data : undefined,
      };

      await this.weightedScoringService.calculateWeightedScore(
        scoringRequest,
        payload.companyId,
        true,
        segment,
        ScoringTrigger.EXTERNAL_DATA_UPDATE,
        {
          dataSource: payload.dataSource,
          timestamp: new Date().toISOString(),
        },
      );

      this.logger.log(`Rescoring completed for applicant ${payload.applicantId} after external data update`);
    } catch (error) {
      this.logger.error(`Failed to rescore after external data update: ${error.message}`, error.stack);
    }
  }

  /**
   * Determine segment based on amount
   */
  private determineSegment(amount: number): 'MICRO' | 'SME' | 'ENTERPRISE' {
    if (amount < 10000) {
      return 'MICRO';
    } else if (amount < 100000) {
      return 'SME';
    } else {
      return 'ENTERPRISE';
    }
  }
}

