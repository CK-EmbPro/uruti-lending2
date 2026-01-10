# Frappe Lending - Security & Permissions Guide

## Overview
This guide provides comprehensive information about security, roles, permissions, and access control in the Frappe Lending platform. It covers role-based access control (RBAC), permission matrices, and security best practices.

---

## Table of Contents

1. [Roles Overview](#1-roles-overview)
2. [Permission Matrix](#2-permission-matrix)
3. [Role Definitions](#3-role-definitions)
4. [Permission Types](#4-permission-types)
5. [Field-Level Permissions](#5-field-level-permissions)
6. [Document-Level Permissions](#6-document-level-permissions)
7. [Sharing and Access Control](#7-sharing-and-access-control)
8. [Security Best Practices](#8-security-best-practices)
9. [Audit Trail](#9-audit-trail)
10. [API Security](#10-api-security)

---

## 1. Roles Overview

### 1.1 Available Roles

The Frappe Lending system includes the following predefined roles:

1. **Loan Manager** - Full access to loan management
2. **Loan LOS User** - Loan Origination System user
3. **Loan Officer** - Handles loan applications
4. **Loan Processor** - Processes loan applications
5. **Loan Appraiser** - Appraises loan applications and securities
6. **Loan Underwriter** - Underwrites and approves loans
7. **Employee** - Limited access for employee loan applicants

### 1.2 Role Hierarchy

```
System Manager (Full Access)
    │
    ├── Loan Manager (Loan Management)
    │   ├── Loan Officer (Applications)
    │   ├── Loan Processor (Processing)
    │   ├── Loan Appraiser (Appraisal)
    │   └── Loan Underwriter (Approval)
    │
    └── Loan LOS User (Origination)
        └── Employee (Self-Service)
```

---

## 2. Permission Matrix

### 2.1 Core Doctypes Permission Matrix

#### Loan

| Role | Create | Read | Write | Submit | Cancel | Delete | Amend |
|------|--------|------|-------|--------|--------|--------|-------|
| Loan Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loan Officer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Loan Processor | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Loan Appraiser | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Loan Underwriter | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ |

*Employee can only read their own loans

#### Loan Application

| Role | Create | Read | Write | Submit | Cancel | Delete |
|------|--------|------|-------|--------|--------|--------|
| Loan Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loan LOS User | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Loan Officer | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Loan Processor | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Loan Appraiser | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Loan Underwriter | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Employee | ✅* | ✅* | ✅* | ✅* | ❌ | ❌ |

*Employee can only create/read/write their own applications

#### Loan Repayment

| Role | Create | Read | Write | Submit | Cancel | Delete |
|------|--------|------|-------|--------|--------|--------|
| Loan Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loan Officer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Loan Processor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Employee | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ |

*Employee can only read their own repayments

#### Loan Disbursement

| Role | Create | Read | Write | Submit | Cancel | Delete |
|------|--------|------|-------|--------|--------|--------|
| Loan Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loan Officer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Loan Processor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Loan Product

| Role | Create | Read | Write | Submit | Cancel | Delete |
|------|--------|------|-------|--------|--------|--------|
| Loan Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loan Officer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Loan Processor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Role Definitions

### 3.1 Loan Manager

**Purpose**: Full administrative access to loan management operations

**Responsibilities**:
- Create and manage loan products
- Create and manage loans
- Process disbursements and repayments
- Approve loan closures and write-offs
- Manage loan securities
- Access all reports
- Configure system settings

**Permissions**:
- Full CRUD access to all loan-related doctypes
- Can submit, cancel, and amend documents
- Can delete documents
- Can access all reports
- Can configure system settings

**Use Cases**:
- Loan operations manager
- Senior loan administrator
- System administrator

### 3.2 Loan LOS User

**Purpose**: Access to Loan Origination System functionality

**Responsibilities**:
- Create loan applications
- Process loan applications through workflow
- Manage application documents
- Track application status

**Permissions**:
- Create, read, write Loan Applications
- Submit Loan Applications
- Cannot cancel submitted applications
- Limited access to other doctypes

**Use Cases**:
- Loan origination team member
- Application processor

### 3.3 Loan Officer

**Purpose**: Handle initial loan applications and customer interactions

**Responsibilities**:
- Create loan applications
- Initiate application workflow
- Collect customer information
- Review basic application details

**Permissions**:
- Create, read, write Loan Applications
- Can initiate workflow
- Cannot approve applications
- Read-only access to Loan Products
- Limited access to Loans (cannot submit)

**Use Cases**:
- Customer service representative
- Loan sales officer
- Branch loan officer

### 3.4 Loan Processor

**Purpose**: Process and review loan applications

**Responsibilities**:
- Review loan applications
- Verify application data
- Process KYC documents
- Move applications through workflow
- Can reject applications

**Permissions**:
- Create, read, write Loan Applications
- Can review and process applications
- Can reject applications
- Cannot approve applications
- Read access to Loans

**Use Cases**:
- Loan processing specialist
- KYC verification officer
- Application reviewer

### 3.5 Loan Appraiser

**Purpose**: Appraise loan applications and securities

**Responsibilities**:
- Appraise loan applications
- Evaluate securities/collateral
- Complete KYC verification
- Provide appraisal reports

**Permissions**:
- Create, read, write Loan Applications
- Can complete KYC
- Can appraise securities
- Read access to Loan Securities
- Cannot approve applications

**Use Cases**:
- Security appraiser
- KYC specialist
- Valuation expert

### 3.6 Loan Underwriter

**Purpose**: Underwrite and approve loan applications

**Responsibilities**:
- Review complete loan applications
- Underwrite loans
- Approve or reject applications
- Create loans from approved applications

**Permissions**:
- Create, read, write Loan Applications
- Can approve applications
- Can create Loans from applications
- Can submit Loans
- Read access to Loan Products

**Use Cases**:
- Loan underwriter
- Credit analyst
- Approval authority

### 3.7 Employee

**Purpose**: Limited access for employee loan applicants

**Responsibilities**:
- Create own loan applications
- View own loan status
- View own repayment schedule

**Permissions**:
- Can create own Loan Applications
- Can read own Loans
- Can read own Loan Repayments
- Cannot access other users' data
- Cannot submit/cancel/delete

**Use Cases**:
- Employee applying for loan
- Self-service loan applicant

---

## 4. Permission Types

### 4.1 Standard Permissions

#### Create
- **Purpose**: Allow creating new documents
- **Level**: Document type level
- **Default**: Usually granted to relevant roles

#### Read
- **Purpose**: Allow viewing documents
- **Level**: Document type level
- **Default**: Usually granted to all roles

#### Write
- **Purpose**: Allow editing documents
- **Level**: Document type level
- **Default**: Usually granted to relevant roles

#### Submit
- **Purpose**: Allow submitting documents (making them final)
- **Level**: Document type level
- **Default**: Restricted to authorized roles

#### Cancel
- **Purpose**: Allow canceling submitted documents
- **Level**: Document type level
- **Default**: Restricted to managers/admins

#### Delete
- **Purpose**: Allow deleting draft documents
- **Level**: Document type level
- **Default**: Usually restricted

#### Amend
- **Purpose**: Allow amending submitted documents
- **Level**: Document type level
- **Default**: Restricted to managers/admins

#### Print
- **Purpose**: Allow printing documents
- **Level**: Document type level
- **Default**: Usually granted to read roles

#### Email
- **Purpose**: Allow emailing documents
- **Level**: Document type level
- **Default**: Usually granted to read roles

#### Export
- **Purpose**: Allow exporting data
- **Level**: Document type level
- **Default**: Usually restricted

#### Report
- **Purpose**: Allow accessing reports
- **Level**: Document type level
- **Default**: Usually granted to relevant roles

#### Share
- **Purpose**: Allow sharing documents with other users
- **Level**: Document type level
- **Default**: Usually granted to write roles

---

## 5. Field-Level Permissions

### 5.1 Read-Only Fields

Many fields in loans are read-only and calculated automatically:

#### Loan Fields (Read-Only)
- `disbursed_amount` - Calculated from disbursements
- `total_principal_paid` - Calculated from repayments
- `total_interest_paid` - Calculated from repayments
- `total_penalty_paid` - Calculated from repayments
- `total_amount_paid` - Calculated from repayments
- `days_past_due` - Calculated from demands
- `classification_code` - Auto-set based on DPD
- `available_limit_amount` - Calculated for LOC loans

### 5.2 Field-Level Permission Configuration

#### Example: Restrict Interest Rate Editing

```json
{
  "fieldname": "rate_of_interest",
  "fieldtype": "Percent",
  "permissions": [
    {
      "role": "Loan Manager",
      "permlevel": 0,
      "read": 1,
      "write": 1
    },
    {
      "role": "Loan Officer",
      "permlevel": 0,
      "read": 1,
      "write": 0
    }
  ]
}
```

### 5.3 Permission Levels

- **Level 0**: Standard permissions (read/write)
- **Level 1+**: Additional permission levels for fine-grained control

---

## 6. Document-Level Permissions

### 6.1 Owner-Based Permissions

Documents are owned by the creator. Owners have full access to their documents.

### 6.2 Role-Based Permissions

Permissions are granted based on user roles, as defined in the permission matrix.

### 6.3 Conditional Permissions

Some permissions are conditional:

#### Example: Employee Can Only Access Own Loans

```python
# Permission query condition
def get_permission_query_conditions(user):
    if "Employee" in frappe.get_roles():
        return f"(`tabLoan`.applicant = '{user}' AND `tabLoan`.applicant_type = 'Employee')"
    return ""
```

### 6.4 Status-Based Permissions

Some permissions depend on document status:

- **Draft**: Can be edited by creator and authorized roles
- **Submitted**: Can only be amended or cancelled by authorized roles
- **Cancelled**: Usually read-only

---

## 7. Sharing and Access Control

### 7.1 Document Sharing

Users can share documents with other users or roles:

#### Share with User
```python
frappe.share.add(
    "Loan",
    "LOAN-001",
    user="user@example.com",
    read=1,
    write=0,
    submit=0,
    share=0
)
```

#### Share with Role
```python
frappe.share.add(
    "Loan",
    "LOAN-001",
    role="Loan Processor",
    read=1,
    write=1
)
```

### 7.2 Access Control Rules

#### Rule 1: Employees Can Only See Own Loans
```python
def get_permission_query_conditions(user):
    if "Employee" in frappe.get_roles():
        return f"(`tabLoan`.applicant = '{user}')"
    return ""
```

#### Rule 2: Branch-Based Access
```python
def get_permission_query_conditions(user):
    user_branch = frappe.db.get_value("User", user, "branch")
    if user_branch:
        return f"(`tabLoan`.branch = '{user_branch}')"
    return ""
```

---

## 8. Security Best Practices

### 8.1 User Management

#### Password Policies
- Enforce strong passwords (min 8 characters, mixed case, numbers, symbols)
- Require password changes periodically
- Implement password history (prevent reuse)

#### Two-Factor Authentication
- Enable 2FA for sensitive roles
- Use authenticator apps (Google Authenticator, Authy)
- Require 2FA for Loan Manager and above

#### User Account Management
- Disable inactive accounts
- Regularly review user access
- Remove access for terminated employees immediately
- Use role-based access, not individual permissions

### 8.2 Role Management

#### Principle of Least Privilege
- Grant minimum permissions necessary
- Review roles regularly
- Remove unused roles
- Document role purposes

#### Role Segregation
- Separate duties (e.g., processor cannot approve)
- Use workflow to enforce separation
- Require multiple approvals for large loans

### 8.3 Data Security

#### Encryption
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Encrypt database backups

#### Access Logging
- Log all access to sensitive data
- Monitor failed login attempts
- Track permission changes
- Audit document access

#### Data Retention
- Define data retention policies
- Archive old data
- Securely delete expired data

### 8.4 API Security

#### API Keys
- Use strong, randomly generated API keys
- Rotate API keys regularly
- Store keys securely (environment variables, secrets manager)
- Never commit keys to version control

#### Rate Limiting
- Implement rate limiting on APIs
- Monitor API usage
- Block suspicious activity

#### Authentication
- Use JWT tokens for API authentication
- Implement token expiration
- Use refresh tokens for long-lived sessions

---

## 9. Audit Trail

### 9.1 What is Audited

The following doctypes maintain audit trails:
- Loan Balance Adjustment
- Loan Disbursement
- Loan Interest Accrual
- Loan Refund
- Loan Repayment
- Loan Write Off

### 9.2 Audit Information Captured

- **Who**: User who made the change
- **What**: Document and field changed
- **When**: Timestamp of change
- **From/To**: Old and new values
- **IP Address**: Source IP of change
- **Action**: Create, update, submit, cancel, delete

### 9.3 Accessing Audit Trail

#### Via UI
1. Open document
2. Click "View" > "Version History"
3. View all changes

#### Via API
```python
versions = frappe.get_all(
    "Version",
    filters={
        "ref_doctype": "Loan",
        "docname": "LOAN-001"
    },
    fields=["*"],
    order_by="creation desc"
)
```

### 9.4 Audit Trail Configuration

```bash
# Enable audit trail
bench --site lending.localhost set-config enable_audit_trail 1

# Configure retention period
bench --site lending.localhost set-config audit_trail_retention_days 365
```

---

## 10. API Security

### 10.1 API Authentication

#### Generate API Key

```bash
# Create API user
bench --site lending.localhost add-user api_user@example.com

# Generate API key and secret
bench --site lending.localhost set-config api_key "your_api_key"
bench --site lending.localhost set-config api_secret "your_api_secret"
```

#### Using API Key

```bash
curl -X GET "http://localhost:8000/api/resource/Loan/LOAN-001" \
  -H "Authorization: token api_key:api_secret"
```

### 10.2 API Permissions

API users inherit permissions from their assigned roles. Ensure API users have appropriate roles.

### 10.3 API Rate Limiting

```bash
# Set rate limit (requests per minute)
bench --site lending.localhost set-config api_rate_limit 100
```

### 10.4 API Best Practices

- Use HTTPS only in production
- Implement request signing
- Validate all input
- Use parameterized queries
- Implement CORS properly
- Log all API access
- Monitor for suspicious activity

---

## 11. Security Checklist

### Initial Setup
- [ ] Change default admin password
- [ ] Create users with appropriate roles
- [ ] Configure password policies
- [ ] Enable two-factor authentication for admins
- [ ] Set up API keys (if needed)
- [ ] Configure SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Enable audit trail
- [ ] Configure backup encryption

### Ongoing Maintenance
- [ ] Regularly review user access
- [ ] Remove access for inactive users
- [ ] Rotate API keys periodically
- [ ] Review audit logs
- [ ] Update security patches
- [ ] Monitor failed login attempts
- [ ] Review and update permissions
- [ ] Conduct security audits
- [ ] Train users on security practices

---

## 12. Implementation Examples

### 12.1 Creating Custom Role

```python
# Create custom role
role = frappe.get_doc({
    "doctype": "Role",
    "role_name": "Branch Loan Manager",
    "desk_access": 1
})
role.insert()
```

### 12.2 Assigning Permissions Programmatically

```python
# Assign permissions to role
permission = frappe.get_doc({
    "doctype": "Custom DocPerm",
    "parent": "Loan",
    "parenttype": "DocType",
    "role": "Branch Loan Manager",
    "read": 1,
    "write": 1,
    "create": 1,
    "submit": 1,
    "cancel": 0,
    "delete": 0
})
permission.insert()
```

### 12.3 Implementing Branch-Based Access

```python
# Permission query condition
def get_permission_query_conditions(user):
    user_branch = frappe.db.get_value("User", user, "branch")
    if user_branch and "Branch Loan Manager" in frappe.get_roles():
        return f"(`tabLoan`.branch = '{user_branch}')"
    return ""
```

---

## Conclusion

This security and permissions guide provides comprehensive information about securing the Frappe Lending platform. Key points:

1. **Use Role-Based Access Control** - Assign permissions by role, not individual users
2. **Follow Principle of Least Privilege** - Grant minimum necessary permissions
3. **Enable Audit Trail** - Track all changes for compliance
4. **Implement Strong Authentication** - Use 2FA and strong passwords
5. **Secure APIs** - Use API keys, rate limiting, and HTTPS
6. **Regular Reviews** - Periodically review and update permissions
7. **Monitor Access** - Log and monitor all access to sensitive data

For additional help, refer to:
- Installation & Setup Guide
- Configuration Guide
- API Endpoints Guide

