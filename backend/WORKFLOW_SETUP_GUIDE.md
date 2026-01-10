# Workflow Setup Guide

## Quick Start

This guide will help you set up and use the workflow system in Uruti Lending.

---

## Step 1: Seed Default Workflows

First, create the default workflows:

```bash
POST /workflows/seed
```

This creates three workflows:
- **Loan Application Workflow** - Multi-step approval with KYC
- **Loan Workflow** - Loan submission and approval
- **Loan Restructure Workflow** - Restructure request approval

---

## Step 2: Create Users with Roles

### Create Loan Officer

```bash
POST /auth/register
{
  "email": "officer@example.com",
  "password": "password123",
  "name": "John Officer",
  "roles": ["Loan Officer"]
}
```

### Create Loan Processor

```bash
POST /auth/register
{
  "email": "processor@example.com",
  "password": "password123",
  "name": "Jane Processor",
  "roles": ["Loan Processor"]
}
```

### Create Loan Appraiser

```bash
POST /auth/register
{
  "email": "appraiser@example.com",
  "password": "password123",
  "name": "Bob Appraiser",
  "roles": ["Loan Appraiser"]
}
```

### Create Loan Underwriter

```bash
POST /auth/register
{
  "email": "underwriter@example.com",
  "password": "password123",
  "name": "Alice Underwriter",
  "roles": ["Loan Underwriter"]
}
```

### Update Existing User Roles

```bash
PATCH /auth/users/{userId}/roles
{
  "roles": ["Loan Officer", "Loan Processor"]
}
```

---

## Step 3: Use Workflows

### Loan Application Workflow

1. **Create Application**
   ```bash
   POST /loan-applications
   {
     "applicantType": "Customer",
     "applicantId": "customer-uuid",
     "loanProductId": "product-uuid",
     "requestedAmount": 100000
   }
   ```
   Status: `Draft`

2. **Initiate Application** (Loan Officer)
   ```bash
   POST /loan-applications/{id}/workflow-action
   {
     "action": "Initiate",
     "userId": "officer-user-id",
     "userRoles": ["Loan Officer"],
     "comments": "Application initiated"
   }
   ```
   Status: `Initiated`

3. **Review Application** (Loan Processor)
   ```bash
   POST /loan-applications/{id}/workflow-action
   {
     "action": "Review",
     "userId": "processor-user-id",
     "userRoles": ["Loan Processor"],
     "comments": "Ready for KYC"
   }
   ```
   Status: `KYC Pending`

4. **Complete KYC** (Loan Appraiser)
   ```bash
   POST /loan-applications/{id}/workflow-action
   {
     "action": "Complete KYC",
     "userId": "appraiser-user-id",
     "userRoles": ["Loan Appraiser"],
     "comments": "KYC verification completed"
   }
   ```
   Status: `KYC Complete`

5. **Approve Application** (Loan Underwriter)
   ```bash
   POST /loan-applications/{id}/approve
   {
     "userId": "underwriter-user-id",
     "userRoles": ["Loan Underwriter"],
     "comments": "Application approved"
   }
   ```
   Status: `Approved`

6. **Create Loan from Application**
   ```bash
   POST /loan-applications/{id}/create-loan
   {
     "submit": true
   }
   ```

### Loan Workflow

1. **Submit Loan** (Loan Officer)
   ```bash
   POST /loans/{id}/submit
   {
     "userId": "officer-user-id",
     "userRoles": ["Loan Officer"],
     "comments": "Loan submitted for review"
   }
   ```
   Status: `Under Review` (if workflow enabled) or `Sanctioned` (if not)

2. **Approve Loan** (Loan Manager/Underwriter)
   ```bash
   POST /loans/{id}/workflow-action
   {
     "action": "Approve",
     "userId": "manager-user-id",
     "userRoles": ["Loan Manager"],
     "comments": "Loan approved"
   }
   ```
   Status: `Sanctioned`

---

## Step 4: Check Available Actions

Before performing an action, check what's available:

```bash
GET /loan-applications/{id}/available-actions
```

**Response:**
```json
{
  "available": true,
  "actions": [
    {
      "action": "Review",
      "nextState": "KYC Pending",
      "allowed": "Loan Processor"
    }
  ]
}
```

---

## Step 5: View Workflow History

Track all workflow actions:

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
    "comments": "Application initiated"
  }
]
```

---

## Default Roles

The system includes these default roles:

- **Loan Officer**: Can initiate applications and loans
- **Loan Processor**: Can review applications
- **Loan Appraiser**: Can complete KYC verification
- **Loan Underwriter**: Can approve applications and loans
- **Loan Manager**: Can approve loans and restructures
- **user**: Default role for regular users

---

## Workflow States

### Loan Application Workflow States:
- `Draft` - Initial state, can be edited
- `Initiated` - Application initiated
- `KYC Pending` - KYC verification pending
- `KYC Complete` - KYC verification completed
- `Approved` - Application approved
- `Rejected` - Application rejected

### Loan Workflow States:
- `Draft` - Initial state
- `Under Review` - Loan under review
- `Sanctioned` - Loan sanctioned
- `Rejected` - Loan rejected

---

## Disabling Workflows

If you want to disable workflows and use direct status updates:

```bash
PATCH /workflows/{workflowId}
{
  "isActive": false
}
```

The system will automatically fall back to direct status updates.

---

## Custom Workflows

You can create custom workflows:

```bash
POST /workflows
{
  "workflowName": "Custom Application Workflow",
  "documentType": "Loan Application",
  "isActive": true,
  "states": [
    {
      "state": "Draft",
      "docStatus": 0,
      "allowEdit": true
    },
    {
      "state": "Approved",
      "docStatus": 1,
      "allowEdit": false
    }
  ],
  "transitions": [
    {
      "state": "Draft",
      "action": "Approve",
      "nextState": "Approved",
      "allowed": "Loan Manager"
    }
  ]
}
```

---

## Troubleshooting

### Workflow Not Working

1. **Check if workflow is active:**
   ```bash
   GET /workflows/active/Loan Application
   ```

2. **Check user roles:**
   ```bash
   GET /auth/users/{userId}
   ```

3. **Check available actions:**
   ```bash
   GET /loan-applications/{id}/available-actions
   ```

### Action Not Available

- Verify user has required role
- Check current state allows the action
- Ensure workflow is active

### Workflow History Not Showing

- Ensure workflow is enabled
- Check that actions were performed via workflow (not direct status updates)

---

## Best Practices

1. **Always check available actions** before performing workflow actions
2. **Use workflow actions** instead of direct status updates when workflow is enabled
3. **Assign appropriate roles** to users based on their responsibilities
4. **Track workflow history** for audit and compliance
5. **Use comments** to document why actions were taken

---

**For more details, see:**
- `WORKFLOW_IMPLEMENTATION_GUIDE.md` - Detailed implementation guide
- `WORKFLOW_INTEGRATION_COMPLETE.md` - Integration details
- API Documentation: `/api` endpoint

