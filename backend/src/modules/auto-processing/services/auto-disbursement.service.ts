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
  AutoDisbursementRequestDto,
  AutoDisbursementResultDto,
  DisbursementStatus,
  DisbursementMethod,
  AccountVerificationStatus,
} from '../dto/auto-disbursement.dto';
import { AutoDisbursement } from '../entities/auto-disbursement.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanDisbursementService } from '../../loan-disbursement/loan-disbursement.service';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import axios from 'axios';

const MAX_DISBURSEMENT_ATTEMPTS = 3;
const DISBURSEMENT_SLA_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AutoDisbursementService {
  private readonly logger = new Logger(AutoDisbursementService.name);
  private readonly accountVerificationApiUrl?: string;
  private readonly disbursementApiUrl?: string;

  constructor(
    @InjectRepository(AutoDisbursement)
    private readonly autoDisbursementRepository: Repository<AutoDisbursement>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly loanDisbursementService: LoanDisbursementService,
    private readonly configService: ConfigService,
  ) {
    this.accountVerificationApiUrl = this.configService.get('ACCOUNT_VERIFICATION_API_URL');
    this.disbursementApiUrl = this.configService.get('DISBURSEMENT_API_URL');
  }

  /**
   * Trigger auto-disbursement immediately upon auto-approval
   */
  async triggerAutoDisbursement(
    dto: AutoDisbursementRequestDto,
    companyId: string,
    approvalTimestamp: Date,
  ): Promise<AutoDisbursementResultDto> {
    const startTime = Date.now();
    this.logger.log(`Triggering auto-disbursement for loan ${dto.loanId}`);

    // Get loan
    const loan = await this.loanRepository.findOne({
      where: { id: dto.loanId, companyId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan ${dto.loanId} not found`);
    }

    // Verify loan is approved (SANCTIONED status means approved)
    if (loan.status !== LoanStatus.SANCTIONED) {
      throw new BadRequestException(
        `Loan must be sanctioned to disburse. Current status: ${loan.status}`,
      );
    }

    // Create auto-disbursement record
    const autoDisbursement = this.autoDisbursementRepository.create({
      loanId: dto.loanId,
      status: DisbursementStatus.PENDING,
      method: dto.accountDetails.method,
      accountVerificationStatus: AccountVerificationStatus.PENDING,
      amount: dto.amount || loan.loanAmount,
      accountDetails: dto.accountDetails,
      attemptCount: 0,
      attempts: [],
    });

    const saved = await this.autoDisbursementRepository.save(autoDisbursement);

    try {
      // Step 1: Verify account ownership
      if (!dto.skipVerification) {
        saved.status = DisbursementStatus.VERIFYING;
        saved.accountVerificationStatus = AccountVerificationStatus.PENDING;
        await this.autoDisbursementRepository.save(saved);

        const verificationResult = await this.verifyAccountOwnership(dto.accountDetails);

        if (!verificationResult.verified) {
          saved.status = DisbursementStatus.HELD_FOR_REVIEW;
          saved.accountVerificationStatus = AccountVerificationStatus.FAILED;
          saved.failureReason = verificationResult.reason;
          saved.failedAt = new Date();
          await this.autoDisbursementRepository.save(saved);

          // Add to manual review queue
          await this.addToManualReviewQueue(
            dto.loanId,
            'AUTO_DISBURSEMENT',
            ['ACCOUNT_VERIFICATION_FAILED'],
            'HIGH',
          );

          return this.mapToResultDto(saved, startTime);
        }

        saved.accountVerificationStatus = AccountVerificationStatus.VERIFIED;
      } else {
        saved.accountVerificationStatus = AccountVerificationStatus.VERIFIED;
      }

      // Step 2: Process disbursement with retry logic
      saved.status = DisbursementStatus.PROCESSING;
      await this.autoDisbursementRepository.save(saved);

      let success = false;
      let lastError: string | undefined;

      for (let attempt = 1; attempt <= MAX_DISBURSEMENT_ATTEMPTS; attempt++) {
        saved.attemptCount = attempt;
        const attemptStartTime = Date.now();

        try {
          const disbursementResult = await this.processDisbursement(
            loan,
            dto.accountDetails,
            saved.amount,
            companyId,
          );

          saved.attempts.push({
            attemptNumber: attempt,
            timestamp: new Date(),
            success: true,
            externalReference: disbursementResult.externalReference,
          });

          saved.status = DisbursementStatus.COMPLETED;
          saved.externalReference = disbursementResult.externalReference;
          saved.completedAt = new Date();
          success = true;
          break;
        } catch (error: any) {
          lastError = error.message;
          saved.attempts.push({
            attemptNumber: attempt,
            timestamp: new Date(),
            success: false,
            errorMessage: error.message,
          });

          this.logger.warn(
            `Disbursement attempt ${attempt} failed for loan ${dto.loanId}: ${error.message}`,
          );

          // Wait before retry (exponential backoff)
          if (attempt < MAX_DISBURSEMENT_ATTEMPTS) {
            const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            await this.sleep(backoffMs);
          }
        }
      }

      if (!success) {
        // After 2 failed attempts, add to manual review queue
        if (saved.attemptCount >= 2) {
          saved.status = DisbursementStatus.HELD_FOR_REVIEW;
          saved.failureReason = `Failed after ${saved.attemptCount} attempts: ${lastError}`;
          saved.failedAt = new Date();

          await this.addToManualReviewQueue(
            dto.loanId,
            'AUTO_DISBURSEMENT',
            ['DISBURSEMENT_FAILED'],
            'HIGH',
          );
        } else {
          saved.status = DisbursementStatus.FAILED;
          saved.failureReason = lastError;
          saved.failedAt = new Date();
        }
      }

      saved.processingTimeMs = Date.now() - startTime;
      await this.autoDisbursementRepository.save(saved);

      // Check SLA compliance
      if (saved.processingTimeMs > DISBURSEMENT_SLA_MS) {
        this.logger.warn(
          `Disbursement SLA violated: ${saved.processingTimeMs}ms > ${DISBURSEMENT_SLA_MS}ms`,
        );
      }

      return this.mapToResultDto(saved, startTime);
    } catch (error: any) {
      this.logger.error(`Auto-disbursement failed: ${error.message}`, error.stack);
      saved.status = DisbursementStatus.FAILED;
      saved.failureReason = error.message;
      saved.failedAt = new Date();
      saved.processingTimeMs = Date.now() - startTime;
      await this.autoDisbursementRepository.save(saved);
      throw error;
    }
  }

  /**
   * Verify account ownership before first disbursement
   */
  private async verifyAccountOwnership(accountDetails: {
    accountNumber: string;
    accountHolderName: string;
    method: DisbursementMethod;
    bankName?: string;
    bankCode?: string;
  }): Promise<{ verified: boolean; reason?: string }> {
    try {
      if (this.accountVerificationApiUrl) {
        // Call external verification API
        const response = await axios.post(
          `${this.accountVerificationApiUrl}/verify`,
          {
            accountNumber: accountDetails.accountNumber,
            accountHolderName: accountDetails.accountHolderName,
            method: accountDetails.method,
            bankName: accountDetails.bankName,
            bankCode: accountDetails.bankCode,
          },
          { timeout: 10000 },
        );

        return {
          verified: response.data.verified === true,
          reason: response.data.reason,
        };
      } else {
        // Simulate verification for development
        // In production, this should always call the real API
        this.logger.warn('Account verification API not configured, using simulation');
        
        // Simulate: Check if account number matches expected format
        const isValidFormat = /^[0-9]{8,}$/.test(accountDetails.accountNumber);
        if (!isValidFormat) {
          return {
            verified: false,
            reason: 'Invalid account number format',
          };
        }

        // Simulate: Check if name matches (case-insensitive)
        const nameMatch = accountDetails.accountHolderName
          .toLowerCase()
          .includes(accountDetails.accountNumber.slice(-4).toLowerCase());
        if (!nameMatch && accountDetails.method === DisbursementMethod.BANK_TRANSFER) {
          return {
            verified: false,
            reason: 'Account holder name does not match account number',
          };
        }

        return { verified: true };
      }
    } catch (error: any) {
      this.logger.error(`Account verification failed: ${error.message}`);
      return {
        verified: false,
        reason: `Verification service error: ${error.message}`,
      };
    }
  }

  /**
   * Process disbursement via payment method
   */
  private async processDisbursement(
    loan: Loan,
    accountDetails: {
      accountNumber: string;
      accountHolderName: string;
      method: DisbursementMethod;
      bankName?: string;
      bankCode?: string;
    },
    amount: number,
    companyId: string,
  ): Promise<{ externalReference: string }> {
    try {
      if (this.disbursementApiUrl) {
        // Call external disbursement API
        const response = await axios.post(
          `${this.disbursementApiUrl}/disburse`,
          {
            loanId: loan.id,
            amount,
            accountNumber: accountDetails.accountNumber,
            accountHolderName: accountDetails.accountHolderName,
            method: accountDetails.method,
            bankName: accountDetails.bankName,
            bankCode: accountDetails.bankCode,
          },
          { timeout: 30000 },
        );

        // Create disbursement record in system
        await this.loanDisbursementService.create({
          loanId: loan.id,
          disbursementDate: new Date().toISOString().split('T')[0], // Convert to ISO date string
          disbursedAmount: amount,
          modeOfPayment: accountDetails.method,
          referenceNumber: response.data.transactionReference,
        });

        return {
          externalReference: response.data.transactionReference,
        };
      } else {
        // Simulate disbursement for development
        this.logger.warn('Disbursement API not configured, using simulation');

        // Create disbursement record
        await this.loanDisbursementService.create({
          loanId: loan.id,
          disbursementDate: new Date().toISOString().split('T')[0], // Convert to ISO date string
          disbursedAmount: amount,
          modeOfPayment: accountDetails.method,
          referenceNumber: `DISB-${loan.id}-${Date.now()}`,
        });

        // Simulate processing delay
        await this.sleep(500);

        return {
          externalReference: `SIM-${loan.id}-${Date.now()}`,
        };
      }
    } catch (error: any) {
      this.logger.error(`Disbursement processing failed: ${error.message}`);
      throw new BadRequestException(`Disbursement failed: ${error.message}`);
    }
  }

  /**
   * Add to manual review queue
   */
  private async addToManualReviewQueue(
    entityId: string,
    processingType: string,
    triggers: string[],
    priority: string,
  ): Promise<void> {
    // This will be implemented via STPTrackingService when module is set up
    this.logger.log(
      `Adding ${entityId} to manual review queue: ${triggers.join(', ')}`,
    );
  }

  /**
   * Map entity to DTO
   */
  private mapToResultDto(
    entity: AutoDisbursement,
    startTime: number,
  ): AutoDisbursementResultDto {
    return {
      id: entity.id,
      loanId: entity.loanId,
      status: entity.status,
      accountVerificationStatus: entity.accountVerificationStatus,
      method: entity.method,
      amount: entity.amount,
      processingTimeMs: entity.processingTimeMs || Date.now() - startTime,
      attemptCount: entity.attemptCount,
      attempts: entity.attempts || [],
      externalReference: entity.externalReference,
      failureReason: entity.failureReason,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

