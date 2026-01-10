# Workflow Integration - Complete Implementation

## ✅ Implementation Status: COMPLETE

All workflow integration tasks have been completed:

1. ✅ **Default workflows created via API**
2. ✅ **LoanApplicationService integrated with workflows**
3. ✅ **LoanService integrated with workflows**
4. ✅ **User roles configured in authentication system**

---

## 1. Default Workflows Created

### Workflow Seed Service

**File**: `backend/src/modules/workflow/workflow-seed.service.ts`

Creates three default workflows:

1. **Loan Application Workflow**
   - States: Draft → Initiated → KYC Pending → KYC Complete → Approved/Rejected
   - Roles: Loan Officer, Loan Processor, Loan Appraiser, Loan Underwriter

2. **Loan Workflow**
   - States: Draft → Under Review → Sanctioned/Rejected
   - Roles: Loan Officer, Loan Manager, Loan Underwriter

3. **Loan Restructure Workflow**
   - States: Initiated → Under Review → Approved/Rejected
   - Roles: Loan Officer, Loan Manager, Loan Underwriter

### API Endpoint

**POST** `/workflows/seed`

Creates default workflows if none exist.

**Example:**
```bash
POST /workflows/seed
```

**Response:**
```json
{
  "message": "Default workflows seeded successfully"
}
```

---

## 2. LoanApplicationService Integration

### Updated Methods

**File**: `backend/src/modules/loan-application/loan-application.service.ts`

#### `approve()` Method
- ✅ Checks if workflow is enabled
- ✅ Uses workflow engine if enabled
- ✅ Validates user roles
- ✅ Falls back to direct approval if workflow not enabled
- ✅ Tracks workflow history

#### `reject()` Method
- ✅ Checks if workflow is enabled
- ✅ Uses workflow engine if enabled
- ✅ Validates user roles
- ✅ Falls back to direct rejection if workflow not enabled

#### New Methods Added:
- ✅ `performWorkflowAction()` - Perform any workflow action
- ✅ `getAvailableActions()` - Get available actions for current state
- ✅ `getWorkflowHistory()` - Get workflow history

### API Endpoints

**POST** `/loan-applications/:id/approve`
- Now accepts `userId`, `userRoles`, and `comments`
- Uses workflow if enabled

**POST** `/loan-applications/:id/reject`
- Now accepts `userId`, `userRoles`, and `comments`
- Uses workflow if enabled

**POST** `/loan-applications/:id/workflow-action`
- Perform any workflow action (Initiate, Review, Complete KYC, etc.)

**GET** `/loan-applications/:id/available-actions`
- Get available actions for current state

**GET** `/loan-applications/:id/workflow-history`
- Get workflow action history

### Example Usage

```typescript
// Approve with workflow
POST /loan-applications/{id}/approve
{
  "userId": "user-uuid",
  "userRoles": ["Loan Underwriter"],
  "comments": "Application approved after KYC verification"
}

// Perform workflow action
POST /loan-applications/{id}/workflow-action
{
  "action": "Initiate",
  "userId": "user-uuid",
  "userRoles": ["Loan Officer"],
  "comments": "Application initiated for review"
}
```

---

## 3. LoanService Integration

### Updated Methods

**File**: `backend/src/modules/loan/loan.service.ts`

#### `submit()` Method
- ✅ Checks if workflow is enabled
- ✅ Uses workflow engine if enabled
- ✅ Validates user roles
- ✅ Falls back to direct submission if workflow not enabled

#### New Methods Added:
- ✅ `performWorkflowAction()` - Perform any workflow action
- ✅ `getAvailableActions()` - Get available actions for current state
- ✅ `getWorkflowHistory()` - Get workflow history

### API Endpoints

**POST** `/loans/:id/submit`
- Now accepts `userId`, `userRoles`, and `comments`
- Uses workflow if enabled

**POST** `/loans/:id/workflow-action`
- Perform any workflow action (Approve, Reject, etc.)

**GET** `/loans/:id/available-actions`
- Get available actions for current state

**GET** `/loans/:id/workflow-history`
- Get workflow action history

---

## 4. User Roles Configuration

### User Entity

**File**: `backend/src/modules/auth/entities/user.entity.ts`

Already has `roles` field:
```typescript
@Column({ type: 'simple-array', default: 'user' })
roles: string[];
```

### Auth Service Updates

**File**: `backend/src/modules/auth/auth.service.ts`

#### New Methods:
- ✅ `updateUserRoles()` - Update user roles
- ✅ `findOne()` - Get user by ID
- ✅ `findAll()` - Get all users

### API Endpoints

**GET** `/auth/users`
- Get all users (without passwords)

**GET** `/auth/users/:id`
- Get user by ID (without password)

**PATCH** `/auth/users/:id/roles`
- Update user roles

### Example Usage

```typescript
// Update user roles
PATCH /auth/users/{userId}/roles
{
  "roles": ["Loan Officer", "Loan Processor"]
}

// Register user with roles
POST /auth/register
{
  "email": "officer@example.com",
  "password": "password123",
  "name": "John Officer",
  "roles": ["Loan Officer"]
}
```

### Default Roles

The system supports these roles (can be customized):
- `Loan Officer` - Can initiate applications and loans
- `Loan Processor` - Can review applications
- `Loan Appraiser` - Can complete KYC
- `Loan Underwriter` - Can approve applications and loans
- `Loan Manager` - Can approve loans and restructures
- `user` - Default role for regular users

---

## Workflow Integration Architecture

### Service Layer

```
LoanApplicationService
  └── WorkflowIntegrationService
      └── WorkflowService
          └── Workflow (Entity)
              ├── WorkflowState (Entity)
              └── WorkflowTransition (Entity)
```

### Flow

1. **Service checks if workflow is enabled**
   ```typescript
   const workflowEnabled = await workflowIntegrationService.isWorkflowEnabled('Loan Application');
   ```

2. **If enabled, uses workflow engine**
   ```typescript
   const result = await workflowIntegrationService.performWorkflowAction(
     'Loan Application',
     applicationId,
     currentState,
     'Approve',
     userId,
     userName,
     comments,
     userRoles,
   );
   ```

3. **If not enabled, falls back to direct status update**
   ```typescript
   application.status = ApplicationStatus.APPROVED;
   ```

---

## Usage Examples

### 1. Seed Default Workflows

```bash
POST /workflows/seed
```

### 2. Create Loan Application

```bash
POST /loan-applications
{
  "applicantType": "Customer",
  "applicantId": "customer-uuid",
  "loanProductId": "product-uuid",
  "requestedAmount": 100000
}
```

### 3. Initiate Application (Workflow Action)

```bash
POST /loan-applications/{id}/workflow-action
{
  "action": "Initiate",
  "userId": "officer-uuid",
  "userRoles": ["Loan Officer"],
  "comments": "Application looks good"
}
```

### 4. Review Application

```bash
POST /loan-applications/{id}/workflow-action
{
  "action": "Review",
  "userId": "processor-uuid",
  "userRoles": ["Loan Processor"],
  "comments": "Ready for KYC"
}
```

### 5. Complete KYC

```bash
POST /loan-applications/{id}/workflow-action
{
  "action": "Complete KYC",
  "userId": "appraiser-uuid",
  "userRoles": ["Loan Appraiser"],
  "comments": "KYC verification completed"
}
```

### 6. Approve Application

```bash
POST /loan-applications/{id}/approve
{
  "userId": "underwriter-uuid",
  "userRoles": ["Loan Underwriter"],
  "comments": "Application approved"
}
```

### 7. Get Available Actions

```bash
GET /loan-applications/{id}/available-actions
```

**Response:**
```json
{
  "available": true,
  "actions": [
    {
      "action": "Approve",
      "nextState": "Approved",
      "allowed": "Loan Underwriter"
    }
  ]
}
```

### 8. Get Workflow History

```bash
GET /loan-applications/{id}/workflow-history
```

**Response:**
```json
[
  {
    "id": "action-1",
    "fromState": "Draft",
    "toState": "Initiated",
    "action": "Initiate",
    "userId": "officer-uuid",
    "userName": "John Officer",
    "actionDate": "2024-01-15T10:00:00Z",
    "comments": "Application looks good"
  },
  {
    "id": "action-2",
    "fromState": "Initiated",
    "toState": "KYC Pending",
    "action": "Review",
    "userId": "processor-uuid",
    "actionDate": "2024-01-16T09:00:00Z"
  }
]
```

---

## Configuration

### Enable/Disable Workflows

Workflows are enabled by default when created. To disable:

```bash
PATCH /workflows/{workflowId}
{
  "isActive": false
}
```

### Customize Workflows

You can create custom workflows via:

```bash
POST /workflows
{
  "workflowName": "Custom Workflow",
  "documentType": "Loan Application",
  "states": [...],
  "transitions": [...]
}
```

---

## Role Management

### Assign Roles to User

```bash
PATCH /auth/users/{userId}/roles
{
  "roles": ["Loan Officer", "Loan Processor"]
}
```

### Get User with Roles

```bash
GET /auth/users/{userId}
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "officer@example.com",
  "name": "John Officer",
  "roles": ["Loan Officer", "Loan Processor"],
  "isActive": true
}
```

---

## Testing Workflow Integration

### 1. Seed Workflows
```bash
POST /workflows/seed
```

### 2. Create Test Users with Roles
```bash
POST /auth/register
{
  "email": "officer@test.com",
  "password": "password",
  "name": "Test Officer",
  "roles": ["Loan Officer"]
}
```

### 3. Create Application
```bash
POST /loan-applications
{...}
```

### 4. Perform Workflow Actions
```bash
POST /loan-applications/{id}/workflow-action
{
  "action": "Initiate",
  "userId": "...",
  "userRoles": ["Loan Officer"]
}
```

### 5. Verify History
```bash
GET /loan-applications/{id}/workflow-history
```

---

## Summary

✅ **All integration tasks completed:**

1. ✅ Default workflows created via API endpoint
2. ✅ LoanApplicationService fully integrated with workflows
3. ✅ LoanService integrated with workflows
4. ✅ User roles configured and manageable via API
5. ✅ Workflow history tracking
6. ✅ Role-based action validation
7. ✅ Fallback to direct status updates when workflow not enabled

The system now supports:
- Multi-step approval workflows
- Role-based workflow actions
- Complete workflow history
- Flexible workflow configuration
- Backward compatibility (works without workflows)

---

**Status**: ✅ **COMPLETE**  
**Last Updated**: 2024

