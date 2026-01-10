import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowExceptionService } from './services/workflow-exception.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  BulkAssignTasksDto,
  AddTaskCommentDto,
  EscalateTaskDto,
  QueryTasksDto,
} from './dto/task.dto';
import {
  CreateSLATrackingDto,
  UpdateSLATrackingDto,
  EscalateSLADto,
  QuerySLATrackingsDto,
} from './dto/sla-tracking.dto';
import {
  CreateBulkOperationDto,
  PreviewBulkOperationDto,
  ApproveBulkOperationDto,
  ExecuteBulkOperationDto,
  QueryBulkOperationsDto,
} from './dto/bulk-operation.dto';

@ApiTags('workflow-exception')
@ApiBearerAuth()
@Controller('workflow-exception')
export class WorkflowExceptionController {
  constructor(private readonly workflowExceptionService: WorkflowExceptionService) {}

  /**
   * UC-055: Manual Task Assignment
   */

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create task',
    description: 'Creates a new task for manual assignment',
  })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.workflowExceptionService.createTask(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get tasks',
    description: 'Retrieves tasks with optional filters',
  })
  async getTasks(@Query() filters: QueryTasksDto) {
    return this.workflowExceptionService.getTasks(filters);
  }

  @Get('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get task',
    description: 'Retrieves a specific task by ID',
  })
  async getTask(@Param('id') id: string) {
    return this.workflowExceptionService.getTask(id);
  }

  @Put('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update task',
    description: 'Updates task information and status',
  })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.updateTask(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('tasks/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign task',
    description: 'Assigns a task to a team member',
  })
  async assignTask(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.assignTask(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('tasks/bulk-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk assign tasks',
    description: 'Assigns multiple tasks to a team member',
  })
  async bulkAssignTasks(@Body() dto: BulkAssignTasksDto, @Request() req: any) {
    return this.workflowExceptionService.bulkAssignTasks(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('tasks/:id/comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add task comment',
    description: 'Adds a comment to a task',
  })
  async addTaskComment(
    @Param('id') id: string,
    @Body() dto: AddTaskCommentDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.addTaskComment(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('tasks/:id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate task',
    description: 'Escalates a task to a supervisor',
  })
  async escalateTask(
    @Param('id') id: string,
    @Body() dto: EscalateTaskDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.escalateTask(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-056: SLA Breach Alert
   */

  @Post('sla-trackings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create SLA tracking',
    description: 'Creates SLA tracking for a task',
  })
  @ApiResponse({ status: 201, description: 'SLA tracking created successfully' })
  async createSLATracking(@Body() dto: CreateSLATrackingDto, @Request() req: any) {
    return this.workflowExceptionService.createSLATracking(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('sla-trackings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SLA trackings',
    description: 'Retrieves SLA trackings with optional filters',
  })
  async getSLATrackings(@Query() filters: QuerySLATrackingsDto) {
    return this.workflowExceptionService.getSLATrackings(filters);
  }

  @Get('sla-trackings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get SLA tracking',
    description: 'Retrieves a specific SLA tracking by ID',
  })
  async getSLATracking(@Param('id') id: string) {
    return this.workflowExceptionService.getSLATracking(id);
  }

  @Post('sla-trackings/check-breaches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check SLA breaches',
    description: 'Checks for SLA breaches and updates statuses',
  })
  async checkSLABreaches() {
    return this.workflowExceptionService.checkSLABreaches();
  }

  @Post('sla-trackings/:id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate SLA',
    description: 'Escalates an SLA breach to a supervisor',
  })
  async escalateSLA(
    @Param('id') id: string,
    @Body() dto: EscalateSLADto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.escalateSLA(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-057: Bulk Operation Execution
   */

  @Post('bulk-operations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bulk operation',
    description: 'Creates a new bulk operation',
  })
  @ApiResponse({ status: 201, description: 'Bulk operation created successfully' })
  async createBulkOperation(@Body() dto: CreateBulkOperationDto, @Request() req: any) {
    return this.workflowExceptionService.createBulkOperation(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('bulk-operations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bulk operations',
    description: 'Retrieves bulk operations with optional filters',
  })
  async getBulkOperations(@Query() filters: QueryBulkOperationsDto) {
    return this.workflowExceptionService.getBulkOperations(filters);
  }

  @Get('bulk-operations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bulk operation',
    description: 'Retrieves a specific bulk operation by ID',
  })
  async getBulkOperation(@Param('id') id: string) {
    return this.workflowExceptionService.getBulkOperation(id);
  }

  @Post('bulk-operations/:id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview bulk operation',
    description: 'Generates a preview of the bulk operation impact',
  })
  async previewBulkOperation(
    @Param('id') id: string,
    @Body() dto: PreviewBulkOperationDto,
  ) {
    return this.workflowExceptionService.previewBulkOperation(id, dto);
  }

  @Post('bulk-operations/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve bulk operation',
    description: 'Approves a bulk operation for execution',
  })
  async approveBulkOperation(
    @Param('id') id: string,
    @Body() dto: ApproveBulkOperationDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.approveBulkOperation(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('bulk-operations/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute bulk operation',
    description: 'Executes an approved bulk operation',
  })
  async executeBulkOperation(
    @Param('id') id: string,
    @Body() dto: ExecuteBulkOperationDto,
    @Request() req: any,
  ) {
    return this.workflowExceptionService.executeBulkOperation(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }
}

