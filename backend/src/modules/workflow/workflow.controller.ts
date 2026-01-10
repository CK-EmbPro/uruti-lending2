import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { WorkflowSeedService } from './workflow-seed.service';
import { WorkflowAutomationService } from './services/workflow-automation.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { PerformWorkflowActionDto } from './dto/perform-workflow-action.dto';
import {
  CreateWorkflowTriggerDto,
  ExecuteWorkflowDto,
  GetWorkflowExecutionsDto,
} from './dto/workflow-automation.dto';
import { EventType } from './entities/workflow-trigger.entity';

@ApiTags('workflows')
@ApiBearerAuth('JWT-auth')
@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly seedService: WorkflowSeedService,
    private readonly automationService: WorkflowAutomationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new workflow',
    description: 'Creates a new workflow with states and transitions',
  })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
  })
  create(@Body() createDto: CreateWorkflowDto) {
    return this.workflowService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all workflows',
    description: 'Retrieves all workflows with their states and transitions',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflows retrieved successfully',
  })
  findAll() {
    return this.workflowService.findAll();
  }

  @Get('active/:documentType')
  @ApiOperation({
    summary: 'Get active workflow for document type',
    description: 'Retrieves the active workflow for a specific document type',
  })
  @ApiParam({ name: 'documentType', description: 'Document type', example: 'Loan Application' })
  @ApiResponse({
    status: 200,
    description: 'Active workflow found',
  })
  @ApiResponse({
    status: 404,
    description: 'No active workflow found',
  })
  getActiveWorkflow(@Param('documentType') documentType: string) {
    return this.workflowService.getActiveWorkflow(documentType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workflow by ID',
    description: 'Retrieves a specific workflow by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Workflow UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Workflow found',
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found',
  })
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Get('actions/available')
  @ApiOperation({
    summary: 'Get available actions',
    description: 'Gets available workflow actions for a document in current state',
  })
  @ApiQuery({ name: 'documentType', description: 'Document type', example: 'Loan Application' })
  @ApiQuery({ name: 'currentState', description: 'Current state', example: 'Draft' })
  @ApiQuery({ name: 'userRoles', required: false, description: 'User roles (comma-separated)', example: 'Loan Officer' })
  @ApiResponse({
    status: 200,
    description: 'Available actions retrieved successfully',
  })
  getAvailableActions(
    @Query('documentType') documentType: string,
    @Query('currentState') currentState: string,
    @Query('userRoles') userRoles?: string,
  ) {
    const roles = userRoles ? userRoles.split(',').map((r) => r.trim()) : undefined;
    return this.workflowService.getAvailableActions(documentType, currentState, roles);
  }

  @Post('actions/perform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform workflow action',
    description: 'Performs a workflow action on a document and transitions it to the next state',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: { type: 'string', example: 'Loan Application' },
        documentId: { type: 'string', example: 'application-uuid' },
        currentState: { type: 'string', example: 'Draft' },
        action: { type: 'string', example: 'Initiate' },
        comments: { type: 'string', example: 'Application looks good' },
        userId: { type: 'string', example: 'user-uuid' },
        userName: { type: 'string', example: 'John Doe' },
      },
      required: ['documentType', 'documentId', 'currentState', 'action', 'userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Action performed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Action not available or invalid',
  })
  performAction(
    @Body()
    body: {
      documentType: string;
      documentId: string;
      currentState: string;
      action: string;
      comments?: string;
      userId: string;
      userName?: string;
    },
  ) {
    return this.workflowService.performAction(
      body.documentType,
      body.documentId,
      body.currentState,
      { action: body.action, comments: body.comments },
      body.userId,
      body.userName,
    );
  }

  @Get('history/:documentType/:documentId')
  @ApiOperation({
    summary: 'Get workflow history',
    description: 'Retrieves the workflow action history for a document',
  })
  @ApiParam({ name: 'documentType', description: 'Document type', example: 'Loan Application' })
  @ApiParam({ name: 'documentId', description: 'Document ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Workflow history retrieved successfully',
  })
  getWorkflowHistory(
    @Param('documentType') documentType: string,
    @Param('documentId') documentId: string,
  ) {
    return this.workflowService.getWorkflowHistory(documentType, documentId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update workflow',
    description: 'Updates workflow metadata (name, description, active status)',
  })
  @ApiParam({ name: 'id', description: 'Workflow UUID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        workflowName: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated successfully',
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateWorkflowDto>,
  ) {
    return this.workflowService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete workflow',
    description: 'Permanently deletes a workflow',
  })
  @ApiParam({ name: 'id', description: 'Workflow UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Workflow deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed default workflows',
    description: 'Creates default workflows for Loan Application, Loan, and Loan Restructure',
  })
  @ApiResponse({
    status: 200,
    description: 'Default workflows seeded successfully',
  })
  async seedWorkflows() {
    await this.seedService.seedDefaultWorkflows();
    return { message: 'Default workflows seeded successfully' };
  }

  // Workflow Automation Endpoints
  @Post('triggers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a workflow trigger' })
  @ApiResponse({ status: 201, description: 'Workflow trigger created' })
  createTrigger(@Body() dto: CreateWorkflowTriggerDto) {
    return this.automationService.createTrigger(dto);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a workflow manually' })
  @ApiResponse({ status: 200, description: 'Workflow executed' })
  executeWorkflow(@Body() dto: ExecuteWorkflowDto) {
    return this.automationService.executeWorkflow(dto);
  }

  @Get('executions')
  @ApiOperation({ summary: 'Get workflow executions' })
  @ApiResponse({ status: 200, description: 'Workflow executions retrieved' })
  getExecutions(@Query() filters: GetWorkflowExecutionsDto) {
    return this.automationService.getExecutions(filters);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get workflow performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  @ApiQuery({ name: 'workflowId', required: false })
  getPerformanceMetrics(@Query('workflowId') workflowId?: string) {
    return this.automationService.getPerformanceMetrics(workflowId);
  }

  @Post('events/:eventType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger workflows for an event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  @ApiParam({ name: 'eventType', enum: EventType })
  handleEvent(
    @Param('eventType') eventType: EventType,
    @Body() body: { documentType: string; documentId: string; eventData?: Record<string, any> },
  ) {
    return this.automationService.handleEvent(
      eventType,
      body.documentType,
      body.documentId,
      body.eventData,
    );
  }
}

