import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServicingTask } from '../entities/servicing-task.entity';
import { AutoEscalationRule } from '../entities/auto-escalation-rule.entity';
import { EscalationLevel, ServicingTaskType, ServicingTaskStatus } from '../dto/loan-servicing.dto';
import { PaymentRetryLog, RetryStatus } from '../entities/payment-retry-log.entity';
import {
  CreateServicingTaskDto,
  CreateAutoEscalationRuleDto,
  PaymentRetryConfigDto,
  DelinquencySummary,
} from '../dto/loan-servicing.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class LoanServicingService {
  private readonly logger = new Logger(LoanServicingService.name);

  constructor(
    @InjectRepository(ServicingTask)
    private servicingTaskRepository: Repository<ServicingTask>,
    @InjectRepository(AutoEscalationRule)
    private escalationRuleRepository: Repository<AutoEscalationRule>,
    @InjectRepository(PaymentRetryLog)
    private paymentRetryRepository: Repository<PaymentRetryLog>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanRepaymentSchedule)
    private scheduleRepository: Repository<LoanRepaymentSchedule>,
  ) {}

  async createTask(createDto: CreateServicingTaskDto, userId: string): Promise<ServicingTask> {
    const task = this.servicingTaskRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.servicingTaskRepository.save(task);
  }

  async findAllTasks(loanId?: string, status?: ServicingTaskStatus): Promise<ServicingTask[]> {
    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (status) where.status = status;

    return this.servicingTaskRepository.find({
      where,
      order: { priority: 'DESC', dueDate: 'ASC' },
    });
  }

  async findOneTask(id: string): Promise<ServicingTask> {
    const task = await this.servicingTaskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Servicing task with ID ${id} not found`);
    }
    return task;
  }

  async updateTaskStatus(
    id: string,
    status: ServicingTaskStatus,
    result?: Record<string, any>,
    userId?: string,
  ): Promise<ServicingTask> {
    const task = await this.findOneTask(id);
    task.status = status;
    if (status === ServicingTaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }
    if (result) {
      task.result = result;
    }
    if (userId) {
      task.updatedBy = userId;
    }
    return this.servicingTaskRepository.save(task);
  }

  async createEscalationRule(
    createDto: CreateAutoEscalationRuleDto,
    userId: string,
  ): Promise<AutoEscalationRule> {
    const rule = this.escalationRuleRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.escalationRuleRepository.save(rule);
  }

  async findAllEscalationRules(): Promise<AutoEscalationRule[]> {
    return this.escalationRuleRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async evaluateEscalationRules(loanId: string): Promise<AutoEscalationRule[]> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    // Calculate days past due
    const daysPastDue = await this.calculateDaysPastDue(loanId);

    // Get loan context for rule evaluation
    const loanContext = {
      loanId: loan.id,
      loanAmount: Number(loan.loanAmount),
      outstandingAmount: Number(loan.outstandingAmount || 0),
      daysPastDue,
      status: loan.status,
      rateOfInterest: Number(loan.rateOfInterest),
    };

    const activeRules = await this.escalationRuleRepository.find({
      where: { isActive: true },
    });

    const triggeredRules: AutoEscalationRule[] = [];

    for (const rule of activeRules) {
      try {
        // Evaluate trigger condition (simplified - in production, use a proper expression evaluator)
        const conditionMet = this.evaluateCondition(rule.triggerCondition, loanContext);
        if (conditionMet) {
          triggeredRules.push(rule);
          rule.triggerCount += 1;
          rule.lastTriggeredAt = new Date();
          await this.escalationRuleRepository.save(rule);

          // Create escalation task
          await this.createTask(
            {
              loanId,
              taskType: ServicingTaskType.ESCALATION,
              description: `Auto-escalated to ${rule.escalationLevel}: ${rule.ruleName}`,
              priority: this.getEscalationPriority(rule.escalationLevel),
              config: {
                escalationLevel: rule.escalationLevel,
                ruleId: rule.id,
                actions: rule.actions,
              },
            },
            'system',
          );
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id}: ${error.message}`);
      }
    }

    return triggeredRules;
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simplified condition evaluation - in production, use a proper expression evaluator
    try {
      // Replace variables with context values
      let evaluatedCondition = condition;
      for (const [key, value] of Object.entries(context)) {
        evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
      }

      // Evaluate the condition (basic implementation)
      // In production, use a safe expression evaluator like 'expr-eval' or 'mathjs'
      return eval(evaluatedCondition); // eslint-disable-line no-eval
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  }

  private getEscalationPriority(level: EscalationLevel): number {
    const priorityMap = {
      [EscalationLevel.LEVEL_1]: 6,
      [EscalationLevel.LEVEL_2]: 7,
      [EscalationLevel.LEVEL_3]: 8,
      [EscalationLevel.EXECUTIVE]: 10,
    };
    return priorityMap[level] || 5;
  }

  async retryPayment(
    repaymentId: string,
    config: PaymentRetryConfigDto,
  ): Promise<PaymentRetryLog> {
    const repayment = await this.repaymentRepository.findOne({
      where: { id: repaymentId },
    });

    if (!repayment) {
      throw new NotFoundException(`Repayment with ID ${repaymentId} not found`);
    }

    // Get existing retry count
    const existingRetries = await this.paymentRetryRepository.find({
      where: { repaymentId },
      order: { retryAttempt: 'DESC' },
    });

    const nextAttempt = existingRetries.length > 0
      ? existingRetries[0].retryAttempt + 1
      : 1;

    if (nextAttempt > config.maxRetries) {
      throw new BadRequestException(`Maximum retry attempts (${config.maxRetries}) exceeded`);
    }

    const retryLog = this.paymentRetryRepository.create({
      loanId: repayment.loanId,
      repaymentId,
      retryAttempt: nextAttempt,
      retryStrategy: config.retryStrategy,
      status: RetryStatus.PENDING,
      retryDate: this.calculateRetryDate(config, nextAttempt),
      amount: Number(repayment.amountPaid),
      retryConfig: config as any,
    });

    const savedLog = await this.paymentRetryRepository.save(retryLog);

    // Process payment retry (simplified - integrate with actual payment processor)
    try {
      // TODO: Integrate with actual payment processor
      // const result = await this.paymentProcessor.retryPayment(repayment, config);
      
      savedLog.status = RetryStatus.SUCCESS;
      savedLog.result = { message: 'Payment retry successful' };
    } catch (error) {
      savedLog.status = RetryStatus.FAILED;
      savedLog.errorMessage = error.message;
    }

    return this.paymentRetryRepository.save(savedLog);
  }

  private calculateRetryDate(config: PaymentRetryConfigDto, attempt: number): Date {
    const now = new Date();
    let minutes = 0;

    switch (config.retryStrategy) {
      case 'IMMEDIATE':
        minutes = 0;
        break;
      case 'FIXED_INTERVAL':
        minutes = (config.retryInterval || 60) * attempt;
        break;
      case 'EXPONENTIAL_BACKOFF':
        minutes = Math.pow(2, attempt - 1) * (config.retryInterval || 60);
        break;
      case 'CUSTOM':
        if (config.customSchedule && config.customSchedule[attempt - 1]) {
          minutes = config.customSchedule[attempt - 1];
        } else {
          minutes = 60 * attempt;
        }
        break;
    }

    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  async calculateDaysPastDue(loanId: string): Promise<number> {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        loanId,
        status: 'Pending' as any,
      },
      order: { paymentDate: 'ASC' },
    });

    if (!schedule) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(schedule.paymentDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  async getDelinquencySummary(): Promise<DelinquencySummary> {
    const activeLoans = await this.loanRepository.find({
      where: { status: LoanStatus.ACTIVE },
    });

    let totalDelinquentLoans = 0;
    let totalDelinquentAmount = 0;
    const byDaysPastDue = {
      '1-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };
    const escalationBreakdown: Record<string, { count: number; amount: number }> = {};

    for (const loan of activeLoans) {
      const daysPastDue = await this.calculateDaysPastDue(loan.id);
      if (daysPastDue > 0) {
        totalDelinquentLoans++;
        const outstandingAmount = Number(loan.outstandingAmount || 0);
        totalDelinquentAmount += outstandingAmount;

        // Categorize by days past due
        if (daysPastDue <= 30) {
          byDaysPastDue['1-30'].count++;
          byDaysPastDue['1-30'].amount += outstandingAmount;
        } else if (daysPastDue <= 60) {
          byDaysPastDue['31-60'].count++;
          byDaysPastDue['31-60'].amount += outstandingAmount;
        } else if (daysPastDue <= 90) {
          byDaysPastDue['61-90'].count++;
          byDaysPastDue['61-90'].amount += outstandingAmount;
        } else {
          byDaysPastDue['90+'].count++;
          byDaysPastDue['90+'].amount += outstandingAmount;
        }

        // Get escalation level
        const escalationLevel = this.getEscalationLevelForDaysPastDue(daysPastDue);
        if (!escalationBreakdown[escalationLevel]) {
          escalationBreakdown[escalationLevel] = { count: 0, amount: 0 };
        }
        escalationBreakdown[escalationLevel].count++;
        escalationBreakdown[escalationLevel].amount += outstandingAmount;
      }
    }

    return {
      totalDelinquentLoans,
      totalDelinquentAmount,
      byDaysPastDue,
      escalationBreakdown,
    };
  }

  private getEscalationLevelForDaysPastDue(daysPastDue: number): string {
    if (daysPastDue <= 30) return EscalationLevel.LEVEL_1;
    if (daysPastDue <= 60) return EscalationLevel.LEVEL_2;
    if (daysPastDue <= 90) return EscalationLevel.LEVEL_3;
    return EscalationLevel.EXECUTIVE;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processDelinquentLoans() {
    this.logger.log('Processing delinquent loans...');
    const activeLoans = await this.loanRepository.find({
      where: { status: LoanStatus.ACTIVE },
    });

    for (const loan of activeLoans) {
      const daysPastDue = await this.calculateDaysPastDue(loan.id);
      if (daysPastDue > 0) {
        // Evaluate escalation rules
        await this.evaluateEscalationRules(loan.id);

        // Create delinquency management task
        await this.createTask(
          {
            loanId: loan.id,
            taskType: ServicingTaskType.DELINQUENCY_MANAGEMENT,
            description: `Loan is ${daysPastDue} days past due`,
            priority: this.getEscalationPriority(
              this.getEscalationLevelForDaysPastDue(daysPastDue) as EscalationLevel,
            ),
            config: {
              daysPastDue,
              outstandingAmount: loan.outstandingAmount,
            },
          },
          'system',
        );
      }
    }

    this.logger.log(`Processed ${activeLoans.length} loans for delinquency`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processPendingTasks() {
    this.logger.log('Processing pending servicing tasks...');
    const pendingTasks = await this.servicingTaskRepository.find({
      where: {
        status: ServicingTaskStatus.PENDING,
        dueDate: LessThan(new Date()),
      },
      order: { priority: 'DESC' },
      take: 100,
    });

    for (const task of pendingTasks) {
      try {
        await this.executeTask(task);
      } catch (error) {
        this.logger.error(`Error executing task ${task.id}: ${error.message}`);
        task.status = ServicingTaskStatus.FAILED;
        task.errorMessage = error.message;
        await this.servicingTaskRepository.save(task);
      }
    }

    this.logger.log(`Processed ${pendingTasks.length} pending tasks`);
  }

  private async executeTask(task: ServicingTask): Promise<void> {
    task.status = ServicingTaskStatus.IN_PROGRESS;
    await this.servicingTaskRepository.save(task);

    try {
      switch (task.taskType) {
        case ServicingTaskType.PAYMENT_PROCESSING:
          // TODO: Integrate with payment processor
          break;
        case ServicingTaskType.DELINQUENCY_MANAGEMENT:
          // TODO: Send notifications, update loan status
          break;
        case ServicingTaskType.DOCUMENT_GENERATION:
          // TODO: Generate documents
          break;
        case ServicingTaskType.COMMUNICATION:
          // TODO: Send communications
          break;
        default:
          this.logger.warn(`Unknown task type: ${task.taskType}`);
      }

      task.status = ServicingTaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = { message: 'Task completed successfully' };
    } catch (error) {
      task.status = ServicingTaskStatus.FAILED;
      task.errorMessage = error.message;
      throw error;
    } finally {
      await this.servicingTaskRepository.save(task);
    }
  }
}

