# Account Seeds - Chart of Accounts

## Overview

The backend includes an account seeding service that creates a standard Chart of Accounts structure for lending operations. This provides a complete set of accounts organized hierarchically.

## Default Chart of Accounts Structure

The seed creates the following account structure:

### Assets
- **Assets** (Group)
  - **Current Assets** (Group)
    - **Bank Accounts** (Group)
      - Disbursement Account
      - Payment Account
      - Operating Account
    - **Accounts Receivable** (Group)
      - Interest Receivable
      - Penalty Receivable
      - Charges Receivable
    - **Loans and Advances** (Group)
      - Loan Account
      - Interest Accrued (Asset)

### Liabilities
- **Liabilities** (Group)
  - **Current Liabilities** (Group)
    - **Accounts Payable** (Group)
      - Interest Accrued
      - Penalty Accrued
    - Security Deposit

### Income
- **Income** (Group)
  - **Direct Income** (Group)
    - Interest Income
    - Penalty Income
    - Processing Fee Income
    - Write-Off Recovery

### Expenses
- **Expenses** (Group)
  - **Direct Expenses** (Group)
    - Write-Off Expense
    - Interest Waiver
    - Penalty Waiver
    - Customer Refund Account
  - **Operating Expenses** (Group)
    - Administrative Expenses

### Equity
- **Equity** (Group)
  - Capital
  - Retained Earnings

## Usage

### Option 1: Using npm Script (Recommended)

**Normal Seed** (only if no accounts exist):
```bash
npm run seed:accounts
```

**Seed for specific company:**
```bash
npm run seed:accounts <company-id>
```

**Force Seed** (recreates even if accounts exist):
```bash
npm run seed:accounts <company-id> force
```

### Option 2: Using API Endpoint

**Normal Seed:**
```bash
POST /api/accounting/accounts/seed
```

**Seed for specific company:**
```bash
POST /api/accounting/accounts/seed?companyId=<company-id>
```

**Force Seed:**
```bash
POST /api/accounting/accounts/seed?companyId=<company-id>&force=true
```

### Option 3: Using Swagger UI

1. Open Swagger UI: http://localhost:3000/api-docs
2. Navigate to `accounting` section
3. Find `POST /accounting/accounts/seed`
4. Click "Try it out"
5. Enter optional `companyId` and `force` parameters
6. Click "Execute"

### Option 4: Using cURL

```bash
# Normal seed (default company)
curl -X POST http://localhost:3000/api/accounting/accounts/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Seed for specific company
curl -X POST "http://localhost:3000/api/accounting/accounts/seed?companyId=company-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Force seed
curl -X POST "http://localhost:3000/api/accounting/accounts/seed?companyId=company-uuid&force=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Account Details

### Key Accounts for Lending Operations

| Account Code | Account Name | Type | Purpose |
|-------------|--------------|------|---------|
| `BANK-DISBURSEMENT` | Disbursement Account | Asset | Account from which loans are disbursed |
| `BANK-PAYMENT` | Payment Account | Asset | Account where repayments are received |
| `LOAN-ACCOUNT` | Loan Account | Asset | Principal amount of loans |
| `INTEREST-RECEIVABLE` | Interest Receivable | Asset | Interest receivable from borrowers |
| `PENALTY-RECEIVABLE` | Penalty Receivable | Asset | Penalty charges receivable |
| `INTEREST-ACCRUED` | Interest Accrued | Liability | Accrued interest liability |
| `PENALTY-ACCRUED` | Penalty Accrued | Liability | Accrued penalty liability |
| `SECURITY-DEPOSIT` | Security Deposit | Liability | Security deposits from borrowers |
| `INTEREST-INCOME` | Interest Income | Income | Interest income from loans |
| `PENALTY-INCOME` | Penalty Income | Income | Penalty charges income |
| `PROCESSING-FEE-INCOME` | Processing Fee Income | Income | Processing fees income |
| `WRITE-OFF-EXPENSE` | Write-Off Expense | Expense | Loan write-off expenses |
| `INTEREST-WAIVER` | Interest Waiver | Expense | Interest waiver expenses |
| `PENALTY-WAIVER` | Penalty Waiver | Expense | Penalty waiver expenses |
| `CUSTOMER-REFUND` | Customer Refund Account | Expense | Account for customer refunds |

## Integration with Loan Products

After seeding accounts, you can configure loan products to use these accounts:

- **Disbursement Account**: `BANK-DISBURSEMENT`
- **Payment Account**: `BANK-PAYMENT`
- **Loan Account**: `LOAN-ACCOUNT`
- **Interest Income Account**: `INTEREST-INCOME`
- **Penalty Income Account**: `PENALTY-INCOME`
- **Interest Accrued Account**: `INTEREST-ACCRUED`
- **Interest Receivable Account**: `INTEREST-RECEIVABLE`
- **Penalty Accrued Account**: `PENALTY-ACCRUED`
- **Penalty Receivable Account**: `PENALTY-RECEIVABLE`
- **Security Deposit Account**: `SECURITY-DEPOSIT`
- **Customer Refund Account**: `CUSTOMER-REFUND`
- **Write-Off Account**: `WRITE-OFF-EXPENSE`
- **Write-Off Recovery Account**: `WRITE-OFF-RECOVERY`
- **Interest Waiver Account**: `INTEREST-WAIVER`
- **Penalty Waiver Account**: `PENALTY-WAIVER`

## Notes

- Accounts are created with `isActive: true` and `isFrozen: false`
- All accounts use USD as default currency
- Opening balances are set to 0
- The seed creates a hierarchical structure with proper parent-child relationships
- Group accounts cannot be used in transactions (only leaf accounts)
- If accounts already exist and `force=false`, the seed will skip creation
- If `force=true`, existing accounts will be deleted and recreated

## Customization

You can modify the account structure by editing:
- `backend/src/modules/accounting/services/account-seed.service.ts`
- Update the `accountsData` array to add, remove, or modify accounts

