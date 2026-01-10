import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskManagementService } from './services/task-management.service';
import {
  CreateTaskDto,
  TaskStatus,
  TaskPriority,
} from './dto/task-management.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('task-management')
@ApiBearerAuth('JWT-auth')
@Controller('task-management')
@UseGuards(CompanyGuard)
export class TaskManagementController {
  constructor(private readonly taskService: TaskManagementService) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create task',
    description: 'Creates a new task with assignment, priority, due date, and dependencies. Supports entity linking and tags.',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
  })
  async createTask(
    @Body() dto: CreateTaskDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'system';
    return await this.taskService.createTask(dto, companyId, userId);
  }

  @Patch('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update task',
    description: 'Updates task details including status, completion percentage, time spent, and other fields.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        assignedTo: { type: 'string' },
        dueDate: { type: 'string' },
        completionPercentage: { type: 'number', minimum: 0, maximum: 100 },
        timeSpent: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
  })
  async updateTask(
    @Param('id') id: string,
    @Body() updates: any,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.taskService.updateTask(id, updates, companyId);
  }

  @Get('tasks')
  @ApiOperation({
    summary: 'Get tasks',
    description: 'Returns tasks with optional filtering by assignee, status, priority, entity, or tags.',
  })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assigned user ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
  })
  async getTasks(
    @Query('assignedTo') assignedTo: string,
    @Query('status') status: TaskStatus,
    @Query('priority') priority: TaskPriority,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('tags') tags: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.taskService.getTasks(companyId, {
      assignedTo,
      status,
      priority,
      entityType,
      entityId,
      tags: tags ? tags.split(',') : undefined,
    });
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get task analytics',
    description: 'Returns comprehensive task analytics including completion rates, team performance, and task distribution.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Task analytics retrieved successfully',
  })
  async getTaskAnalytics(
    @Query('userId') userId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.taskService.getTaskAnalytics(companyId, userId);
  }

  @Post('tasks/:id/comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add comment to task',
    description: 'Adds a comment to a task for collaboration and communication.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        comment: { type: 'string', example: 'This task is blocked waiting for approval' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comment added successfully',
  })
  async addComment(
    @Param('id') id: string,
    @Body() body: { comment: string },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'system';
    const userName = req.user?.name || 'System User';
    return await this.taskService.addComment(id, userId, userName, body.comment, companyId);
  }
}

