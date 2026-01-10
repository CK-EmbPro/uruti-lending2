import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DecisionProgress } from '../entities/decision-progress.entity';
import {
  InitiateFastDecisionDto,
  FastDecisionResultDto,
  DecisionStep,
  DecisionStatus,
  StepStatus,
  StepDetailDto,
} from '../dto/fast-decision.dto';
import { AIDocumentProcessorService } from '../../ai/services/ai-document-processor.service';
import { InstantKYCAMLService } from '../../compliance/services/instant-kyc-aml.service';
import { WeightedCreditScoringService } from '../../credit-scoring-engine/services/weighted-credit-scoring.service';
import { LoanApplicationService } from '../../loan-application/loan-application.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationGateway } from '../../notification/gateways/notification.gateway';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { AutoApprovalService } from '../../credit-assessment/services/auto-approval.service';

// SLA Targets in milliseconds
const SLA_TARGETS = {
  DOCUMENT_VERIFICATION: 30 * 1000, // 30 seconds
  KYC_AML: 45 * 1000, // 45 seconds
  SCORING: 2 * 1000, // 2 seconds
  APPROVAL: 15 * 1000, // 15 seconds
  TOTAL: 10 * 60 * 1000, // 10 minutes
};

@Injectable()
export class FastDecisionService {
  private readonly logger = new Logger(FastDecisionService.name);

  constructor(
    @InjectRepository(DecisionProgress)
    private readonly progressRepository: Repository<DecisionProgress>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly documentProcessor: AIDocumentProcessorService,
    private readonly kycAmlService: InstantKYCAMLService,
    private readonly scoringService: WeightedCreditScoringService,
    private readonly loanApplicationService: LoanApplicationService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly configService: ConfigService,
    private readonly autoApprovalService: AutoApprovalService,
  ) {}

  /**
   * Initiate fast decision process
   */
  async initiateFastDecision(
    dto: InitiateFastDecisionDto,
    companyId: string,
    userId?: string,
  ): Promise<DecisionProgress> {
    this.logger.log(`Initiating fast decision for application ${dto.applicationId}`);

    // Check if application exists
    const application = await this.loanApplicationService.findOne(
      dto.applicationId,
      companyId,
    );

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    // Create progress record
    const progress = this.progressRepository.create({
      applicationId: dto.applicationId,
      currentStep: DecisionStep.DOCUMENT_VERIFICATION,
      status: DecisionStatus.IN_PROGRESS,
      progressPercentage: 0,
      elapsedTime: 0,
      estimatedTimeRemaining: SLA_TARGETS.TOTAL,
      steps: this.initializeSteps(dto),
      slaCompliant: true,
      slaViolations: [],
      totalSlaTarget: SLA_TARGETS.TOTAL,
      startedAt: new Date(),
    });

    const savedProgress = await this.progressRepository.save(progress);

    // Send initial notification
    await this.sendProgressNotification(
      application.applicantId || '',
      dto.applicationId,
      'Fast decision process started',
      savedProgress,
    );

    // Start processing asynchronously
    this.processFastDecision(savedProgress.id, dto, companyId, userId).catch(
      (error) => {
        this.logger.error(`Fast decision processing failed: ${error.message}`, error.stack);
      },
    );

    return savedProgress;
  }

  /**
   * Process fast decision steps
   */
  private async processFastDecision(
    progressId: string,
    dto: InitiateFastDecisionDto,
    companyId: string,
    userId?: string,
  ): Promise<void> {
    const progress = await this.progressRepository.findOne({
      where: { id: progressId },
    });

    if (!progress) {
      throw new NotFoundException(`Progress ${progressId} not found`);
    }

    const startTime = Date.now();
    const application = await this.loanApplicationService.findOne(
      dto.applicationId,
      companyId,
    );

    try {
      // Step 1: Document Verification
      if (!dto.skipDocumentVerification) {
        await this.executeStep(
          progress,
          DecisionStep.DOCUMENT_VERIFICATION,
          SLA_TARGETS.DOCUMENT_VERIFICATION,
          async () => {
            // Find documents for this application
            // In production, integrate with document service
            this.logger.log(`Document verification for ${dto.applicationId}`);
            // For now, simulate
            return { verified: true, score: 0.95 };
          },
        );
      } else {
        await this.skipStep(progress, DecisionStep.DOCUMENT_VERIFICATION);
      }

      // Step 2: KYC/AML Checks
      if (!dto.skipKYCAML) {
        await this.executeStep(
          progress,
          DecisionStep.KYC_AML,
          SLA_TARGETS.KYC_AML,
          async () => {
            const kycResult = await this.kycAmlService.performInstantChecks({
              applicationId: dto.applicationId,
            });
            return kycResult;
          },
        );
      } else {
        await this.skipStep(progress, DecisionStep.KYC_AML);
      }

      // Step 3: Credit Scoring
      await this.executeStep(
        progress,
        DecisionStep.SCORING,
        SLA_TARGETS.SCORING,
        async () => {
          const scoringResult = await this.scoringService.calculateWeightedScore(
            {
              applicantId: application.applicantId || '',
            },
            companyId,
            true,
          );
          return scoringResult;
        },
      );

      // Step 4: Approval Decision (using Auto-Approval Service)
      await this.executeStep(
        progress,
        DecisionStep.APPROVAL,
        SLA_TARGETS.APPROVAL,
        async () => {
          // Use auto-approval service to evaluate eligibility
          const autoApprovalResult = await this.autoApprovalService.evaluateAutoApproval(
            {
              applicationId: dto.applicationId,
            },
            companyId,
          );

          let approved = false;
          let approvedAmount = 0;
          let approvedInterestRate = 0;
          let conditions: string[] | undefined;

          // Check if eligible for auto-approval
          if (
            autoApprovalResult.status === 'ELIGIBLE' ||
            autoApprovalResult.status === 'CONDITIONAL'
          ) {
            approved = true;
            approvedAmount = autoApprovalResult.approvedAmount || 0;
            approvedInterestRate = autoApprovalResult.approvedInterestRate || 0;
            conditions = autoApprovalResult.conditions;

            // Execute auto-approval (create credit decision)
            try {
              await this.autoApprovalService.executeAutoApproval(
                {
                  applicationId: dto.applicationId,
                },
                companyId,
                userId,
              );

              // Approve application
              await this.loanApplicationService.approve(
                dto.applicationId,
                companyId,
                userId,
                undefined,
                autoApprovalResult.rationale,
                true,
              );
            } catch (error) {
              this.logger.error(`Auto-approval execution failed: ${error.message}`);
              approved = false;
            }
          } else {
            // Manual review required
            approved = false;
          }

          return {
            approved,
            approvedAmount,
            approvedInterestRate,
            conditions,
            riskLevel: autoApprovalResult.riskLevel,
            status: autoApprovalResult.status,
            rationale: autoApprovalResult.rationale,
            requiresManualReview: !approved,
            criteriaChecks: autoApprovalResult.criteriaChecks,
          };
        },
      );

      // Mark as completed
      progress.status = DecisionStatus.COMPLETED;
      progress.currentStep = DecisionStep.COMPLETED;
      progress.progressPercentage = 100;
      progress.completedAt = new Date();
      progress.elapsedTime = Date.now() - startTime;

      // Check SLA compliance
      const totalTime = progress.elapsedTime;
      progress.slaCompliant = totalTime <= SLA_TARGETS.TOTAL;
      if (!progress.slaCompliant) {
        progress.slaViolations.push(
          `Total processing time ${totalTime}ms exceeded SLA target of ${SLA_TARGETS.TOTAL}ms`,
        );
      }

      await this.progressRepository.save(progress);

      // Send completion notification
      await this.sendProgressNotification(
        application.applicantId || '',
        dto.applicationId,
        'Fast decision process completed',
        progress,
      );

      this.logger.log(
        `Fast decision completed for ${dto.applicationId} in ${totalTime}ms (SLA: ${progress.slaCompliant ? 'MET' : 'VIOLATED'})`,
      );
    } catch (error) {
      this.logger.error(`Fast decision failed: ${error.message}`, error.stack);
      progress.status = DecisionStatus.FAILED;
      progress.elapsedTime = Date.now() - startTime;
      await this.progressRepository.save(progress);

      // Send failure notification
      await this.sendProgressNotification(
        application.applicantId || '',
        dto.applicationId,
        `Fast decision process failed: ${error.message}`,
        progress,
      );
    }
  }

  /**
   * Execute a step with SLA tracking
   */
  private async executeStep(
    progress: DecisionProgress,
    step: DecisionStep,
    slaTarget: number,
    stepFunction: () => Promise<any>,
  ): Promise<void> {
    const stepStartTime = Date.now();
    const stepDetail: StepDetailDto = {
      step,
      status: StepStatus.IN_PROGRESS,
      startTime: new Date(stepStartTime),
      slaTarget,
      slaMet: false,
    };

    // Update progress
    progress.steps[step] = stepDetail;
    progress.currentStep = step;
    await this.progressRepository.save(progress);

    // Send progress notification
    await this.sendProgressUpdate(progress, step, 'IN_PROGRESS');

    try {
      // Execute step
      const result = await stepFunction();

      const stepEndTime = Date.now();
      const duration = stepEndTime - stepStartTime;

      stepDetail.status = StepStatus.COMPLETED;
      stepDetail.endTime = new Date(stepEndTime);
      stepDetail.duration = duration;
      stepDetail.slaMet = duration <= slaTarget;
      stepDetail.result = result;

      if (!stepDetail.slaMet) {
        progress.slaCompliant = false;
        progress.slaViolations.push(
          `${step} took ${duration}ms, exceeding SLA target of ${slaTarget}ms`,
        );
      }

      // Update progress
      progress.steps[step] = stepDetail;
      progress.elapsedTime = stepEndTime - (progress.startedAt?.getTime() || stepStartTime);
      progress.progressPercentage = this.calculateProgress(progress);
      progress.estimatedTimeRemaining = this.estimateTimeRemaining(progress);

      await this.progressRepository.save(progress);

      // Send progress notification
      await this.sendProgressUpdate(progress, step, 'COMPLETED');

      this.logger.log(
        `Step ${step} completed in ${duration}ms (SLA: ${stepDetail.slaMet ? 'MET' : 'VIOLATED'})`,
      );
    } catch (error) {
      const stepEndTime = Date.now();
      const duration = stepEndTime - stepStartTime;

      stepDetail.status = StepStatus.FAILED;
      stepDetail.endTime = new Date(stepEndTime);
      stepDetail.duration = duration;
      stepDetail.error = error.message;

      progress.steps[step] = stepDetail;
      await this.progressRepository.save(progress);

      // Send progress notification
      await this.sendProgressUpdate(progress, step, 'FAILED');

      throw error;
    }
  }

  /**
   * Skip a step
   */
  private async skipStep(
    progress: DecisionProgress,
    step: DecisionStep,
  ): Promise<void> {
    const stepDetail: StepDetailDto = {
      step,
      status: StepStatus.SKIPPED,
      slaTarget: SLA_TARGETS[step],
      slaMet: true,
    };

    progress.steps[step] = stepDetail;
    await this.progressRepository.save(progress);
  }

  /**
   * Initialize steps
   */
  private initializeSteps(dto: InitiateFastDecisionDto): Record<string, StepDetailDto> {
    const steps: Record<string, StepDetailDto> = {};

    Object.values(DecisionStep).forEach((step) => {
      if (step === DecisionStep.COMPLETED) return;

      steps[step] = {
        step,
        status: StepStatus.PENDING,
        slaTarget: SLA_TARGETS[step],
        slaMet: false,
      };
    });

    return steps;
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(progress: DecisionProgress): number {
    const totalSteps = Object.keys(DecisionStep).length - 1; // Exclude COMPLETED
    let completedSteps = 0;

    Object.values(progress.steps).forEach((step: StepDetailDto) => {
      if (
        step.status === StepStatus.COMPLETED ||
        step.status === StepStatus.SKIPPED
      ) {
        completedSteps++;
      }
    });

    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(progress: DecisionProgress): number {
    const elapsed = progress.elapsedTime;
    const progressPct = progress.progressPercentage || 1;

    if (progressPct === 0) {
      return SLA_TARGETS.TOTAL;
    }

    const estimatedTotal = (elapsed / progressPct) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);

    return Math.min(remaining, SLA_TARGETS.TOTAL - elapsed);
  }

  /**
   * Send progress notification
   */
  private async sendProgressNotification(
    userId: string,
    applicationId: string,
    message: string,
    progress: DecisionProgress,
  ): Promise<void> {
    try {
      // Send via WebSocket (real-time)
      this.notificationGateway.sendNotificationToUser(userId, {
        type: 'DECISION_PROGRESS',
        applicationId,
        message,
        progress: {
          currentStep: progress.currentStep,
          progressPercentage: progress.progressPercentage,
          elapsedTime: progress.elapsedTime,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          slaCompliant: progress.slaCompliant,
        },
        timestamp: new Date(),
      });

      // Send via Push Notification
      await this.notificationService.sendNotification({
        recipientId: userId,
        notificationType: NotificationType.APPLICATION_UPDATE,
        channel: NotificationChannel.PUSH,
        subject: 'Loan Decision Progress',
        body: message,
        metadata: {
          applicationId,
          progressPercentage: progress.progressPercentage,
          currentStep: progress.currentStep,
        },
      });

      // Send via SMS (for milestones)
      if (
        progress.progressPercentage === 0 ||
        progress.progressPercentage === 50 ||
        progress.progressPercentage === 100
      ) {
        await this.notificationService.sendNotification({
          recipientId: userId,
          notificationType: NotificationType.APPLICATION_UPDATE,
          channel: NotificationChannel.SMS,
          subject: 'Loan Decision Update',
          body: `${message}. Progress: ${progress.progressPercentage}%`,
          metadata: {
            applicationId,
            progressPercentage: progress.progressPercentage,
          },
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send progress notification: ${error.message}`);
    }
  }

  /**
   * Send progress update
   */
  private async sendProgressUpdate(
    progress: DecisionProgress,
    step: DecisionStep,
    status: string,
  ): Promise<void> {
    const application = await this.loanApplicationService.findOne(
      progress.applicationId,
      '',
    );

    if (application?.applicantId) {
      await this.sendProgressNotification(
        application.applicantId,
        progress.applicationId,
        `Step ${step} ${status.toLowerCase()}`,
        progress,
      );
    }
  }

  /**
   * Get progress by application ID
   */
  async getProgress(applicationId: string): Promise<DecisionProgress | null> {
    return this.progressRepository.findOne({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get decision result
   */
  async getDecisionResult(applicationId: string): Promise<FastDecisionResultDto | null> {
    const progress = await this.getProgress(applicationId);
    if (!progress || progress.status !== DecisionStatus.COMPLETED) {
      return null;
    }

    const approvalStep = progress.steps[DecisionStep.APPROVAL] as StepDetailDto;
    const result = approvalStep?.result || {};

    return {
      applicationId,
      approved: result.approved || false,
      approvedAmount: result.approvedAmount,
      approvedInterestRate: result.approvedInterestRate,
      totalProcessingTime: progress.elapsedTime,
      slaCompliant: progress.slaCompliant,
      progress: progress as any,
      rationale: result.rationale,
      conditions: result.conditions,
    };
  }

  /**
   * Get SLA statistics
   */
  async getSLAStatistics(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{
    total: number;
    slaCompliant: number;
    slaViolated: number;
    averageTime: number;
    p95Time: number;
    stepStatistics: Record<string, any>;
  }> {
    const query = this.progressRepository.createQueryBuilder('progress');

    if (fromDate) {
      query.andWhere('progress.createdAt >= :fromDate', { fromDate });
    }
    if (toDate) {
      query.andWhere('progress.createdAt <= :toDate', { toDate });
    }

    const allProgress = await query.getMany();

    const total = allProgress.length;
    const slaCompliant = allProgress.filter((p) => p.slaCompliant).length;
    const slaViolated = total - slaCompliant;

    const times = allProgress.map((p) => p.elapsedTime).filter((t) => t > 0);
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    const sortedTimes = [...times].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95Time = sortedTimes[p95Index] || 0;

    // Step statistics
    const stepStatistics: Record<string, any> = {};
    Object.values(DecisionStep).forEach((step) => {
      if (step === DecisionStep.COMPLETED) return;

      const stepData = allProgress
        .map((p) => (p.steps[step] as StepDetailDto)?.duration)
        .filter((d) => d && d > 0);

      if (stepData.length > 0) {
        stepStatistics[step] = {
          count: stepData.length,
          average: stepData.reduce((a, b) => a + b, 0) / stepData.length,
          slaTarget: SLA_TARGETS[step],
          slaMet: stepData.filter((d) => d <= SLA_TARGETS[step]).length,
        };
      }
    });

    return {
      total,
      slaCompliant,
      slaViolated,
      averageTime,
      p95Time,
      stepStatistics,
    };
  }
}

