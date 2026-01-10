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
import { WorkflowAutomationService } from './services/workflow-automation.service';
import {
  CreateWorkflowTriggerDto,
  WorkflowTriggerResult,
} from './dto/workflow-automation.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('workflow-automation')
@ApiBearerAuth('JWT-auth')
@Controller('workflow-automation')
@UseGuards(CompanyGuard)
export class WorkflowAutomationController {
  constructor(private readonly automationService: WorkflowAutomationService) {}

  @Post('triggers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create workflow trigger',
    description: 'Creates a new workflow trigger for event-driven, scheduled, or conditional workflow execution.',
  })
  @ApiBody({ type: CreateWorkflowTriggerDto })
  @ApiResponse({
    status: 201,
    description: 'Workflow trigger created successfully',
  })
  async createTrigger(
    @Body() dto: CreateWorkflowTriggerDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.automationService.createTrigger(dto, companyId);
  }

  @Get('triggers')
  @ApiOperation({
    summary: 'Get all workflow triggers',
    description: 'Returns all workflow triggers, optionally filtered by workflow ID.',
  })
  @ApiQuery({ name: 'workflowId', required: false, description: 'Filter by workflow ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow triggers retrieved successfully',
  })
  async getTriggers(
    @Query('workflowId') workflowId: string,
    @Request() req: any,
  ) {
    return await this.automationService.getTriggers(workflowId);
  }

  @Get('triggers/:id')
  @ApiOperation({
    summary: 'Get workflow trigger by ID',
    description: 'Returns a specific workflow trigger by ID.',
  })
  @ApiParam({ name: 'id', description: 'Trigger ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow trigger retrieved successfully',
  })
  async getTrigger(
    @Param('id') id: string,
  ) {
    return await this.automationService.getTrigger(id);
  }

  @Patch('triggers/:id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle trigger active status',
    description: 'Activates or deactivates a workflow trigger.',
  })
  @ApiParam({ name: 'id', description: 'Trigger ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Trigger status updated successfully',
  })
  async toggleTrigger(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    await this.automationService.toggleTrigger(id, body.isActive);
    return { message: 'Trigger status updated successfully' };
  }

  @Get('executions')
  @ApiOperation({
    summary: 'Get workflow execution history',
    description: 'Returns workflow execution history with optional filtering.',
  })
  @ApiQuery({ name: 'triggerId', required: false, description: 'Filter by trigger ID' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Execution history retrieved successfully',
  })
  async getExecutionHistory(
    @Query('triggerId') triggerId: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('limit') limit: number,
  ) {
    return await this.automationService.getExecutionHistory(
      triggerId,
      entityType,
      entityId,
      limit || 50,
    );
  }
}

