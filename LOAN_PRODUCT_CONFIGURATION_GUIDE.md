# Loan Product Configuration Guide

## Overview

This guide explains how to configure loan products in the Uruti Lending Platform, including all settings, terms and conditions, and accounting account mappings.

## Accessing Loan Product Configuration

### Via API

**Base URL**: `http://localhost:3000/api/loan-products`

**Endpoints**:
- `POST /loan-products` - Create a new loan product
- `GET /loan-products` - List all loan products
- `GET /loan-products/:id` - Get product by ID
- `GET /loan-products/code/:productCode` - Get product by code
- `PATCH /loan-products/:id` - Update product
- `DELETE /loan-products/:id` - Delete product
- `POST /loan-products/:id/charges` - Add charge to product
- `GET /loan-products/:id/charges` - Get all charges for product

### Via Swagger UI

1. Navigate to: `http://localhost:3000/api-docs`
2. Find the `loan-products` section
3. Use the interactive API documentation

## Configuration Fields

### 1. Basic Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `productCode` | String | Yes | Unique product identifier | `PL-001` |
| `productName` | String | Yes | Product display name | `Personal Loan` |
| `companyId` | String (UUID) | Yes | Company owning the product | `company-uuid` |
| `productDescription` | Text | No | Product description | `A flexible personal loan...` |
| `termsAndConditions` | Text | No | Terms and conditions | See below |
| `disabled` | Boolean | No | Disable product | `false` |

### 2. Interest & Rates

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `rateOfInterest` | Decimal | Yes | Annual interest rate (%) | `12.5` |
| `penaltyInterestRate` | Decimal | No | Penalty rate per annum (%) | `2.0` |
| `gracePeriodInDays` | Integer | No | Days before penalty applies | `0` |

### 3. Loan Amount & Limits

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `maximumLoanAmount` | Decimal | No | Maximum loan amount | `1000000` |
| `writeOffAmount` | Decimal | No | Auto write-off limit | `0` |
| `excessAmountAcceptanceLimit` | Decimal | No | Excess payment tolerance (0-1) | `0.05` |

### 4. Repayment Configuration

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `isTermLoan` | Boolean | No | Is this a term loan? | `true` |
| `repaymentScheduleType` | Enum | Conditional | Schedule type | See below |
| `cyclicDayOfTheMonth` | Integer | Conditional | Day for cyclic schedules (1-31) | `15` |
| `repaymentDateOn` | String | Conditional | Date position | `End of the current month` |
| `minDaysBwDisbursementFirstRepayment` | Integer | Yes | Minimum days gap | `30` |

**Repayment Schedule Types**:
- `MONTHLY_AS_PER_START_DATE` - Monthly as per repayment start date
- `MONTHLY_AS_PER_CYCLE_DATE` - Monthly as per cycle date
- `PRO_RATED_CALENDAR_MONTHS` - Pro-rated calendar months
- `LINE_OF_CREDIT` - Line of credit

### 5. NPA & Risk Configuration

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `daysPastDueThresholdForNpa` | Integer | No | DPD threshold for NPA | `90` |

### 6. Broken Period Interest (BPI) Configuration

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `bpiRecoveryMethod` | Enum | No | How BPI is recovered | See below |

**BPI Recovery Methods**:
- `Amortized Over Tenure` - Spread BPI over loan tenure
- `Add to First EMI` - Add BPI to first EMI
- `Upfront Deduction` - Deduct BPI upfront

### 7. Accounting Account Configuration

All accounting accounts must reference account codes from the Chart of Accounts. Use the seeded account codes or create custom accounts.

| Field | Type | Required | Description | Seeded Account Code |
|-------|------|----------|-------------|---------------------|
| `disbursementAccount` | String | Yes | Account from which loans are disbursed | `BANK-DISBURSEMENT` |
| `paymentAccount` | String | Yes | Account where repayments are received | `BANK-PAYMENT` |
| `loanAccount` | String | Yes | Principal amount of loans | `LOAN-ACCOUNT` |
| `interestIncomeAccount` | String | Yes | Interest income account | `INTEREST-INCOME` |
| `penaltyIncomeAccount` | String | Yes | Penalty income account | `PENALTY-INCOME` |
| `interestAccruedAccount` | String | Yes | Accrued interest liability | `INTEREST-ACCRUED` |
| `interestReceivableAccount` | String | Yes | Interest receivable | `INTEREST-RECEIVABLE` |
| `penaltyAccruedAccount` | String | Yes | Accrued penalty liability | `PENALTY-ACCRUED` |
| `penaltyReceivableAccount` | String | Yes | Penalty receivable | `PENALTY-RECEIVABLE` |
| `securityDepositAccount` | String | Yes | Security deposits | `SECURITY-DEPOSIT` |
| `customerRefundAccount` | String | Yes | Customer refunds | `CUSTOMER-REFUND` |
| `writeOffAccount` | String | Yes | Write-off expenses | `WRITE-OFF-EXPENSE` |
| `writeOffRecoveryAccount` | String | Yes | Write-off recovery | `WRITE-OFF-RECOVERY` |
| `interestWaiverAccount` | String | Yes | Interest waiver | `INTEREST-WAIVER` |
| `penaltyWaiverAccount` | String | Yes | Penalty waiver | `PENALTY-WAIVER` |

## Terms and Conditions

The `termsAndConditions` field supports plain text or HTML. Here's a template:

```
TERMS AND CONDITIONS FOR PERSONAL LOAN

1. ELIGIBILITY
   - Borrower must be at least 18 years old
   - Minimum monthly income: $2,000
   - Valid government-issued ID required
   - Credit score minimum: 650

2. LOAN AMOUNT
   - Minimum: $5,000
   - Maximum: $100,000
   - Amount subject to credit assessment

3. INTEREST RATE
   - Annual interest rate: 12.5%
   - Interest calculated on reducing balance
   - Fixed rate for the loan tenure

4. REPAYMENT
   - Monthly installments
   - Minimum tenure: 12 months
   - Maximum tenure: 60 months
   - Late payment penalty: 2% per annum

5. FEES AND CHARGES
   - Processing fee: 2% of loan amount (one-time)
   - Late payment fee: $25 per occurrence
   - Prepayment charges: None

6. SECURITY
   - Unsecured loan (no collateral required)
   - Personal guarantee may be required

7. DEFAULT
   - Loan classified as NPA after 90 days past due
   - Legal action may be initiated

8. PREPAYMENT
   - Full or partial prepayment allowed
   - No prepayment charges

9. DISBURSEMENT
   - Funds disbursed within 3-5 business days after approval
   - Disbursement to verified bank account only

10. GENERAL TERMS
    - All terms subject to company policy
    - Company reserves right to modify terms
    - Disputes subject to jurisdiction of [Location]
```

## Example: Creating a Loan Product

### Using cURL

```bash
curl -X POST http://localhost:3000/api/loan-products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productCode": "PL-001",
    "productName": "Personal Loan",
    "companyId": "default-company-id",
    "rateOfInterest": 12.5,
    "penaltyInterestRate": 2.0,
    "maximumLoanAmount": 500000,
    "isTermLoan": true,
    "repaymentScheduleType": "MONTHLY_AS_PER_START_DATE",
    "minDaysBwDisbursementFirstRepayment": 30,
    "gracePeriodInDays": 0,
    "daysPastDueThresholdForNpa": 90,
    "bpiRecoveryMethod": "Amortized Over Tenure",
    "disbursementAccount": "BANK-DISBURSEMENT",
    "paymentAccount": "BANK-PAYMENT",
    "loanAccount": "LOAN-ACCOUNT",
    "interestIncomeAccount": "INTEREST-INCOME",
    "penaltyIncomeAccount": "PENALTY-INCOME",
    "interestAccruedAccount": "INTEREST-ACCRUED",
    "interestReceivableAccount": "INTEREST-RECEIVABLE",
    "penaltyAccruedAccount": "PENALTY-ACCRUED",
    "penaltyReceivableAccount": "PENALTY-RECEIVABLE",
    "securityDepositAccount": "SECURITY-DEPOSIT",
    "customerRefundAccount": "CUSTOMER-REFUND",
    "writeOffAccount": "WRITE-OFF-EXPENSE",
    "writeOffRecoveryAccount": "WRITE-OFF-RECOVERY",
    "interestWaiverAccount": "INTEREST-WAIVER",
    "penaltyWaiverAccount": "PENALTY-WAIVER",
    "productDescription": "A flexible personal loan product for individuals with competitive interest rates and flexible repayment options.",
    "termsAndConditions": "1. Borrower must be 18+ years old\n2. Minimum income requirement: $2,000/month\n3. Interest rate: 12.5% per annum\n4. Late payment penalty: 2% per annum\n5. Loan classified as NPA after 90 days past due"
  }'
```

### Using Swagger UI

1. Navigate to `http://localhost:3000/api-docs`
2. Find `POST /loan-products`
3. Click "Try it out"
4. Fill in the request body
5. Click "Execute"

## Adding Charges to Loan Products

Loan products can have associated charges (processing fees, late fees, etc.):

```bash
curl -X POST http://localhost:3000/api/loan-products/{productId}/charges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "chargeName": "Processing Fee",
    "chargeType": "Percentage",
    "chargeAmount": 2.0,
    "chargeBasedOn": "Loan Amount",
    "isActive": true
  }'
```

## Best Practices

### 1. Account Configuration
- Always use account codes from the Chart of Accounts
- Verify accounts exist before creating the product
- Use seeded accounts for standard operations
- Create custom accounts if needed for specific products

### 2. Interest Rates
- Set competitive but sustainable rates
- Consider market conditions
- Document rate calculation methodology

### 3. Terms and Conditions
- Use clear, plain language
- Include all relevant clauses
- Comply with local regulations
- Review and update regularly

### 4. Repayment Schedules
- Choose appropriate schedule type based on product
- Set realistic minimum days between disbursement and first repayment
- Consider borrower cash flow patterns

### 5. Risk Management
- Set appropriate NPA thresholds
- Configure grace periods appropriately
- Set write-off limits

## Verifying Configuration

After creating a loan product, verify:

1. **Product Details**: Check all fields are correct
2. **Account Mapping**: Verify all accounting accounts exist
3. **Charges**: Review associated charges
4. **Terms**: Ensure terms and conditions are complete

```bash
# Get product details
curl -X GET http://localhost:3000/api/loan-products/code/PL-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get product charges
curl -X GET http://localhost:3000/api/loan-products/{productId}/charges \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Account Not Found**
   - Error: `Account with code XXX not found`
   - Solution: Ensure account exists in Chart of Accounts or use seeded account codes

2. **Invalid Company ID**
   - Error: `Company not found`
   - Solution: Use valid company UUID or default company ID

3. **Duplicate Product Code**
   - Error: `Product code already exists`
   - Solution: Use unique product code

4. **Invalid Repayment Schedule**
   - Error: `Invalid repayment schedule configuration`
   - Solution: Ensure `cyclicDayOfTheMonth` is set for cycle-based schedules

## Related Documentation

- [Account Seeds Guide](./backend/ACCOUNT_SEEDS.md) - Chart of Accounts setup
- [Accounting Implementation](./ACCOUNTING_IMPLEMENTATION_STATUS.md) - Accounting integration
- [Frappe Lending Comparison](./FRAPPE_LENDING_COMPARISON.md) - Feature comparison

## Next Steps

1. **Seed Accounts**: Run `npm run seed:accounts` to create Chart of Accounts
2. **Create Products**: Use API or Swagger to create loan products
3. **Configure Charges**: Add relevant charges to products
4. **Test**: Create test loan applications to verify configuration
5. **Document**: Document product-specific terms and conditions

