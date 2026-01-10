import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowState } from './entities/workflow-state.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { WorkflowAction } from './entities/workflow-action.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { PerformWorkflowActionDto } from './dto/perform-workflow-action.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowState)
    private readonly stateRepository: Repository<WorkflowState>,
    @InjectRepository(WorkflowTransition)
    private readonly transitionRepository: Repository<WorkflowTransition>,
    @InjectRepository(WorkflowAction)
    private readonly actionRepository: Repository<WorkflowAction>,
  ) {}

  /**
   * Create a new workflow
   */
  async create(createDto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      workflowName: createDto.workflowName,
      documentType: createDto.documentType,
      isActive: createDto.isActive ?? true,
      description: createDto.description,
    });

    const savedWorkflow = await this.workflowRepository.save(workflow);

    // Create states
    const states = createDto.states.map((stateDto) =>
      this.stateRepository.create({
        ...stateDto,
        workflowId: savedWorkflow.id,
      }),
    );
    await this.stateRepository.save(states);

    // Create transitions
    const transitions = createDto.transitions.map((transDto) =>
      this.transitionRepository.create({
        ...transDto,
        workflowId: savedWorkflow.id,
      }),
    );
    await this.transitionRepository.save(transitions);

    return this.findOne(savedWorkflow.id);
  }

  /**
   * Get workflow by ID
   */
  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['states', 'transitions'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  /**
   * Get active workflow for document type
   */
  async getActiveWorkflow(documentType: string): Promise<Workflow | null> {
    return await this.workflowRepository.findOne({
      where: { documentType, isActive: true },
      relations: ['states', 'transitions'],
    });
  }

  /**
   * Get all workflows
   */
  async findAll(): Promise<Workflow[]> {
    return await this.workflowRepository.find({
      relations: ['states', 'transitions'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get available actions for a document in current state
   */
  async getAvailableActions(
    documentType: string,
    currentState: string,
    userRoles?: string[],
  ): Promise<WorkflowTransition[]> {
    const workflow = await this.getActiveWorkflow(documentType);

    if (!workflow) {
      return []; // No workflow configured, return empty
    }

    const transitions = workflow.transitions.filter(
      (t) => t.state === currentState,
    );

    // Filter by user roles if provided
    if (userRoles && userRoles.length > 0) {
      return transitions.filter((t) => {
        const allowedRoles = t.allowed.split(',').map((r) => r.trim());
        return userRoles.some((role) => allowedRoles.includes(role));
      });
    }

    return transitions;
  }

  /**
   * Perform workflow action
   */
  async performAction(
    documentType: string,
    documentId: string,
    currentState: string,
    actionDto: PerformWorkflowActionDto,
    userId: string,
    userName?: string,
  ): Promise<{
    success: boolean;
    newState: string;
    workflowAction: WorkflowAction;
  }> {
    const workflow = await this.getActiveWorkflow(documentType);

    if (!workflow) {
      throw new BadRequestException(
        `No active workflow found for document type: ${documentType}`,
      );
    }

    // Find the transition
    const transition = workflow.transitions.find(
      (t) => t.state === currentState && t.action === actionDto.action,
    );

    if (!transition) {
      throw new BadRequestException(
        `Action '${actionDto.action}' is not available from state '${currentState}'`,
      );
    }

    // Validate next state exists
    const nextState = workflow.states.find(
      (s) => s.state === transition.nextState,
    );

    if (!nextState) {
      throw new BadRequestException(
        `Next state '${transition.nextState}' does not exist in workflow`,
      );
    }

    // Create workflow action record
    const workflowAction = this.actionRepository.create({
      documentType,
      documentId,
      workflowId: workflow.id,
      fromState: currentState,
      toState: transition.nextState,
      action: actionDto.action,
      userId,
      userName,
      comments: actionDto.comments,
      actionDate: new Date(),
    });

    await this.actionRepository.save(workflowAction);

    return {
      success: true,
      newState: transition.nextState,
      workflowAction,
    };
  }

  /**
   * Get workflow history for a document
   */
  async getWorkflowHistory(
    documentType: string,
    documentId: string,
  ): Promise<WorkflowAction[]> {
    return await this.actionRepository.find({
      where: { documentType, documentId },
      order: { actionDate: 'DESC' },
    });
  }

  /**
   * Update workflow
   */
  async update(id: string, updateDto: Partial<CreateWorkflowDto>): Promise<Workflow> {
    const workflow = await this.findOne(id);

    if (updateDto.workflowName) {
      workflow.workflowName = updateDto.workflowName;
    }
    if (updateDto.description !== undefined) {
      workflow.description = updateDto.description;
    }
    if (updateDto.isActive !== undefined) {
      workflow.isActive = updateDto.isActive;
    }

    return await this.workflowRepository.save(workflow);
  }

  /**
   * Delete workflow
   */
  async remove(id: string): Promise<void> {
    const workflow = await this.findOne(id);
    await this.workflowRepository.remove(workflow);
  }
}

