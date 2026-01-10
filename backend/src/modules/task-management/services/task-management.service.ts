import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import {
  CreateTaskDto,
  TaskResult,
  TaskAnalytics,
} from '../dto/task-management.dto';

@Injectable()
export class TaskManagementService {
  private readonly logger = new Logger(TaskManagementService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  /**
   * Create task
   */
  async createTask(
    dto: CreateTaskDto,
    companyId: string,
    createdBy: string,
  ): Promise<TaskResult> {
    this.logger.log(`Creating task: ${dto.title}`);

    const task = this.taskRepository.create({
      companyId,
      title: dto.title,
      description: dto.description,
      assignedTo: dto.assignedTo,
      createdBy,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      entityType: dto.entityType,
      entityId: dto.entityId,
      tags: dto.tags || [],
      estimatedHours: dto.estimatedHours,
      dependsOn: dto.dependsOn || [],
      status: TaskStatus.TODO,
      completionPercentage: 0,
      timeSpent: 0,
    });

    const saved = await this.taskRepository.save(task);
    return this.mapToResult(saved);
  }

  /**
   * Update task
   */
  async updateTask(
    id: string,
    updates: Partial<CreateTaskDto> & {
      status?: TaskStatus;
      completionPercentage?: number;
      timeSpent?: number;
    },
    companyId: string,
  ): Promise<TaskResult> {
    const task = await this.taskRepository.findOne({
      where: { id, companyId },
    });

    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    // Update fields
    if (updates.title) task.title = updates.title;
    if (updates.description) task.description = updates.description;
    if (updates.assignedTo) task.assignedTo = updates.assignedTo;
    if (updates.priority) task.priority = updates.priority as TaskPriority;
    if (updates.dueDate) task.dueDate = new Date(updates.dueDate);
    if (updates.tags) task.tags = updates.tags;
    if (updates.estimatedHours) task.estimatedHours = updates.estimatedHours;
    if (updates.dependsOn) task.dependsOn = updates.dependsOn;
    if (updates.status) {
      task.status = updates.status;
      if (updates.status === TaskStatus.COMPLETED) {
        task.completedAt = new Date();
        task.completionPercentage = 100;
      }
    }
    if (updates.completionPercentage !== undefined) {
      task.completionPercentage = updates.completionPercentage;
      if (task.completionPercentage === 100 && task.status !== TaskStatus.COMPLETED) {
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
      }
    }
    if (updates.timeSpent !== undefined) {
      task.timeSpent = updates.timeSpent;
    }

    const saved = await this.taskRepository.save(task);
    return this.mapToResult(saved);
  }

  /**
   * Get tasks
   */
  async getTasks(
    companyId: string,
    filters?: {
      assignedTo?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      entityType?: string;
      entityId?: string;
      tags?: string[];
    },
  ): Promise<TaskResult[]> {
    const where: any = { companyId };

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    const tasks = await this.taskRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Filter by tags if provided
    let filteredTasks = tasks;
    if (filters?.tags && filters.tags.length > 0) {
      filteredTasks = tasks.filter((task) =>
        filters.tags!.some((tag) => task.tags?.includes(tag)),
      );
    }

    return filteredTasks.map((t) => this.mapToResult(t));
  }

  /**
   * Get task analytics
   */
  async getTaskAnalytics(
    companyId: string,
    userId?: string,
  ): Promise<TaskAnalytics> {
    const where: any = { companyId };
    if (userId) {
      where.assignedTo = userId;
    }

    const tasks = await this.taskRepository.find({ where });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

    const now = new Date();
    const overdueTasks = tasks.filter((t) => {
      return t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.COMPLETED;
    }).length;

    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.completedAt && t.createdAt,
    );
    let totalCompletionTime = 0;
    for (const task of completedTasksWithTime) {
      const completionTime = (task.completedAt!.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60); // Hours
      totalCompletionTime += completionTime;
    }
    const averageCompletionTime =
      completedTasksWithTime.length > 0 ? totalCompletionTime / completedTasksWithTime.length : 0;

    // Tasks by priority
    const tasksByPriority: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };
    tasks.forEach((task) => {
      tasksByPriority[task.priority]++;
    });

    // Tasks by status
    const tasksByStatus: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.BLOCKED]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.CANCELLED]: 0,
    };
    tasks.forEach((task) => {
      tasksByStatus[task.status]++;
    });

    // Team performance
    const userTasks = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.assignedTo) {
        if (!userTasks.has(task.assignedTo)) {
          userTasks.set(task.assignedTo, []);
        }
        userTasks.get(task.assignedTo)!.push(task);
      }
    });

    const teamPerformance = Array.from(userTasks.entries()).map(([userId, userTaskList]) => {
      const completed = userTaskList.filter((t) => t.status === TaskStatus.COMPLETED);
      const onTime = completed.filter((t) => {
        if (!t.dueDate || !t.completedAt) return false;
        return new Date(t.completedAt) <= new Date(t.dueDate);
      });

      let totalTime = 0;
      completed.forEach((t) => {
        if (t.completedAt && t.createdAt) {
          totalTime += (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }
      });

      return {
        userId,
        userName: `User ${userId.substring(0, 8)}`, // Simplified
        completedTasks: completed.length,
        averageTime: completed.length > 0 ? Math.round((totalTime / completed.length) * 100) / 100 : 0,
        onTimeRate: completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0,
      };
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      tasksByPriority,
      tasksByStatus,
      teamPerformance,
    };
  }

  /**
   * Add comment to task
   */
  async addComment(
    taskId: string,
    userId: string,
    userName: string,
    comment: string,
    companyId: string,
  ): Promise<TaskResult> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, companyId },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!task.comments) {
      task.comments = [];
    }

    task.comments.push({
      userId,
      userName,
      comment,
      createdAt: new Date().toISOString(),
    });

    const saved = await this.taskRepository.save(task);
    return this.mapToResult(saved);
  }

  private mapToResult(task: Task): TaskResult {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate?.toISOString().split('T')[0],
      completionPercentage: task.completionPercentage,
      timeSpent: Number(task.timeSpent),
      createdAt: task.createdAt.toISOString(),
    };
  }
}

