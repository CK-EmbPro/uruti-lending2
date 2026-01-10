# Workflow Engine Implementation Guide

## Overview

The workflow engine has been implemented to support multi-step approval workflows with role-based actions, similar to Frappe Lending's workflow system.

---

## Architecture

### Entities

1. **Workflow**: Main workflow configuration
   - `workflowName`: Name of the workflow
   - `documentType`: Document type this workflow applies to (e.g., 'Loan Application')
   - `isActive`: Whether the workflow is active
   - `states`: Collection of workflow states
   - `transitions`: Collection of workflow transitions

2. **WorkflowState**: Defines a state in the workflow
   - `state`: State name (e.g., 'Draft', 'Initiated', 'Approved')
   - `docStatus`: Document status (0=Draft, 1=Submitted/Approved)
   - `allowEdit`: Whether editing is allowed in this state
   - `message`: Message to display in this state
   - `sendEmail`: Whether to send email on entering this state

3. **WorkflowTransition**: Defines a transition between states
   - `state`: Current state
   - `action`: Action name (e.g., 'Initiate', 'Approve')
   - `nextState`: State to transition to
   - `allowed`: Comma-separated list of allowed roles
   - `allowSelfApproval`: Whether self-approval is allowed
   - `condition`: Optional condition expression

4. **WorkflowAction**: Tracks workflow actions performed
   - `documentType`: Type of document
   - `documentId`: ID of the document
   - `fromState`: Previous state
   - `toState`: New state
   - `action`: Action performed
   - `userId`: User who performed the action
   - `comments`: Optional comments
   - `actionDate`: When the action was performed

---

## API Endpoints

### Workflow Management

- `POST /workflows` - Create a new workflow
- `GET /workflows` - Get all workflows
- `GET /workflows/:id` - Get workflow by ID
- `GET /workflows/active/:documentType` - Get active workflow for document type
- `PATCH /workflows/:id` - Update workflow
- `DELETE /workflows/:id` - Delete workflow

### Workflow Actions

- `GET /workflows/actions/available` - Get available actions for a document
- `POST /workflows/actions/perform` - Perform a workflow action
- `GET /workflows/history/:documentType/:documentId` - Get workflow history

---

## Example: Creating a Loan Application Workflow

### Step 1: Create Workflow Configuration

```json
POST /workflows
{
  "workflowName": "Loan Application Workflow",
  "documentType": "Loan Application",
  "isActive": true,
  "description": "Multi-step approval workflow for loan applications",
  "states": [
    {
      "state": "Draft",
      "docStatus": 0,
      "allowEdit": true,
      "message": "Application is in draft state"
    },
    {
      "state": "Initiated",
      "docStatus": 0,
      "allowEdit": false,
      "message": "Application has been initiated"
    },
    {
      "state": "KYC Pending",
      "docStatus": 0,
      "allowEdit": false,
      "message": "KYC verification is pending"
    },
    {
      "state": "KYC Complete",
      "docStatus": 0,
      "allowEdit": false,
      "message": "KYC verification completed"
    },
    {
      "state": "Approved",
      "docStatus": 1,
      "allowEdit": false,
      "message": "Application approved"
    },
    {
      "state": "Rejected",
      "docStatus": 1,
      "allowEdit": false,
      "message": "Application rejected"
    }
  ],
  "transitions": [
    {
      "state": "Draft",
      "action": "Initiate",
      "nextState": "Initiated",
      "allowed": "Loan Officer",
      "allowSelfApproval": true
    },
    {
      "state": "Initiated",
      "action": "Review",
      "nextState": "KYC Pending",
      "allowed": "Loan Processor",
      "allowSelfApproval": false
    },
    {
      "state": "Initiated",
      "action": "Reject",
      "nextState": "Rejected",
      "allowed": "Loan Processor",
      "allowSelfApproval": false
    },
    {
      "state": "KYC Pending",
      "action": "Complete KYC",
      "nextState": "KYC Complete",
      "allowed": "Loan Appraiser",
      "allowSelfApproval": false
    },
    {
      "state": "KYC Pending",
      "action": "Reject",
      "nextState": "Rejected",
      "allowed": "Loan Appraiser",
      "allowSelfApproval": false
    },
    {
      "state": "KYC Complete",
      "action": "Approve",
      "nextState": "Approved",
      "allowed": "Loan Underwriter",
      "allowSelfApproval": false
    },
    {
      "state": "KYC Complete",
      "action": "Reject",
      "nextState": "Rejected",
      "allowed": "Loan Underwriter",
      "allowSelfApproval": false
    }
  ]
}
```

### Step 2: Use Workflow in Loan Application Service

```typescript
// In loan-application.service.ts

async initiateApplication(id: string, userId: string, userRoles: string[]): Promise<LoanApplication> {
  const application = await this.findOne(id);
  
  // Check if workflow is enabled
  const workflowEnabled = await this.workflowIntegrationService.isWorkflowEnabled('Loan Application');
  
  if (workflowEnabled) {
    // Use workflow engine
    const result = await this.workflowIntegrationService.performWorkflowAction(
      'Loan Application',
      application.id,
      application.status,
      'Initiate',
      userId,
      undefined, // userName
      undefined, // comments
      userRoles,
    );
    
    application.status = result.newState as ApplicationStatus;
  } else {
    // Fallback to direct status update
    application.status = ApplicationStatus.SUBMITTED;
  }
  
  return await this.applicationRepository.save(application);
}
```

---

## Integration Points

### 1. Loan Application Service

The workflow can be integrated with loan application service to:
- Validate actions based on current state
- Check user roles before allowing actions
- Track workflow history
- Automatically transition states

### 2. Loan Service

Similar integration can be done for loan service for:
- Loan submission workflow
- Loan approval workflow
- Loan closure workflow

### 3. Loan Restructure Service

Workflow can be integrated for:
- Restructure request workflow
- Restructure approval workflow

---

## Usage Examples

### Get Available Actions

```typescript
GET /workflows/actions/available?documentType=Loan Application&currentState=Draft&userRoles=Loan Officer

Response:
[
  {
    "id": "transition-uuid",
    "state": "Draft",
    "action": "Initiate",
    "nextState": "Initiated",
    "allowed": "Loan Officer",
    "allowSelfApproval": true
  }
]
```

### Perform Workflow Action

```typescript
POST /workflows/actions/perform
{
  "documentType": "Loan Application",
  "documentId": "application-uuid",
  "currentState": "Draft",
  "action": "Initiate",
  "userId": "user-uuid",
  "userName": "John Doe",
  "comments": "Application looks good"
}

Response:
{
  "success": true,
  "newState": "Initiated",
  "workflowAction": {
    "id": "action-uuid",
    "fromState": "Draft",
    "toState": "Initiated",
    "action": "Initiate",
    "userId": "user-uuid",
    "actionDate": "2024-01-15T10:00:00Z"
  }
}
```

### Get Workflow History

```typescript
GET /workflows/history/Loan Application/application-uuid

Response:
[
  {
    "id": "action-1",
    "fromState": "Draft",
    "toState": "Initiated",
    "action": "Initiate",
    "userId": "user-1",
    "userName": "John Doe",
    "actionDate": "2024-01-15T10:00:00Z"
  },
  {
    "id": "action-2",
    "fromState": "Initiated",
    "toState": "KYC Pending",
    "action": "Review",
    "userId": "user-2",
    "userName": "Jane Smith",
    "actionDate": "2024-01-16T09:00:00Z"
  }
]
```

---

## Best Practices

1. **Always Check Workflow Before Direct Status Updates**
   - Use `isWorkflowEnabled()` to check if workflow is active
   - If workflow is enabled, use workflow engine
   - If not, fall back to direct status updates

2. **Validate User Roles**
   - Always pass user roles when performing actions
   - Workflow engine will validate permissions

3. **Track Workflow History**
   - All workflow actions are automatically tracked
   - Use history for audit and compliance

4. **Handle Workflow Errors Gracefully**
   - If workflow action fails, provide clear error messages
   - Fall back to direct status updates if needed

---

## Migration from Status-Based to Workflow-Based

### Current Implementation (Status-Based)

```typescript
// Direct status update
application.status = ApplicationStatus.APPROVED;
await this.applicationRepository.save(application);
```

### New Implementation (Workflow-Based)

```typescript
// Use workflow engine
const result = await this.workflowIntegrationService.performWorkflowAction(
  'Loan Application',
  application.id,
  application.status,
  'Approve',
  userId,
  userName,
  comments,
  userRoles,
);

application.status = result.newState as ApplicationStatus;
await this.applicationRepository.save(application);
```

---

## Configuration

### Default Workflows

You can create default workflows for:
- Loan Application
- Loan
- Loan Restructure
- Security Assignment

### Activating Workflows

Set `isActive: true` on the workflow to activate it. Only one active workflow per document type is allowed.

---

## Future Enhancements

1. **Conditional Transitions**: Support for conditional transitions based on field values
2. **Email Notifications**: Automatic email notifications on state changes
3. **Workflow Builder UI**: Frontend UI for creating workflows
4. **Workflow Templates**: Pre-configured workflow templates
5. **Parallel Approvals**: Support for parallel approval paths

---

**Last Updated**: 2024
**Status**: Workflow engine implemented and ready for integration

