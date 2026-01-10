import { Injectable } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

/**
 * Service to integrate workflow engine with document services
 * Provides helper methods for common workflow operations
 */
@Injectable()
export class WorkflowIntegrationService {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Check if workflow is enabled for document type
   */
  async isWorkflowEnabled(documentType: string): Promise<boolean> {
    const workflow = await this.workflowService.getActiveWorkflow(documentType);
    return workflow !== null;
  }

  /**
   * Get next state after performing an action
   * Returns null if action is not available
   */
  async getNextState(
    documentType: string,
    currentState: string,
    action: string,
  ): Promise<string | null> {
    const workflow = await this.workflowService.getActiveWorkflow(documentType);

    if (!workflow) {
      return null;
    }

    const transition = workflow.transitions.find(
      (t) => t.state === currentState && t.action === action,
    );

    return transition ? transition.nextState : null;
  }

  /**
   * Validate if action is allowed from current state
   */
  async validateAction(
    documentType: string,
    currentState: string,
    action: string,
    userRoles?: string[],
  ): Promise<{ valid: boolean; message?: string }> {
    const workflow = await this.workflowService.getActiveWorkflow(documentType);

    if (!workflow) {
      // No workflow configured, allow action
      return { valid: true };
    }

    const transition = workflow.transitions.find(
      (t) => t.state === currentState && t.action === action,
    );

    if (!transition) {
      return {
        valid: false,
        message: `Action '${action}' is not available from state '${currentState}'`,
      };
    }

    // Check role permissions if provided
    if (userRoles && userRoles.length > 0) {
      const allowedRoles = transition.allowed.split(',').map((r) => r.trim());
      const hasPermission = userRoles.some((role) =>
        allowedRoles.includes(role),
      );

      if (!hasPermission) {
        return {
          valid: false,
          message: `User does not have required role to perform '${action}'. Required roles: ${transition.allowed}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get available actions for a document
   */
  async getAvailableActions(
    documentType: string,
    currentState: string,
    userRoles?: string[],
  ) {
    return await this.workflowService.getAvailableActions(
      documentType,
      currentState,
      userRoles,
    );
  }

  /**
   * Get workflow history for a document
   */
  async getWorkflowHistory(documentType: string, documentId: string) {
    return await this.workflowService.getWorkflowHistory(
      documentType,
      documentId,
    );
  }

  /**
   * Perform workflow action and return new state
   * This is a convenience method that performs the action and returns the new state
   */
  async performWorkflowAction(
    documentType: string,
    documentId: string,
    currentState: string,
    action: string,
    userId: string,
    userName?: string,
    comments?: string,
    userRoles?: string[],
  ): Promise<{ newState: string; workflowActionId: string }> {
    // Validate action first
    const validation = await this.validateAction(
      documentType,
      currentState,
      action,
      userRoles,
    );

    if (!validation.valid) {
      throw new Error(validation.message || 'Action not allowed');
    }

    // Perform action
    const result = await this.workflowService.performAction(
      documentType,
      documentId,
      currentState,
      { action, comments },
      userId,
      userName,
    );

    return {
      newState: result.newState,
      workflowActionId: result.workflowAction.id,
    };
  }
}

