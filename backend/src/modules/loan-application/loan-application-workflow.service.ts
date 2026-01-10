import { Injectable } from '@nestjs/common';
import { WorkflowIntegrationService } from '../workflow/workflow-integration.service';
import { LoanApplication, ApplicationStatus } from './entities/loan-application.entity';

/**
 * Helper service for loan application workflow operations
 */
@Injectable()
export class LoanApplicationWorkflowService {
  constructor(
    private readonly workflowIntegrationService: WorkflowIntegrationService,
  ) {}

  /**
   * Perform workflow action on application
   */
  async performWorkflowAction(
    application: LoanApplication,
    action: string,
    userId: string,
    userRoles?: string[],
    comments?: string,
  ): Promise<{ newState: ApplicationStatus; workflowActionId: string }> {
    const result = await this.workflowIntegrationService.performWorkflowAction(
      'Loan Application',
      application.id,
      application.status,
      action,
      userId,
      undefined,
      comments,
      userRoles,
    );

    return {
      newState: result.newState as ApplicationStatus,
      workflowActionId: result.workflowActionId,
    };
  }

  /**
   * Get available workflow actions
   */
  async getAvailableActions(
    application: LoanApplication,
    userRoles?: string[],
  ) {
    return await this.workflowIntegrationService.getAvailableActions(
      'Loan Application',
      application.status,
      userRoles,
    );
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(application: LoanApplication) {
    return await this.workflowIntegrationService.getWorkflowHistory(
      'Loan Application',
      application.id,
    );
  }

  /**
   * Check if workflow is enabled
   */
  async isWorkflowEnabled(): Promise<boolean> {
    return await this.workflowIntegrationService.isWorkflowEnabled(
      'Loan Application',
    );
  }
}

