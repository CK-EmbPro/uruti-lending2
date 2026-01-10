# Frappe Lending - Configuration & Settings Guide

## Overview
This guide provides comprehensive configuration instructions for the Frappe Lending platform, covering system settings, account mapping, company configuration, and best practices.

---

## Table of Contents

1. [Loan Origination Settings](#1-loan-origination-settings)
2. [Company Configuration](#2-company-configuration)
3. [Chart of Accounts Setup](#3-chart-of-accounts-setup)
4. [Loan Product Configuration](#4-loan-product-configuration)
5. [Accounting Dimensions](#5-accounting-dimensions)
6. [Cost Center Setup](#6-cost-center-setup)
7. [Currency & Precision](#7-currency--precision)
8. [Workflow Configuration](#8-workflow-configuration)
9. [Notification Settings](#9-notification-settings)
10. [Integration Settings](#10-integration-settings)

---

## 1. Loan Origination Settings

### 1.1 Accessing Settings

Navigate to: **Loan Origination > Loan Origination Settings**

### 1.2 Configuration Options

#### Unique Customer
- **Purpose**: Enforces unique email and phone number constraints on Customer DocType
- **When to Enable**: 
  - When you need to prevent duplicate customer records
  - For data integrity and compliance
- **Impact**: Adds unique constraints to customer email and phone fields

#### Employee Loans
- **Purpose**: Enables employee loan functionality
- **When to Enable**:
  - If offering loans to employees
  - For internal lending programs
- **Impact**: Enables `applicant_type = "Employee"` in loan applications

### 1.3 Configuration Example

```json
{
  "unique_customer": 1,
  "employee_loans": 1
}
```

---

## 2. Company Configuration

### 2.1 Company Setup

#### Basic Information
- **Company Name**: Full legal name
- **Abbreviation**: Short code (e.g., "ACME")
- **Default Currency**: Primary currency
- **Country**: Operating country
- **Tax ID**: Tax identification number

#### Lending-Specific Settings

Navigate to: **Company > [Your Company] > Lending Settings**

##### Loan Accrual Frequency
- **Options**: Daily, Weekly, Monthly
- **Default**: Monthly
- **Purpose**: Determines how often interest is accrued
- **Recommendation**: 
  - Daily for high-volume operations
  - Monthly for standard operations

##### Interest Day Count Convention
- **Options**:
  - `Actual/365`: Actual days / 365 days
  - `Actual/360`: Actual days / 360 days
  - `Actual/Actual`: Actual days / Actual days in year
  - `30/360`: 30 days per month / 360 days per year
- **Default**: Actual/365
- **Purpose**: Determines interest calculation method
- **Recommendation**: Use `Actual/365` for most cases

##### Example Configuration

```python
# Via API or script
company = {
    "name": "ACME Lending",
    "abbreviation": "ACME",
    "default_currency": "USD",
    "country": "United States",
    "loan_accrual_frequency": "Monthly",
    "interest_day_count_convention": "Actual/365"
}
```

---

## 3. Chart of Accounts Setup

### 3.1 Required Account Structure

#### Asset Accounts

```
Assets
└── Current Assets
    ├── Bank Accounts
    │   ├── Disbursement Account
    │   └── Payment Account
    ├── Accounts Receivable
    │   ├── Interest Receivable
    │   ├── Penalty Receivable
    │   └── Charges Receivable
    └── Loans and Advances (Assets)
        ├── Loan Account
        └── Interest Accrued Account
```

#### Liability Accounts

```
Liabilities
└── Current Liabilities
    └── Loans (Liabilities)
        └── Security Deposit Account
```

#### Income Accounts

```
Income
└── Direct Income
    ├── Interest Income Account
    ├── Penalty Income Account
    └── Processing Fee Income Account
```

#### Expense Accounts

```
Expenses
└── Direct Expenses
    ├── Interest Waiver Account
    ├── Penalty Waiver Account
    ├── Write Off Account
    └── Processing Fee Waiver Account
```

### 3.2 Account Creation Script

#### Python Example

```python
def create_lending_accounts(company):
    accounts = [
        # Asset Accounts
        {
            "account_name": "Loan Account",
            "parent_account": f"Loans and Advances (Assets) - {company}",
            "account_type": "Asset",
            "root_type": "Asset",
            "is_group": 0
        },
        {
            "account_name": "Disbursement Account",
            "parent_account": f"Bank Accounts - {company}",
            "account_type": "Bank",
            "root_type": "Asset",
            "is_group": 0
        },
        {
            "account_name": "Payment Account",
            "parent_account": f"Bank Accounts - {company}",
            "account_type": "Bank",
            "root_type": "Asset",
            "is_group": 0
        },
        {
            "account_name": "Interest Receivable",
            "parent_account": f"Accounts Receivable - {company}",
            "account_type": "Receivable",
            "root_type": "Asset",
            "is_group": 0
        },
        {
            "account_name": "Interest Accrued Account",
            "parent_account": f"Current Assets - {company}",
            "account_type": "Asset",
            "root_type": "Asset",
            "is_group": 0
        },
        # Income Accounts
        {
            "account_name": "Interest Income Account",
            "parent_account": f"Direct Income - {company}",
            "account_type": "Income Account",
            "root_type": "Income",
            "is_group": 0
        },
        {
            "account_name": "Penalty Income Account",
            "parent_account": f"Direct Income - {company}",
            "account_type": "Income Account",
            "root_type": "Income",
            "is_group": 0
        },
        # Expense Accounts
        {
            "account_name": "Interest Waiver Account",
            "parent_account": f"Direct Expenses - {company}",
            "account_type": "Expense Account",
            "root_type": "Expense",
            "is_group": 0
        },
        {
            "account_name": "Write Off Account",
            "parent_account": f"Direct Expenses - {company}",
            "account_type": "Expense Account",
            "root_type": "Expense",
            "is_group": 0
        },
        # Liability Accounts
        {
            "account_name": "Security Deposit Account",
            "parent_account": f"Loans (Liabilities) - {company}",
            "account_type": "Liability",
            "root_type": "Liability",
            "is_group": 0
        }
    ]
    
    for account_data in accounts:
        create_account(account_data)
```

#### TypeScript Example

```typescript
interface Account {
  accountName: string;
  parentAccount: string;
  accountType: string;
  rootType: string;
  isGroup: boolean;
  company: string;
}

function createLendingAccounts(company: string): Account[] {
  return [
    {
      accountName: "Loan Account",
      parentAccount: `Loans and Advances (Assets) - ${company}`,
      accountType: "Asset",
      rootType: "Asset",
      isGroup: false,
      company: company
    },
    {
      accountName: "Disbursement Account",
      parentAccount: `Bank Accounts - ${company}`,
      accountType: "Bank",
      rootType: "Asset",
      isGroup: false,
      company: company
    },
    // ... more accounts
  ];
}
```

---

## 4. Loan Product Configuration

### 4.1 Basic Configuration

#### Required Fields

```json
{
  "product_code": "PL-001",
  "product_name": "Personal Loan",
  "company": "Your Company",
  "rate_of_interest": 12.5,
  "is_term_loan": 1,
  "repayment_schedule_type": "Monthly as per repayment start date"
}
```

#### Account Mapping

Each loan product must have the following accounts configured:

```json
{
  "disbursement_account": "Disbursement Account - COMPANY",
  "payment_account": "Payment Account - COMPANY",
  "loan_account": "Loan Account - COMPANY",
  "interest_income_account": "Interest Income Account - COMPANY",
  "penalty_income_account": "Penalty Income Account - COMPANY",
  "interest_accrued_account": "Interest Accrued Account - COMPANY",
  "interest_receivable_account": "Interest Receivable - COMPANY",
  "penalty_accrued_account": "Penalty Accrued Account - COMPANY",
  "penalty_receivable_account": "Penalty Receivable - COMPANY",
  "security_deposit_account": "Security Deposit Account - COMPANY",
  "customer_refund_account": "Customer Refund Account - COMPANY",
  "write_off_account": "Write Off Account - COMPANY",
  "write_off_recovery_account": "Write Off Recovery - COMPANY",
  "interest_waiver_account": "Interest Waiver Account - COMPANY",
  "penalty_waiver_account": "Penalty Waiver Account - COMPANY"
}
```

### 4.2 Advanced Configuration

#### Repayment Schedule Types

1. **Monthly as per repayment start date**
   - Fixed date each month
   - Example: 15th of every month

2. **Pro-rated calendar months**
   - Based on calendar boundaries
   - `repayment_date_on`: "Start of the next month" or "End of the current month"

3. **Monthly as per cycle date**
   - Fixed day each month
   - Requires `cyclic_day_of_the_month` (1-31)

4. **Line of Credit**
   - No fixed schedule
   - Interest calculated daily

#### Configuration Example

```json
{
  "product_code": "PL-001",
  "product_name": "Personal Loan",
  "company": "ACME",
  "rate_of_interest": 12.5,
  "penalty_interest_rate": 2.0,
  "maximum_loan_amount": 1000000,
  "is_term_loan": 1,
  "repayment_schedule_type": "Monthly as per repayment start date",
  "min_days_bw_disbursement_first_repayment": 30,
  "days_past_due_threshold_for_npa": 90,
  "grace_period_in_days": 5,
  "excess_amount_acceptance_limit": 0.05,
  "write_off_amount": 1000
}
```

---

## 5. Accounting Dimensions

### 5.1 What are Accounting Dimensions?

Accounting dimensions allow you to track financial data across multiple dimensions (e.g., Department, Project, Cost Center, Branch).

### 5.2 Lending-Specific Dimensions

The following doctypes support accounting dimensions:
- Loan
- Loan Disbursement
- Loan Interest Accrual
- Loan Demand
- Loan Repayment
- Loan Refund
- Sales Invoice (for charges)
- Journal Entry

### 5.3 Configuration

#### Enable Accounting Dimensions

1. Navigate to **Accounting > Accounting Dimensions**
2. Create dimensions (e.g., Branch, Department)
3. Enable for required doctypes

#### Example Configuration

```json
{
  "dimension_name": "Branch",
  "document_type": "Loan",
  "mandatory_for_loan": 1,
  "mandatory_for_loan_disbursement": 1,
  "mandatory_for_loan_repayment": 1
}
```

### 5.4 Usage in Loans

When creating a loan, you can assign:
- **Cost Center**: Required if `rate_of_interest > 0`
- **Branch**: Optional, for multi-branch operations
- **Department**: Optional, for departmental tracking
- **Project**: Optional, for project-based lending

---

## 6. Cost Center Setup

### 6.1 Why Cost Centers?

Cost centers are required for loans with interest rates > 0 to track profitability and allocate costs.

### 6.2 Creating Cost Centers

#### Structure

```
Main Cost Center
├── Lending Operations
│   ├── Personal Loans
│   ├── Business Loans
│   └── Vehicle Loans
└── Support Functions
    ├── Administration
    └── Collections
```

#### Example

```json
{
  "cost_center_name": "Personal Loans",
  "parent_cost_center": "Lending Operations - COMPANY",
  "company": "Your Company",
  "is_group": 0
}
```

### 6.3 Assigning to Loans

Cost centers are automatically assigned based on:
1. Loan Product default cost center
2. Company default cost center
3. Manual assignment during loan creation

---

## 7. Currency & Precision

### 7.1 Currency Configuration

#### Default Currency

Set in Company settings:
- **Default Currency**: Primary currency (e.g., USD, INR, EUR)
- **Additional Currencies**: Can be added for multi-currency operations

#### Currency Exchange Rates

For multi-currency loans:
1. Navigate to **Accounting > Currency Exchange**
2. Set exchange rates
3. Loans will use rates as of transaction date

### 7.2 Precision Settings

#### Currency Precision

```bash
# Set currency precision (default: 2)
bench --site lending.localhost set-config currency_precision 2

# For high-value loans, you might want 0 (no decimals)
bench --site lending.localhost set-config currency_precision 0
```

#### Interest Rate Precision

- **Default**: 2 decimal places (e.g., 12.50%)
- **Can be configured**: Based on business needs

---

## 8. Workflow Configuration

### 8.1 Loan Application Workflow

#### Default States

1. **Draft** - Initial state
2. **Initiated** - Application initiated
3. **KYC Pending** - KYC verification pending
4. **KYC Complete** - KYC completed
5. **Approved** - Application approved
6. **Rejected** - Application rejected

#### Workflow Actions

- **Initiate** - Loan Officer
- **Review** - Loan Processor
- **Complete KYC** - Loan Appraiser
- **Approve** - Loan Underwriter
- **Reject** - Loan Processor, Loan Appraiser

### 8.2 Custom Workflows

#### Creating Custom Workflow

1. Navigate to **Setup > Workflow**
2. Create new workflow
3. Define states and transitions
4. Assign roles and permissions
5. Link to Loan Application doctype

#### Example Workflow JSON

```json
{
  "workflow_name": "Custom Loan Application Workflow",
  "document_type": "Loan Application",
  "workflow_state_field": "workflow_state",
  "states": [
    {
      "state": "Draft",
      "doc_status": "0"
    },
    {
      "state": "Under Review",
      "doc_status": "0"
    },
    {
      "state": "Approved",
      "doc_status": "1"
    }
  ],
  "transitions": [
    {
      "state": "Draft",
      "action": "Submit for Review",
      "next_state": "Under Review",
      "allowed": "Loan Officer"
    },
    {
      "state": "Under Review",
      "action": "Approve",
      "next_state": "Approved",
      "allowed": "Loan Manager"
    }
  ]
}
```

---

## 9. Notification Settings

### 9.1 Email Notifications

#### Configure Email Server

```bash
# SMTP Settings
bench --site lending.localhost set-config mail_server smtp.gmail.com
bench --site lending.localhost set-config mail_port 587
bench --site lending.localhost set-config mail_login your_email@gmail.com
bench --site lending.localhost set-config mail_password your_password
bench --site lending.localhost set-config use_tls 1
```

#### Email Templates

Create email templates for:
- Loan Application Submitted
- Loan Approved
- Loan Disbursed
- Repayment Due
- Loan Overdue
- Loan Closed

### 9.2 SMS Notifications (Optional)

#### Integration with SMS Gateway

```python
# Configure SMS provider
sms_settings = {
    "provider": "twilio",  # or other provider
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "from_number": "+1234567890"
}
```

### 9.3 In-App Notifications

Configure notification rules:
1. Navigate to **Setup > Notification**
2. Create notification rules
3. Set triggers (e.g., Loan Status Changed)
4. Define recipients

---

## 10. Integration Settings

### 10.1 API Configuration

#### Generate API Keys

```bash
# Create API user
bench --site lending.localhost add-user api_user@example.com

# Generate API key
bench --site lending.localhost set-config api_key "your_api_key"
bench --site lending.localhost set-config api_secret "your_api_secret"
```

#### API Rate Limiting

```bash
# Set rate limits
bench --site lending.localhost set-config api_rate_limit 100  # requests per minute
```

### 10.2 Payment Gateway Integration

#### Configure Payment Gateway

```json
{
  "gateway_name": "Stripe",
  "api_key": "sk_live_...",
  "api_secret": "sk_live_...",
  "webhook_secret": "whsec_...",
  "enabled": 1
}
```

### 10.3 Credit Bureau Integration

#### Configure Credit Bureau API

```json
{
  "provider": "Experian",  # or Equifax, TransUnion
  "api_endpoint": "https://api.experian.com",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret"
}
```

---

## 11. Best Practices

### 11.1 Account Naming Convention

- Use consistent naming: `[Account Type] - [Company]`
- Group related accounts together
- Use clear, descriptive names

### 11.2 Loan Product Organization

- Use consistent product codes: `[Type]-[Number]`
- Group by loan category
- Document product features

### 11.3 Configuration Management

- Document all custom configurations
- Version control configuration files
- Test changes in development first
- Maintain configuration backups

### 11.4 Security Considerations

- Use strong passwords for API keys
- Enable two-factor authentication
- Regularly rotate credentials
- Audit configuration changes

---

## 12. Configuration Checklist

### Initial Setup
- [ ] Company created and configured
- [ ] Chart of Accounts set up
- [ ] All required accounts created
- [ ] Loan Origination Settings configured
- [ ] First Loan Product created
- [ ] Cost Centers created
- [ ] Accounting Dimensions configured (if needed)
- [ ] Workflows configured
- [ ] Email/SMS notifications configured
- [ ] API keys generated
- [ ] Integration settings configured

### Ongoing Maintenance
- [ ] Regular backup of configurations
- [ ] Review and update account mappings
- [ ] Audit user permissions
- [ ] Monitor integration health
- [ ] Update exchange rates (if multi-currency)
- [ ] Review and optimize workflows

---

## Conclusion

This configuration guide provides comprehensive instructions for setting up the Frappe Lending platform. Key points:

1. **Start with Company Setup** - Foundation for all configurations
2. **Set Up Chart of Accounts** - Required for all financial operations
3. **Configure Loan Products** - Define your loan offerings
4. **Set Up Workflows** - Streamline loan processing
5. **Configure Integrations** - Connect with external systems
6. **Follow Best Practices** - Maintain consistency and security

For additional help, refer to:
- Installation & Setup Guide
- Security & Permissions Guide
- API Endpoints Guide

