import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkflowTrigger, TriggerType, EventType, ScheduleFrequency } from '../entities/workflow-trigger.entity';
import { WorkflowExecution, ExecutionStatus } from '../entities/workflow-execution.entity';
import {
  CreateWorkflowTriggerDto,
  WorkflowTriggerResult,
  WorkflowExecutionResult,
} from '../dto/workflow-automation.dto';
import { WorkflowIntegrationService } from '../../workflow/workflow-integration.service';

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);

  constructor(
    @InjectRepository(WorkflowTrigger)
    private readonly triggerRepository: Repository<WorkflowTrigger>,
    @InjectRepository(WorkflowExecution)
    private readonly executionRepository: Repository<WorkflowExecution>,
    private readonly workflowIntegrationService: WorkflowIntegrationService,
  ) {}

  /**
   * Create workflow trigger
   */
  async createTrigger(
    dto: CreateWorkflowTriggerDto,
    companyId: string,
  ): Promise<WorkflowTriggerResult> {
    this.logger.log(`Creating workflow trigger: ${dto.triggerName}`);

    const trigger = this.triggerRepository.create({
      workflowId: dto.workflowId,
      triggerName: dto.triggerName,
      triggerType: dto.triggerType,
      eventType: dto.eventType,
      entityType: dto.entityType,
      scheduleFrequency: dto.scheduleFrequency,
      scheduleTime: dto.scheduleTime,
      scheduleDays: dto.scheduleDays,
      conditions: dto.conditions,
      isActive: dto.isActive !== false,
    });

    // Calculate next execution time for scheduled triggers
    if (dto.triggerType === TriggerType.SCHEDULE && trigger.isActive) {
      trigger.nextExecutionAt = this.calculateNextExecutionTime(trigger);
    }

    const saved = await this.triggerRepository.save(trigger);

    return this.mapToResult(saved);
  }

  /**
   * Handle event trigger
   */
  async handleEvent(
    eventType: EventType,
    entityType: string,
    entityId: string,
    entityData?: any,
  ): Promise<void> {
    this.logger.log(`Handling event: ${eventType} for ${entityType}:${entityId}`);

    // Find active event triggers for this event type
    const triggers = await this.triggerRepository.find({
      where: {
        triggerType: TriggerType.EVENT,
        eventType,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      // Check entity type filter
      if (trigger.entityType && trigger.entityType !== entityType) {
        continue;
      }

      // Check conditions if any
      if (trigger.conditions && trigger.conditions.length > 0) {
        if (!this.evaluateConditions(trigger.conditions, entityData)) {
          continue;
        }
      }

      // Execute workflow
      await this.executeWorkflow(trigger, entityType, entityId, entityData);
    }
  }

  /**
   * Execute scheduled workflows
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async executeScheduledWorkflows(): Promise<void> {
    const now = new Date();
    const triggers = await this.triggerRepository.find({
      where: {
        triggerType: TriggerType.SCHEDULE,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      if (trigger.nextExecutionAt && trigger.nextExecutionAt <= now) {
        await this.executeScheduledWorkflow(trigger);
      }
    }
  }

  /**
   * Get trigger by ID
   */
  async getTrigger(id: string): Promise<WorkflowTriggerResult> {
    const trigger = await this.triggerRepository.findOne({
      where: { id },
    });

    if (!trigger) {
      throw new Error(`Trigger ${id} not found`);
    }

    return this.mapToResult(trigger);
  }

  /**
   * Get all triggers
   */
  async getTriggers(workflowId?: string): Promise<WorkflowTriggerResult[]> {
    const where: any = {};
    if (workflowId) {
      where.workflowId = workflowId;
    }

    const triggers = await this.triggerRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return triggers.map((t) => this.mapToResult(t));
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    triggerId?: string,
    entityType?: string,
    entityId?: string,
    limit: number = 50,
  ): Promise<WorkflowExecutionResult[]> {
    const where: any = {};
    if (triggerId) {
      where.triggerId = triggerId;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    const executions = await this.triggerRepository.manager.find(WorkflowExecution, {
      where,
      order: { executedAt: 'DESC' },
      take: limit,
    });

    return executions.map((e) => ({
      id: e.id,
      triggerId: e.triggerId,
      entityType: e.entityType,
      entityId: e.entityId,
      status: e.status,
      executionTimeMs: e.executionTimeMs || 0,
      errorMessage: e.errorMessage,
      executedAt: e.executedAt.toISOString(),
    }));
  }

  /**
   * Toggle trigger active status
   */
  async toggleTrigger(id: string, isActive: boolean): Promise<void> {
    const trigger = await this.triggerRepository.findOne({
      where: { id },
    });

    if (!trigger) {
      throw new Error(`Trigger ${id} not found`);
    }

    trigger.isActive = isActive;
    if (isActive && trigger.triggerType === TriggerType.SCHEDULE) {
      trigger.nextExecutionAt = this.calculateNextExecutionTime(trigger);
    } else if (!isActive) {
      trigger.nextExecutionAt = null;
    }

    await this.triggerRepository.save(trigger);
  }

  // Private helper methods

  private async executeWorkflow(
    trigger: WorkflowTrigger,
    entityType: string,
    entityId: string,
    entityData?: any,
  ): Promise<void> {
    const startTime = Date.now();
    const execution = this.executionRepository.create({
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      entityType,
      entityId,
      status: ExecutionStatus.PENDING,
      executionData: entityData,
    });

    await this.executionRepository.save(execution);

    try {
      // Execute workflow action
      // In production, this would call the workflow service to perform the action
      await this.workflowIntegrationService.performWorkflowAction(
        entityType,
        entityId,
        'AUTO_TRIGGER', // Action name
        'SYSTEM', // User ID
        'SYSTEM', // Roles - pass as string instead of array
        `Automatically triggered by: ${trigger.triggerName}`,
      );

      const executionTime = Date.now() - startTime;
      execution.status = ExecutionStatus.SUCCESS;
      execution.executionTimeMs = executionTime;
      execution.result = { success: true };

      // Update trigger stats
      trigger.executionCount++;
      trigger.lastExecutedAt = new Date();
      await this.triggerRepository.save(trigger);
    } catch (error: any) {
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      execution.executionTimeMs = Date.now() - startTime;
      this.logger.error(`Workflow execution failed: ${error.message}`);
    }

    await this.executionRepository.save(execution);
  }

  private async executeScheduledWorkflow(trigger: WorkflowTrigger): Promise<void> {
    this.logger.log(`Executing scheduled workflow: ${trigger.triggerName}`);

    // For scheduled workflows, we need to find entities to process
    // This is a simplified version - in production, you'd query based on conditions
    try {
      // Example: Daily delinquency check
      if (trigger.eventType === EventType.PAYMENT_MISSED) {
        // Query for loans with missed payments
        // Then execute workflow for each
        // This would be implemented based on specific business logic
      }

      // Update next execution time
      trigger.nextExecutionAt = this.calculateNextExecutionTime(trigger);
      trigger.executionCount++;
      trigger.lastExecutedAt = new Date();
      await this.triggerRepository.save(trigger);
    } catch (error: any) {
      this.logger.error(`Scheduled workflow execution failed: ${error.message}`);
    }
  }

  private evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: any }>,
    entityData: any,
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(entityData, condition.field);
      if (!this.compareValues(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private calculateNextExecutionTime(trigger: WorkflowTrigger): Date {
    const now = new Date();
    const next = new Date(now);

    if (!trigger.scheduleFrequency || !trigger.scheduleTime) {
      return next;
    }

    const [hours, minutes] = trigger.scheduleTime.split(':').map(Number);

    switch (trigger.scheduleFrequency) {
      case ScheduleFrequency.DAILY:
        next.setHours(hours, minutes, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case ScheduleFrequency.WEEKLY:
        // Find next matching day
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const scheduleDays = trigger.scheduleDays || [];
        const currentDay = dayNames[now.getDay()];

        let daysToAdd = 0;
        if (scheduleDays.includes(currentDay)) {
          // If today is a schedule day, check if time has passed
          next.setHours(hours, minutes, 0, 0);
          if (next > now) {
            daysToAdd = 0;
          } else {
            daysToAdd = 1;
          }
        } else {
          daysToAdd = 1;
        }

        // Find next schedule day
        while (daysToAdd < 7) {
          const checkDay = dayNames[(now.getDay() + daysToAdd) % 7];
          if (scheduleDays.includes(checkDay)) {
            next.setDate(now.getDate() + daysToAdd);
            next.setHours(hours, minutes, 0, 0);
            break;
          }
          daysToAdd++;
        }
        break;

      case ScheduleFrequency.MONTHLY:
        next.setDate(1); // First day of month
        next.setHours(hours, minutes, 0, 0);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
    }

    return next;
  }

  private mapToResult(trigger: WorkflowTrigger): WorkflowTriggerResult {
    return {
      id: trigger.id,
      triggerName: trigger.triggerName,
      triggerType: trigger.triggerType,
      isActive: trigger.isActive,
      executionCount: trigger.executionCount,
      lastExecutedAt: trigger.lastExecutedAt?.toISOString(),
      nextExecutionAt: trigger.nextExecutionAt?.toISOString(),
    };
  }
}

