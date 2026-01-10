import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowEngineEnhancedService } from './services/workflow-engine-enhanced.service';
import {
  CreateWorkflowEnhancedDto,
  ExecuteWorkflowEnhancedDto,
} from './dto/workflow-engine-enhanced.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Workflow Engine Enhanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow-engine-enhanced')
export class WorkflowEngineEnhancedController {
  constructor(private readonly workflowService: WorkflowEngineEnhancedService) {}

  @Post('workflows')
  @ApiOperation({ summary: 'Create workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully' })
  createWorkflow(@Body() createDto: CreateWorkflowEnhancedDto) {
    return this.workflowService.createWorkflow(createDto);
  }

  @Get('workflows')
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows' })
  findAllWorkflows(@Query('isActive') isActive?: boolean) {
    return this.workflowService.findAllWorkflows(
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  findOneWorkflow(@Param('id') id: string) {
    return this.workflowService.findOneWorkflow(id);
  }

  @Post('workflows/:id/execute')
  @ApiOperation({ summary: 'Execute workflow' })
  @ApiResponse({ status: 200, description: 'Workflow execution started' })
  executeWorkflow(
    @Param('id') id: string,
    @Body() executeDto: ExecuteWorkflowEnhancedDto,
  ) {
    return this.workflowService.executeWorkflow(id, executeDto);
  }

  @Get('executions')
  @ApiOperation({ summary: 'Get execution history' })
  @ApiResponse({ status: 200, description: 'Execution history' })
  getExecutionHistory(
    @Query('workflowId') workflowId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.workflowService.getExecutionHistory(workflowId, limit);
  }
}

