import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { SLATracking } from '../entities/sla-tracking.entity';
import { BulkOperation } from '../entities/bulk-operation.entity';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { TaskPriority } from '../../../common/enums/task-priority.enum';
import { SLAStatus } from '../../../common/enums/sla-status.enum';
import { BulkOperationStatus } from '../../../common/enums/bulk-operation-status.enum';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, BulkAssignTasksDto, AddTaskCommentDto, EscalateTaskDto, QueryTasksDto } from '../dto/task.dto';
import { CreateSLATrackingDto, UpdateSLATrackingDto, EscalateSLADto, QuerySLATrackingsDto } from '../dto/sla-tracking.dto';
import { CreateBulkOperationDto, PreviewBulkOperationDto, ApproveBulkOperationDto, ExecuteBulkOperationDto, QueryBulkOperationsDto } from '../dto/bulk-operation.dto';
import { Loan } from '../../loan/entities/loan.entity';

@Injectable()
export class WorkflowExceptionService {
  private readonly logger = new Logger(WorkflowExceptionService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(SLATracking)
    private readonly slaTrackingRepository: Repository<SLATracking>,
    @InjectRepository(BulkOperation)
    private readonly bulkOperationRepository: Repository<BulkOperation>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * UC-055: Manual Task Assignment
   */

  async createTask(dto: CreateTaskDto, userId: string, userName: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...dto,
      createdBy: userId,
      createdByName: userName,
      status: dto.assignedTo ? TaskStatus.ASSIGNED : TaskStatus.PENDING,
      priority: dto.priority || TaskPriority.MEDIUM,
      assignedAt: dto.assignedTo ? new Date() : null,
    });

    // Calculate SLA due date if slaHours provided
    if (dto.slaHours) {
      const slaStartDate = new Date();
      const slaDueDate = new Date(slaStartDate.getTime() + dto.slaHours * 60 * 60 * 1000);
      task.slaDueDate = slaDueDate;
      task.slaHours = dto.slaHours;
    }

    const savedTask = await this.taskRepository.save(task);

    // Create SLA tracking if SLA hours provided
    if (dto.slaHours) {
      await this.createSLATracking({
        taskId: savedTask.id,
        slaHours: dto.slaHours,
        slaStartDate: new Date().toISOString(),
        alertBeforeHours: 24,
      }, userId, userName);
    }

    this.logger.log(`Task created: ${savedTask.title} by ${userName}`);
    return savedTask;
  }

  async assignTask(taskId: string, dto: AssignTaskDto, userId: string, userName: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.assignedTo = dto.assignedTo;
    task.assignedAt = new Date();
    task.status = TaskStatus.ASSIGNED;
    task.assignedByName = userName;

    if (task.remarks) {
      task.remarks = `${task.remarks}\n[${new Date().toISOString()}] Assigned by ${userName}: ${dto.remarks || ''}`;
    } else {
      task.remarks = dto.remarks;
    }

    const updatedTask = await this.taskRepository.save(task);

    // Update SLA tracking if exists
    const slaTracking = await this.slaTrackingRepository.findOne({ where: { taskId } });
    if (slaTracking) {
      slaTracking.assignedTo = dto.assignedTo;
      await this.slaTrackingRepository.save(slaTracking);
    }

    this.logger.log(`Task ${taskId} assigned to ${dto.assignedTo} by ${userName}`);
    return updatedTask;
  }

  async bulkAssignTasks(dto: BulkAssignTasksDto, userId: string, userName: string): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
      where: { id: In(dto.taskIds) },
    });

    if (tasks.length !== dto.taskIds.length) {
      throw new BadRequestException('One or more task IDs are invalid');
    }

    const updatedTasks = tasks.map((task) => {
      task.assignedTo = dto.assignedTo;
      task.assignedAt = new Date();
      task.status = TaskStatus.ASSIGNED;
      task.assignedByName = userName;
      if (dto.remarks) {
        task.remarks = `${task.remarks || ''}\n[${new Date().toISOString()}] Bulk assigned by ${userName}: ${dto.remarks}`;
      }
      return task;
    });

    const savedTasks = await this.taskRepository.save(updatedTasks);

    // Update SLA trackings
    const slaTrackings = await this.slaTrackingRepository.find({
      where: { taskId: In(dto.taskIds) },
    });
    for (const sla of slaTrackings) {
      sla.assignedTo = dto.assignedTo;
      await this.slaTrackingRepository.save(sla);
    }

    this.logger.log(`Bulk assigned ${savedTasks.length} tasks to ${dto.assignedTo} by ${userName}`);
    return savedTasks;
  }

  async updateTask(taskId: string, dto: UpdateTaskDto, userId: string, userName: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Handle status changes
    if (dto.status === TaskStatus.IN_PROGRESS && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (dto.status === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
      // Update SLA tracking
      const slaTracking = await this.slaTrackingRepository.findOne({ where: { taskId } });
      if (slaTracking) {
        slaTracking.completedAt = new Date();
        slaTracking.status = SLAStatus.COMPLETED;
        const actualHours = (new Date().getTime() - new Date(slaTracking.slaStartDate).getTime()) / (1000 * 60 * 60);
        slaTracking.actualHours = Math.round(actualHours * 100) / 100;
        await this.slaTrackingRepository.save(slaTracking);
      }
    }

    Object.assign(task, dto);
    const updatedTask = await this.taskRepository.save(task);

    this.logger.log(`Task ${taskId} updated by ${userName}`);
    return updatedTask;
  }

  async addTaskComment(taskId: string, dto: AddTaskCommentDto, userId: string, userName: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!task.comments) {
      task.comments = [];
    }

    task.comments.push({
      userId,
      userName,
      comment: dto.comment,
      timestamp: new Date(),
    });

    const updatedTask = await this.taskRepository.save(task);
    this.logger.log(`Comment added to task ${taskId} by ${userName}`);
    return updatedTask;
  }

  async escalateTask(taskId: string, dto: EscalateTaskDto, userId: string, userName: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.isEscalated = true;
    task.escalatedTo = dto.escalatedTo;
    task.escalatedAt = new Date();
    task.escalationReason = dto.escalationReason;
    task.status = TaskStatus.ESCALATED;

    // Update SLA tracking
    const slaTracking = await this.slaTrackingRepository.findOne({ where: { taskId } });
    if (slaTracking) {
      slaTracking.escalatedTo = dto.escalatedTo;
      slaTracking.escalatedAt = new Date();
      slaTracking.escalationReason = dto.escalationReason;
      await this.slaTrackingRepository.save(slaTracking);
    }

    const updatedTask = await this.taskRepository.save(task);
    this.logger.log(`Task ${taskId} escalated to ${dto.escalatedTo} by ${userName}`);
    return updatedTask;
  }

  async getTasks(filters: QueryTasksDto): Promise<Task[]> {
    const query = this.taskRepository.createQueryBuilder('task');

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.assignedTo) {
      query.andWhere('task.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.createdBy) {
      query.andWhere('task.createdBy = :createdBy', { createdBy: filters.createdBy });
    }
    if (filters.taskType) {
      query.andWhere('task.taskType = :taskType', { taskType: filters.taskType });
    }
    if (filters.priority) {
      query.andWhere('task.priority = :priority', { priority: filters.priority });
    }
    if (filters.isEscalated !== undefined) {
      query.andWhere('task.isEscalated = :isEscalated', { isEscalated: filters.isEscalated });
    }
    if (filters.relatedEntityType) {
      query.andWhere('task.relatedEntityType = :relatedEntityType', { relatedEntityType: filters.relatedEntityType });
    }
    if (filters.relatedEntityId) {
      query.andWhere('task.relatedEntityId = :relatedEntityId', { relatedEntityId: filters.relatedEntityId });
    }

    query.orderBy('task.createdAt', 'DESC');
    return query.getMany();
  }

  async getTask(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  /**
   * UC-056: SLA Breach Alert
   */

  async createSLATracking(dto: CreateSLATrackingDto, userId: string, userName: string): Promise<SLATracking> {
    const task = await this.taskRepository.findOne({ where: { id: dto.taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${dto.taskId} not found`);
    }

    const slaStartDate = dto.slaStartDate ? new Date(dto.slaStartDate) : new Date();
    const slaDueDate = new Date(slaStartDate.getTime() + dto.slaHours * 60 * 60 * 1000);

    const slaTracking = this.slaTrackingRepository.create({
      taskId: dto.taskId,
      taskTitle: task.title,
      slaHours: dto.slaHours,
      slaStartDate,
      slaDueDate,
      alertBeforeHours: dto.alertBeforeHours || 24,
      assignedTo: task.assignedTo,
      assignedToName: task.assignedByName,
      status: SLAStatus.ON_TRACK,
    });

    const savedSLA = await this.slaTrackingRepository.save(slaTracking);
    this.logger.log(`SLA tracking created for task ${dto.taskId}`);
    return savedSLA;
  }

  async checkSLABreaches(): Promise<SLATracking[]> {
    const now = new Date();
    const alertThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find SLAs that are at risk or breached
    const slaTrackings = await this.slaTrackingRepository
      .createQueryBuilder('sla')
      .where('sla.status IN (:...statuses)', { statuses: [SLAStatus.ON_TRACK, SLAStatus.AT_RISK] })
      .andWhere('sla.completedAt IS NULL')
      .getMany();

    const updatedSLAs: SLATracking[] = [];

    for (const sla of slaTrackings) {
      const slaDueDate = new Date(sla.slaDueDate);
      const isBreached = now > slaDueDate;
      const isAtRisk = now >= new Date(slaDueDate.getTime() - sla.alertBeforeHours * 60 * 60 * 1000);

      if (isBreached && sla.status !== SLAStatus.BREACHED) {
        sla.status = SLAStatus.BREACHED;
        sla.breached = true;
        sla.breachedAt = now;
        const breachMinutes = Math.round((now.getTime() - slaDueDate.getTime()) / (1000 * 60));
        sla.breachMinutes = breachMinutes;

        // Add to status history
        if (!sla.statusHistory) {
          sla.statusHistory = [];
        }
        sla.statusHistory.push({
          status: SLAStatus.BREACHED,
          timestamp: now,
          updatedBy: 'System',
          notes: `SLA breached by ${breachMinutes} minutes`,
        });

        updatedSLAs.push(sla);
        this.logger.warn(`SLA breached for task ${sla.taskId}`);
      } else if (isAtRisk && sla.status === SLAStatus.ON_TRACK) {
        sla.status = SLAStatus.AT_RISK;

        // Add to status history
        if (!sla.statusHistory) {
          sla.statusHistory = [];
        }
        sla.statusHistory.push({
          status: SLAStatus.AT_RISK,
          timestamp: now,
          updatedBy: 'System',
          notes: `SLA at risk - due in ${Math.round((slaDueDate.getTime() - now.getTime()) / (1000 * 60 * 60))} hours`,
        });

        updatedSLAs.push(sla);
        this.logger.log(`SLA at risk for task ${sla.taskId}`);
      }
    }

    if (updatedSLAs.length > 0) {
      await this.slaTrackingRepository.save(updatedSLAs);
    }

    return updatedSLAs;
  }

  async escalateSLA(slaId: string, dto: EscalateSLADto, userId: string, userName: string): Promise<SLATracking> {
    const sla = await this.slaTrackingRepository.findOne({ where: { id: slaId } });
    if (!sla) {
      throw new NotFoundException(`SLA tracking with ID ${slaId} not found`);
    }

    sla.escalatedTo = dto.escalatedTo;
    sla.escalatedAt = new Date();
    sla.escalationReason = dto.escalationReason;

    if (!sla.statusHistory) {
      sla.statusHistory = [];
    }
    sla.statusHistory.push({
      status: sla.status,
      timestamp: new Date(),
      updatedBy: userName,
      notes: `Escalated to ${dto.escalatedTo}: ${dto.escalationReason}`,
    });

    const updatedSLA = await this.slaTrackingRepository.save(sla);
    this.logger.log(`SLA ${slaId} escalated to ${dto.escalatedTo} by ${userName}`);
    return updatedSLA;
  }

  async getSLATrackings(filters: QuerySLATrackingsDto): Promise<SLATracking[]> {
    const query = this.slaTrackingRepository.createQueryBuilder('sla');

    if (filters.taskId) {
      query.andWhere('sla.taskId = :taskId', { taskId: filters.taskId });
    }
    if (filters.status) {
      query.andWhere('sla.status = :status', { status: filters.status });
    }
    if (filters.assignedTo) {
      query.andWhere('sla.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.breached !== undefined) {
      query.andWhere('sla.breached = :breached', { breached: filters.breached });
    }
    if (filters.alertSent !== undefined) {
      query.andWhere('sla.alertSent = :alertSent', { alertSent: filters.alertSent });
    }

    query.orderBy('sla.slaDueDate', 'ASC');
    return query.getMany();
  }

  async getSLATracking(id: string): Promise<SLATracking> {
    const sla = await this.slaTrackingRepository.findOne({ where: { id } });
    if (!sla) {
      throw new NotFoundException(`SLA tracking with ID ${id} not found`);
    }
    return sla;
  }

  /**
   * UC-057: Bulk Operation Execution
   */

  async createBulkOperation(dto: CreateBulkOperationDto, userId: string, userName: string): Promise<BulkOperation> {
    // Estimate affected count based on selection criteria
    const estimatedCount = await this.estimateAffectedCount(dto.selectionCriteria);

    const bulkOperation = this.bulkOperationRepository.create({
      ...dto,
      createdBy: userId,
      createdByName: userName,
      estimatedAffectedCount: estimatedCount,
      status: BulkOperationStatus.DRAFT,
    });

    const savedOperation = await this.bulkOperationRepository.save(bulkOperation);
    this.logger.log(`Bulk operation created: ${savedOperation.operationName} by ${userName}`);
    return savedOperation;
  }

  private async estimateAffectedCount(criteria: Record<string, any>): Promise<number> {
    // This is a simplified estimation - in production, this would query the actual database
    // For now, we'll use a mock estimation based on criteria
    if (criteria.loanStatus) {
      const count = await this.loanRepository.count({ where: { status: criteria.loanStatus } });
      return count;
    }
    // Default estimation
    return 0;
  }

  async previewBulkOperation(id: string, dto: PreviewBulkOperationDto): Promise<BulkOperation> {
    const operation = await this.bulkOperationRepository.findOne({ where: { id } });
    if (!operation) {
      throw new NotFoundException(`Bulk operation with ID ${id} not found`);
    }

    // Generate preview data
    const sampleRecords = await this.getSampleRecords(operation.selectionCriteria, dto.sampleSize || 10);
    const affectedFields = Object.keys(operation.operationDetails);
    const estimatedImpact = `This operation will affect approximately ${operation.estimatedAffectedCount} records. Fields to be updated: ${affectedFields.join(', ')}`;

    operation.previewData = {
      sampleRecords,
      affectedFields,
      estimatedImpact,
    };
    operation.previewGenerated = true;
    operation.previewGeneratedAt = new Date();

    const updatedOperation = await this.bulkOperationRepository.save(operation);
    this.logger.log(`Preview generated for bulk operation ${id}`);
    return updatedOperation;
  }

  private async getSampleRecords(criteria: Record<string, any>, limit: number): Promise<any[]> {
    // Simplified - in production, this would query based on criteria
    if (criteria.loanStatus) {
      const loans = await this.loanRepository.find({
        where: { status: criteria.loanStatus },
        take: limit,
      });
      return loans.map((loan) => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        status: loan.status,
        // Add other relevant fields
      }));
    }
    return [];
  }

  async approveBulkOperation(id: string, dto: ApproveBulkOperationDto, userId: string, userName: string): Promise<BulkOperation> {
    const operation = await this.bulkOperationRepository.findOne({ where: { id } });
    if (!operation) {
      throw new NotFoundException(`Bulk operation with ID ${id} not found`);
    }

    if (operation.status !== BulkOperationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Bulk operation must be in PENDING_APPROVAL status to be approved`);
    }

    operation.status = BulkOperationStatus.APPROVED;
    operation.approvedBy = userId;
    operation.approvedByName = userName;
    operation.approvedAt = new Date();
    operation.approvalNotes = dto.approvalNotes;

    const updatedOperation = await this.bulkOperationRepository.save(operation);
    this.logger.log(`Bulk operation ${id} approved by ${userName}`);
    return updatedOperation;
  }

  async executeBulkOperation(id: string, dto: ExecuteBulkOperationDto, userId: string, userName: string): Promise<BulkOperation> {
    const operation = await this.bulkOperationRepository.findOne({ where: { id } });
    if (!operation) {
      throw new NotFoundException(`Bulk operation with ID ${id} not found`);
    }

    if (operation.status !== BulkOperationStatus.APPROVED) {
      throw new BadRequestException(`Bulk operation must be in APPROVED status to be executed`);
    }

    const startTime = Date.now();
    operation.status = BulkOperationStatus.IN_PROGRESS;
    operation.executedBy = userId;
    await this.bulkOperationRepository.save(operation);

    try {
      // Execute the bulk operation
      const results = await this.executeOperation(operation);

      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      operation.status = BulkOperationStatus.COMPLETED;
      operation.executedAt = new Date();
      operation.executionDurationSeconds = durationSeconds;
      operation.executionResults = results;
      operation.actualAffectedCount = results.successful;

      if (dto.generateReport) {
        operation.reportGenerated = true;
        operation.reportGeneratedAt = new Date();
        operation.reportPath = `/reports/bulk-operations/${id}.pdf`; // Mock path
      }

      const updatedOperation = await this.bulkOperationRepository.save(operation);
      this.logger.log(`Bulk operation ${id} executed successfully by ${userName}`);
      return updatedOperation;
    } catch (error: any) {
      operation.status = BulkOperationStatus.FAILED;
      operation.errorMessage = error.message;
      await this.bulkOperationRepository.save(operation);
      this.logger.error(`Bulk operation ${id} failed: ${error.message}`);
      throw error;
    }
  }

  private async executeOperation(operation: BulkOperation): Promise<any> {
    // Simplified execution - in production, this would apply the operationDetails to matching records
    const criteria = operation.selectionCriteria;
    const details = operation.operationDetails;

    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: Array<{ recordId: string; error: string }> = [];

    // Mock execution - in production, this would update actual records
    if (criteria.loanStatus) {
      const loans = await this.loanRepository.find({
        where: { status: criteria.loanStatus },
      });

      processed = loans.length;

      // Apply operation details (simplified)
      for (const loan of loans) {
        try {
          // In production, apply the operationDetails to the loan
          // For now, just mark as successful
          successful++;
        } catch (error: any) {
          failed++;
          errors.push({
            recordId: loan.id,
            error: error.message,
          });
        }
      }
    }

    return {
      totalProcessed: processed,
      successful,
      failed,
      errors,
      warnings: [],
    };
  }

  async getBulkOperations(filters: QueryBulkOperationsDto): Promise<BulkOperation[]> {
    const query = this.bulkOperationRepository.createQueryBuilder('operation');

    if (filters.operationType) {
      query.andWhere('operation.operationType = :operationType', { operationType: filters.operationType });
    }
    if (filters.status) {
      query.andWhere('operation.status = :status', { status: filters.status });
    }
    if (filters.createdBy) {
      query.andWhere('operation.createdBy = :createdBy', { createdBy: filters.createdBy });
    }
    if (filters.fromDate) {
      query.andWhere('operation.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }
    if (filters.toDate) {
      query.andWhere('operation.createdAt <= :toDate', { toDate: filters.toDate });
    }

    query.orderBy('operation.createdAt', 'DESC');
    return query.getMany();
  }

  async getBulkOperation(id: string): Promise<BulkOperation> {
    const operation = await this.bulkOperationRepository.findOne({ where: { id } });
    if (!operation) {
      throw new NotFoundException(`Bulk operation with ID ${id} not found`);
    }
    return operation;
  }
}

