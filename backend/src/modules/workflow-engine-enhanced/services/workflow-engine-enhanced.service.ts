import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEnhanced } from '../entities/workflow-enhanced.entity';
import { WorkflowExecutionEnhanced } from '../entities/workflow-execution-enhanced.entity';
import {
  CreateWorkflowEnhancedDto,
  ExecuteWorkflowEnhancedDto,
  WorkflowExecutionStatus,
} from '../dto/workflow-engine-enhanced.dto';

@Injectable()
export class WorkflowEngineEnhancedService {
  private readonly logger = new Logger(WorkflowEngineEnhancedService.name);

  constructor(
    @InjectRepository(WorkflowEnhanced)
    private workflowRepository: Repository<WorkflowEnhanced>,
    @InjectRepository(WorkflowExecutionEnhanced)
    private executionRepository: Repository<WorkflowExecutionEnhanced>,
  ) {}

  async createWorkflow(createDto: CreateWorkflowEnhancedDto): Promise<WorkflowEnhanced> {
    const workflow = this.workflowRepository.create(createDto);
    return this.workflowRepository.save(workflow);
  }

  async findAllWorkflows(isActive?: boolean): Promise<WorkflowEnhanced[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.workflowRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneWorkflow(id: string): Promise<WorkflowEnhanced> {
    const workflow = await this.workflowRepository.findOne({ where: { id } });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async executeWorkflow(
    workflowId: string,
    executeDto: ExecuteWorkflowEnhancedDto,
  ): Promise<WorkflowExecutionEnhanced> {
    const workflow = await this.findOneWorkflow(workflowId);

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const execution = this.executionRepository.create({
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: WorkflowExecutionStatus.PENDING,
      inputData: executeDto.inputData,
      executionTrace: [],
    });

    const saved = await this.executionRepository.save(execution);

    // Execute workflow asynchronously
    this.runWorkflow(saved.id, workflow, executeDto).catch(error => {
      this.logger.error(`Error executing workflow ${saved.id}: ${error.message}`);
    });

    return saved;
  }

  private async runWorkflow(
    executionId: string,
    workflow: WorkflowEnhanced,
    executeDto: ExecuteWorkflowEnhancedDto,
  ): Promise<void> {
    const execution = await this.executionRepository.findOne({ where: { id: executionId } });
    if (!execution) return;

    execution.status = WorkflowExecutionStatus.RUNNING;
    execution.startedAt = new Date();
    await this.executionRepository.save(execution);

    try {
      const trace: any[] = [];
      const nodes = workflow.definition.nodes;
      const edges = workflow.definition.edges;
      const currentNodeId = nodes.find(n => n.type === 'START')?.id;

      if (!currentNodeId) {
        throw new Error('Workflow must have a START node');
      }

      // Execute workflow nodes
      let currentId = currentNodeId;
      const visited = new Set<string>();

      while (currentId) {
        if (visited.has(currentId)) {
          throw new Error(`Circular reference detected in workflow`);
        }
        visited.add(currentId);

        const node = nodes.find(n => n.id === currentId);
        if (!node) break;

        const nodeStartTime = Date.now();

        // Execute node
        const nodeOutput = await this.executeNode(node, executeDto.inputData, executeDto.context);

        const nodeDuration = Date.now() - nodeStartTime;

        trace.push({
          nodeId: node.id,
          nodeName: node.name,
          timestamp: new Date(),
          status: 'completed',
          output: nodeOutput,
        });

        // Find next node
        const nextEdge = edges.find(e => e.from === currentId);
        if (!nextEdge || nextEdge.to === 'END') {
          break;
        }

        currentId = nextEdge.to;
      }

      execution.status = WorkflowExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.duration = Date.now() - execution.startedAt.getTime();
      execution.executionTrace = trace;
      execution.outputData = trace[trace.length - 1]?.output || {};

      // Update workflow statistics
      workflow.executionCount += 1;
      workflow.successCount += 1;
      workflow.lastExecutedAt = new Date();
      await this.workflowRepository.save(workflow);
    } catch (error: any) {
      this.logger.error(`Workflow execution ${executionId} failed: ${error.message}`);
      execution.status = WorkflowExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      execution.completedAt = new Date();
      execution.duration = Date.now() - execution.startedAt.getTime();

      // Update workflow statistics
      workflow.executionCount += 1;
      workflow.failureCount += 1;
      await this.workflowRepository.save(workflow);
    } finally {
      await this.executionRepository.save(execution);
    }
  }

  private async executeNode(
    node: any,
    inputData: Record<string, any>,
    context?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // TODO: Implement actual node execution logic
    // This would handle different node types:
    // - TASK: Execute a task/action
    // - DECISION: Evaluate condition and branch
    // - PARALLEL: Execute multiple branches in parallel
    // - LOOP: Execute loop logic
    // - SUB_WORKFLOW: Execute nested workflow

    this.logger.log(`Executing node ${node.id} (${node.type})`);

    // Simulate node execution
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      nodeId: node.id,
      result: 'completed',
      data: inputData,
    };
  }

  async getExecutionHistory(workflowId?: string, limit: number = 50): Promise<WorkflowExecutionEnhanced[]> {
    const where: any = {};
    if (workflowId) where.workflowId = workflowId;

    return this.executionRepository.find({
      where,
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}

