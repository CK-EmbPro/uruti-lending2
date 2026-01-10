import { Injectable, Logger } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowSeedService {
  private readonly logger = new Logger(WorkflowSeedService.name);

  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Seed default workflows for the system
   */
  async seedDefaultWorkflows(): Promise<void> {
    this.logger.log('Starting workflow seed...');

    try {
      // Check if workflows already exist
      const existingWorkflows = await this.workflowService.findAll();
      if (existingWorkflows.length > 0) {
        this.logger.log(
          `Found ${existingWorkflows.length} existing workflows. Skipping seed.`,
        );
        return;
      }

      // 1. Loan Application Workflow
      await this.createLoanApplicationWorkflow();

      // 2. Loan Workflow
      await this.createLoanWorkflow();

      // 3. Loan Restructure Workflow
      await this.createLoanRestructureWorkflow();

      this.logger.log('Default workflows seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding workflows: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create Loan Application Workflow
   */
  private async createLoanApplicationWorkflow(): Promise<void> {
    const workflow: CreateWorkflowDto = {
      workflowName: 'Loan Application Workflow',
      documentType: 'Loan Application',
      isActive: true,
      description:
        'Multi-step approval workflow for loan applications with KYC verification',
      states: [
        {
          state: 'Draft',
          docStatus: 0,
          allowEdit: true,
          message: 'Application is in draft state and can be edited',
          sendEmail: false,
        },
        {
          state: 'Initiated',
          docStatus: 0,
          allowEdit: false,
          message: 'Application has been initiated and is ready for review',
          sendEmail: true,
        },
        {
          state: 'KYC Pending',
          docStatus: 0,
          allowEdit: false,
          message: 'KYC verification is pending',
          sendEmail: true,
        },
        {
          state: 'KYC Complete',
          docStatus: 0,
          allowEdit: false,
          message: 'KYC verification completed, ready for approval',
          sendEmail: true,
        },
        {
          state: 'Approved',
          docStatus: 1,
          allowEdit: false,
          message: 'Application approved and ready to create loan',
          sendEmail: true,
        },
        {
          state: 'Rejected',
          docStatus: 1,
          allowEdit: false,
          message: 'Application has been rejected',
          sendEmail: true,
        },
      ],
      transitions: [
        {
          state: 'Draft',
          action: 'Initiate',
          nextState: 'Initiated',
          allowed: 'Loan Officer',
          allowSelfApproval: true,
        },
        {
          state: 'Initiated',
          action: 'Review',
          nextState: 'KYC Pending',
          allowed: 'Loan Processor',
          allowSelfApproval: false,
        },
        {
          state: 'Initiated',
          action: 'Reject',
          nextState: 'Rejected',
          allowed: 'Loan Processor',
          allowSelfApproval: false,
        },
        {
          state: 'KYC Pending',
          action: 'Complete KYC',
          nextState: 'KYC Complete',
          allowed: 'Loan Appraiser',
          allowSelfApproval: false,
        },
        {
          state: 'KYC Pending',
          action: 'Reject',
          nextState: 'Rejected',
          allowed: 'Loan Appraiser',
          allowSelfApproval: false,
        },
        {
          state: 'KYC Complete',
          action: 'Approve',
          nextState: 'Approved',
          allowed: 'Loan Underwriter',
          allowSelfApproval: false,
        },
        {
          state: 'KYC Complete',
          action: 'Reject',
          nextState: 'Rejected',
          allowed: 'Loan Underwriter',
          allowSelfApproval: false,
        },
      ],
    };

    await this.workflowService.create(workflow);
    this.logger.log('Loan Application Workflow created');
  }

  /**
   * Create Loan Workflow
   */
  private async createLoanWorkflow(): Promise<void> {
    const workflow: CreateWorkflowDto = {
      workflowName: 'Loan Workflow',
      documentType: 'Loan',
      isActive: true,
      description: 'Workflow for loan submission and approval',
      states: [
        {
          state: 'Draft',
          docStatus: 0,
          allowEdit: true,
          message: 'Loan is in draft state',
          sendEmail: false,
        },
        {
          state: 'Under Review',
          docStatus: 0,
          allowEdit: false,
          message: 'Loan is under review',
          sendEmail: true,
        },
        {
          state: 'Sanctioned',
          docStatus: 1,
          allowEdit: false,
          message: 'Loan has been sanctioned',
          sendEmail: true,
        },
        {
          state: 'Rejected',
          docStatus: 1,
          allowEdit: false,
          message: 'Loan has been rejected',
          sendEmail: true,
        },
      ],
      transitions: [
        {
          state: 'Draft',
          action: 'Submit for Review',
          nextState: 'Under Review',
          allowed: 'Loan Officer',
          allowSelfApproval: true,
        },
        {
          state: 'Under Review',
          action: 'Approve',
          nextState: 'Sanctioned',
          allowed: 'Loan Manager,Loan Underwriter',
          allowSelfApproval: false,
        },
        {
          state: 'Under Review',
          action: 'Reject',
          nextState: 'Rejected',
          allowed: 'Loan Manager,Loan Underwriter',
          allowSelfApproval: false,
        },
      ],
    };

    await this.workflowService.create(workflow);
    this.logger.log('Loan Workflow created');
  }

  /**
   * Create Loan Restructure Workflow
   */
  private async createLoanRestructureWorkflow(): Promise<void> {
    const workflow: CreateWorkflowDto = {
      workflowName: 'Loan Restructure Workflow',
      documentType: 'Loan Restructure',
      isActive: true,
      description: 'Workflow for loan restructure requests',
      states: [
        {
          state: 'Initiated',
          docStatus: 0,
          allowEdit: true,
          message: 'Restructure request initiated',
          sendEmail: false,
        },
        {
          state: 'Under Review',
          docStatus: 0,
          allowEdit: false,
          message: 'Restructure request under review',
          sendEmail: true,
        },
        {
          state: 'Approved',
          docStatus: 1,
          allowEdit: false,
          message: 'Restructure request approved',
          sendEmail: true,
        },
        {
          state: 'Rejected',
          docStatus: 1,
          allowEdit: false,
          message: 'Restructure request rejected',
          sendEmail: true,
        },
      ],
      transitions: [
        {
          state: 'Initiated',
          action: 'Submit for Review',
          nextState: 'Under Review',
          allowed: 'Loan Officer',
          allowSelfApproval: true,
        },
        {
          state: 'Under Review',
          action: 'Approve',
          nextState: 'Approved',
          allowed: 'Loan Manager,Loan Underwriter',
          allowSelfApproval: false,
        },
        {
          state: 'Under Review',
          action: 'Reject',
          nextState: 'Rejected',
          allowed: 'Loan Manager,Loan Underwriter',
          allowSelfApproval: false,
        },
      ],
    };

    await this.workflowService.create(workflow);
    this.logger.log('Loan Restructure Workflow created');
  }
}

