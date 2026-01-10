# Micro Lending Product Configuration Examples

This document provides ready-to-use micro lending product configurations that can be created via the API or seed script.

## Quick Start

### Using Seed Script
```bash
cd backend
npm run seed:micro-lending
```

### Using API
Use the `POST /loan-products` endpoint with the JSON configurations below.

---

## Product Configurations

### 1. Weekly Micro Loan
**Use Case**: Very short-term needs, weekly repayments

```json
{
  "productCode": "MICRO-WEEKLY-001",
  "productName": "Weekly Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 2.5,
  "penaltyInterestRate": 0.5,
  "minimumLoanAmount": 50,
  "maximumLoanAmount": 5000,
  "minimumTerm": 1,
  "maximumTerm": 6,
  "repaymentScheduleType": "Monthly as per cycle date",
  "cyclicDayOfTheMonth": 7,
  "minDaysBwDisbursementFirstRepayment": 7,
  "averageProcessingTime": 2,
  "averageDisbursementTime": 4,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 200,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Self-Employed", "Daily Wage", "Small Business", "Informal Sector"],
  "useCases": ["Emergency Expenses", "Small Business Working Capital", "Daily Needs", "Medical Expenses"],
  "productTagline": "Quick cash when you need it most",
  "shortDescription": "Get approved in hours and receive funds the same day. Weekly repayments make it easy to manage.",
  "productHighlights": [
    "Same-day approval",
    "Weekly flexible repayments",
    "No collateral required",
    "Quick disbursement"
  ],
  "keyFeatures": [
    "Loan amounts from $50 to $5,000",
    "Weekly repayment schedule",
    "No credit history required",
    "Minimal documentation",
    "Mobile-friendly application"
  ],
  "benefits": [
    "Access funds within hours",
    "Flexible weekly payments",
    "Build credit history",
    "No hidden charges"
  ],
  "targetAudience": "Individuals and small business owners who need quick access to small amounts of cash for short-term needs.",
  "howItWorks": "Step 1: Apply online or via mobile app\nStep 2: Get approved within 2 hours\nStep 3: Receive funds within 4 hours\nStep 4: Repay weekly on your chosen day",
  "processingTimeDescription": "Approval within 2 hours, funds disbursed within 4 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $50 - $5,000
- Term: 1-6 months
- Interest Rate: 2.5% per month (~30% APR)
- Repayment: Weekly (7th, 14th, 21st, 28th)
- Processing: 2 hours approval, 4 hours disbursement

---

### 2. Bi-Weekly Micro Loan
**Use Case**: Medium-term needs, bi-weekly repayments

```json
{
  "productCode": "MICRO-BIWEEKLY-001",
  "productName": "Bi-Weekly Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 2.0,
  "penaltyInterestRate": 0.5,
  "minimumLoanAmount": 100,
  "maximumLoanAmount": 10000,
  "minimumTerm": 1,
  "maximumTerm": 12,
  "repaymentScheduleType": "Monthly as per cycle date",
  "cyclicDayOfTheMonth": 14,
  "minDaysBwDisbursementFirstRepayment": 14,
  "averageProcessingTime": 4,
  "averageDisbursementTime": 8,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 300,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Self-Employed", "Salaried", "Small Business", "Freelancer"],
  "useCases": ["Business Expansion", "Inventory Purchase", "Equipment Financing", "Education Expenses"],
  "productTagline": "Flexible financing for your growing needs",
  "shortDescription": "Bi-weekly repayments that align with your income cycle. Perfect for small businesses and individuals.",
  "productHighlights": [
    "Same-day approval",
    "Bi-weekly repayments",
    "Higher loan amounts",
    "Flexible terms"
  ],
  "keyFeatures": [
    "Loan amounts from $100 to $10,000",
    "Bi-weekly repayment schedule",
    "Flexible 1-12 month terms",
    "Quick approval process",
    "No collateral needed"
  ],
  "benefits": [
    "Align repayments with income",
    "Build business credit",
    "Access larger amounts",
    "Flexible repayment terms"
  ],
  "targetAudience": "Small business owners and individuals with regular income who need medium-term financing.",
  "howItWorks": "Step 1: Complete simple application\nStep 2: Get approved within 4 hours\nStep 3: Receive funds the same day\nStep 4: Repay bi-weekly on 14th and 28th",
  "processingTimeDescription": "Approval within 4 hours, funds disbursed the same day",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $100 - $10,000
- Term: 1-12 months
- Interest Rate: 2.0% per month (~24% APR)
- Repayment: Bi-weekly (14th, 28th)
- Processing: 4 hours approval, same-day disbursement

---

### 3. Monthly Micro Loan
**Use Case**: Traditional micro finance, monthly repayments

```json
{
  "productCode": "MICRO-MONTHLY-001",
  "productName": "Monthly Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 1.8,
  "penaltyInterestRate": 0.5,
  "minimumLoanAmount": 200,
  "maximumLoanAmount": 20000,
  "minimumTerm": 3,
  "maximumTerm": 24,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 24,
  "averageDisbursementTime": 48,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 500,
  "minimumCreditScore": 500,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Salaried", "Self-Employed", "Small Business", "Professional"],
  "useCases": ["Business Expansion", "Equipment Purchase", "Home Improvement", "Debt Consolidation"],
  "productTagline": "Affordable monthly payments for your goals",
  "shortDescription": "Traditional micro finance with monthly repayments. Perfect for larger purchases and business needs.",
  "productHighlights": [
    "Lower interest rates",
    "Monthly repayments",
    "Higher loan amounts",
    "Longer repayment terms"
  ],
  "keyFeatures": [
    "Loan amounts from $200 to $20,000",
    "Monthly repayment schedule",
    "Flexible 3-24 month terms",
    "Competitive interest rates",
    "No prepayment penalties"
  ],
  "benefits": [
    "Affordable monthly payments",
    "Build credit history",
    "Access larger amounts",
    "Flexible terms up to 24 months"
  ],
  "targetAudience": "Small business owners and individuals who need larger amounts with affordable monthly payments.",
  "howItWorks": "Step 1: Apply with basic documents\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Repay monthly on your chosen date",
  "processingTimeDescription": "Approval within 24 hours, funds disbursed within 48 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $200 - $20,000
- Term: 3-24 months
- Interest Rate: 1.8% per month (~21.6% APR)
- Repayment: Monthly
- Processing: 24 hours approval, 48 hours disbursement

---

### 4. Group Micro Loan
**Use Case**: Joint liability group lending

```json
{
  "productCode": "MICRO-GROUP-001",
  "productName": "Group Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 1.5,
  "penaltyInterestRate": 0.5,
  "minimumLoanAmount": 500,
  "maximumLoanAmount": 50000,
  "minimumTerm": 6,
  "maximumTerm": 24,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 48,
  "averageDisbursementTime": 72,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 300,
  "requiresCoApplicant": true,
  "requiresGuarantor": false,
  "employmentTypes": ["Self-Employed", "Small Business", "Group Business", "Cooperative"],
  "useCases": ["Group Business", "Joint Liability", "Community Projects", "Cooperative Financing"],
  "productTagline": "Stronger together - group financing with lower rates",
  "shortDescription": "Group micro loans with joint liability. Lower rates and higher amounts for groups of 3-10 members.",
  "productHighlights": [
    "Lower interest rates",
    "Higher loan amounts",
    "Joint liability",
    "Group support"
  ],
  "keyFeatures": [
    "Group of 3-10 members",
    "Joint liability structure",
    "Loan amounts from $500 to $50,000",
    "Lower interest rates",
    "Group repayment tracking"
  ],
  "benefits": [
    "Access larger amounts",
    "Lower interest rates",
    "Group accountability",
    "Build group credit"
  ],
  "targetAudience": "Groups of 3-10 individuals or businesses who want to access larger loans with joint liability.",
  "howItWorks": "Step 1: Form a group of 3-10 members\nStep 2: Apply together with group details\nStep 3: Get approved within 48 hours\nStep 4: Receive funds within 72 hours\nStep 5: Repay monthly with group accountability",
  "processingTimeDescription": "Group verification within 48 hours, funds disbursed within 72 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $500 - $50,000 (group total)
- Term: 6-24 months
- Interest Rate: 1.5% per month (~18% APR)
- Repayment: Monthly
- Requires: Co-Applicants (3-10 members)
- Processing: 48 hours approval, 72 hours disbursement

---

### 5. Small Business Micro Loan
**Use Case**: Business working capital and expansion

```json
{
  "productCode": "MICRO-BUSINESS-001",
  "productName": "Small Business Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Business",
  "productType": "Unsecured",
  "rateOfInterest": 2.2,
  "penaltyInterestRate": 0.5,
  "minimumLoanAmount": 500,
  "maximumLoanAmount": 25000,
  "minimumTerm": 3,
  "maximumTerm": 18,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 12,
  "averageDisbursementTime": 24,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 1000,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Small Business", "Self-Employed", "Sole Proprietor", "Partnership"],
  "useCases": ["Working Capital", "Inventory Purchase", "Equipment Financing", "Business Expansion"],
  "productTagline": "Fuel your business growth with quick capital",
  "shortDescription": "Quick business loans for working capital, inventory, and equipment. Designed for small businesses.",
  "productHighlights": [
    "Business-focused",
    "Quick approval",
    "Flexible terms",
    "No collateral"
  ],
  "keyFeatures": [
    "Loan amounts from $500 to $25,000",
    "Business use only",
    "Flexible 3-18 month terms",
    "Quick approval process",
    "Working capital support"
  ],
  "benefits": [
    "Access working capital quickly",
    "Grow your business",
    "Build business credit",
    "Flexible repayment"
  ],
  "targetAudience": "Small business owners, sole proprietors, and partnerships who need quick access to working capital.",
  "howItWorks": "Step 1: Apply with business documents\nStep 2: Get approved within 12 hours\nStep 3: Receive funds within 24 hours\nStep 4: Use for business needs\nStep 5: Repay monthly",
  "processingTimeDescription": "Business verification within 12 hours, funds disbursed within 24 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $500 - $25,000
- Term: 3-18 months
- Interest Rate: 2.2% per month (~26.4% APR)
- Repayment: Monthly
- Processing: 12 hours approval, 24 hours disbursement

---

### 6. Agricultural Micro Loan
**Use Case**: Farming and agricultural financing

```json
{
  "productCode": "MICRO-AGRICULTURE-001",
  "productName": "Agricultural Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Agriculture",
  "productType": "Unsecured",
  "rateOfInterest": 1.2,
  "penaltyInterestRate": 0.3,
  "minimumLoanAmount": 200,
  "maximumLoanAmount": 15000,
  "minimumTerm": 3,
  "maximumTerm": 12,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 60,
  "averageProcessingTime": 24,
  "averageDisbursementTime": 48,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 300,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Farmer", "Agricultural Worker", "Livestock Owner", "Fisherman"],
  "useCases": ["Crop Financing", "Livestock Purchase", "Equipment Financing", "Seasonal Needs"],
  "productTagline": "Grow your farm with affordable financing",
  "shortDescription": "Agricultural micro loans with seasonal repayment schedules. Designed for farmers and agricultural workers.",
  "productHighlights": [
    "Lower interest rates",
    "Seasonal repayment",
    "Agricultural focus",
    "Flexible grace periods"
  ],
  "keyFeatures": [
    "Loan amounts from $200 to $15,000",
    "Seasonal repayment options",
    "Flexible 3-12 month terms",
    "Lower interest rates",
    "Crop cycle aligned repayments"
  ],
  "benefits": [
    "Affordable rates for farmers",
    "Seasonal repayment flexibility",
    "Support agricultural growth",
    "Grace periods for crop cycles"
  ],
  "targetAudience": "Farmers, agricultural workers, livestock owners, and fishermen who need financing for agricultural activities.",
  "howItWorks": "Step 1: Apply with agricultural documents\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Use for agricultural needs\nStep 5: Repay after harvest/season",
  "processingTimeDescription": "Agricultural verification within 24 hours, funds disbursed within 48 hours with seasonal repayment options",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $200 - $15,000
- Term: 3-12 months
- Interest Rate: 1.2% per month (~14.4% APR) - subsidized
- Repayment: Monthly with 60-day grace period
- Processing: 24 hours approval, 48 hours disbursement

---

### 7. Payday Micro Loan
**Use Case**: Ultra-short term, same-day cash

```json
{
  "productCode": "MICRO-PAYDAY-001",
  "productName": "Payday Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 3.0,
  "penaltyInterestRate": 1.0,
  "minimumLoanAmount": 100,
  "maximumLoanAmount": 2000,
  "minimumTerm": 1,
  "maximumTerm": 3,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 1,
  "averageDisbursementTime": 2,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 300,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Salaried", "Daily Wage", "Contract Worker"],
  "useCases": ["Emergency Expenses", "Bill Payments", "Short-term Cash Flow", "Unexpected Expenses"],
  "productTagline": "Bridge the gap until payday",
  "shortDescription": "Ultra-quick payday loans. Get approved in 1 hour and receive funds in 2 hours.",
  "productHighlights": [
    "Ultra-fast approval",
    "Same-day disbursement",
    "No credit check",
    "Simple application"
  ],
  "keyFeatures": [
    "Loan amounts from $100 to $2,000",
    "Approval within 1 hour",
    "Funds within 2 hours",
    "Simple application",
    "Short-term (1-3 months)"
  ],
  "benefits": [
    "Get cash the same day",
    "No lengthy approval",
    "Simple process",
    "Quick access"
  ],
  "targetAudience": "Salaried individuals and wage earners who need quick cash before their next payday.",
  "howItWorks": "Step 1: Apply online (5 minutes)\nStep 2: Get approved within 1 hour\nStep 3: Receive funds within 2 hours\nStep 4: Repay on your next payday",
  "processingTimeDescription": "Ultra-fast approval within 1 hour, funds disbursed within 2 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $100 - $2,000
- Term: 1-3 months
- Interest Rate: 3.0% per month (~36% APR)
- Repayment: Monthly
- Processing: 1 hour approval, 2 hours disbursement

---

### 8. Emergency Micro Loan
**Use Case**: Urgent situations, quick access

```json
{
  "productCode": "MICRO-EMERGENCY-001",
  "productName": "Emergency Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 2.8,
  "penaltyInterestRate": 0.8,
  "minimumLoanAmount": 50,
  "maximumLoanAmount": 5000,
  "minimumTerm": 1,
  "maximumTerm": 6,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 3,
  "averageDisbursementTime": 6,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 200,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Any"],
  "useCases": ["Medical Emergency", "Family Emergency", "Urgent Repairs", "Critical Expenses"],
  "productTagline": "When emergencies strike, we respond fast",
  "shortDescription": "Emergency micro loans for urgent situations. Quick approval and disbursement when you need it most.",
  "productHighlights": [
    "Fast approval",
    "Same-day funds",
    "No questions asked",
    "Flexible repayment"
  ],
  "keyFeatures": [
    "Loan amounts from $50 to $5,000",
    "Approval within 3 hours",
    "Funds within 6 hours",
    "Flexible 1-6 month terms",
    "Minimal requirements"
  ],
  "benefits": [
    "Quick access in emergencies",
    "No lengthy process",
    "Flexible repayment",
    "Available 24/7"
  ],
  "targetAudience": "Anyone facing an emergency situation who needs quick access to funds.",
  "howItWorks": "Step 1: Apply via phone or online\nStep 2: Get approved within 3 hours\nStep 3: Receive funds within 6 hours\nStep 4: Repay monthly",
  "processingTimeDescription": "Emergency approval within 3 hours, funds disbursed within 6 hours",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $50 - $5,000
- Term: 1-6 months
- Interest Rate: 2.8% per month (~33.6% APR)
- Repayment: Monthly
- Processing: 3 hours approval, 6 hours disbursement

---

### 9. Student Micro Loan
**Use Case**: Education financing with grace period

```json
{
  "productCode": "MICRO-STUDENT-001",
  "productName": "Student Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Education",
  "productType": "Unsecured",
  "rateOfInterest": 1.0,
  "penaltyInterestRate": 0.2,
  "minimumLoanAmount": 100,
  "maximumLoanAmount": 10000,
  "minimumTerm": 6,
  "maximumTerm": 36,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 90,
  "averageProcessingTime": 48,
  "averageDisbursementTime": 72,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 0,
  "requiresCoApplicant": true,
  "requiresGuarantor": true,
  "employmentTypes": ["Student"],
  "useCases": ["Tuition Fees", "Books and Supplies", "Living Expenses", "Educational Equipment"],
  "productTagline": "Invest in your future with affordable education financing",
  "shortDescription": "Student micro loans with low interest rates and flexible repayment. Start repaying after graduation.",
  "productHighlights": [
    "Low interest rates",
    "Grace period after graduation",
    "Flexible repayment",
    "No income required"
  ],
  "keyFeatures": [
    "Loan amounts from $100 to $10,000",
    "Low interest rates (1% per month)",
    "Grace period after graduation",
    "Flexible 6-36 month terms",
    "Parent/guardian co-signer"
  ],
  "benefits": [
    "Affordable education financing",
    "Start repaying after graduation",
    "Build credit early",
    "Low interest rates"
  ],
  "targetAudience": "Students who need financing for education expenses with flexible repayment after graduation.",
  "howItWorks": "Step 1: Apply with student and parent/guardian\nStep 2: Get approved within 48 hours\nStep 3: Receive funds within 72 hours\nStep 4: Use for education\nStep 5: Start repaying 90 days after graduation",
  "processingTimeDescription": "Student verification within 48 hours, funds disbursed within 72 hours, grace period after graduation",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $100 - $10,000
- Term: 6-36 months
- Interest Rate: 1.0% per month (~12% APR) - subsidized
- Repayment: Monthly with 90-day grace period
- Requires: Co-Applicant (parent/guardian) + Guarantor
- Processing: 48 hours approval, 72 hours disbursement

---

### 10. Women's Micro Loan
**Use Case**: Gender-focused product with lower rates

```json
{
  "productCode": "MICRO-WOMEN-001",
  "productName": "Women's Micro Loan",
  "companyId": "default-company-id",
  "loanCategory": "Micro Finance",
  "productType": "Unsecured",
  "rateOfInterest": 1.5,
  "penaltyInterestRate": 0.3,
  "minimumLoanAmount": 100,
  "maximumLoanAmount": 15000,
  "minimumTerm": 3,
  "maximumTerm": 24,
  "repaymentScheduleType": "Monthly as per repayment start date",
  "minDaysBwDisbursementFirstRepayment": 30,
  "averageProcessingTime": 24,
  "averageDisbursementTime": 48,
  "requiresCollateral": false,
  "minimumMonthlyIncome": 200,
  "requiresCoApplicant": false,
  "requiresGuarantor": false,
  "employmentTypes": ["Self-Employed", "Small Business", "Home-Based Business", "Any"],
  "useCases": ["Women Entrepreneurship", "Home-Based Business", "Skill Development", "Business Expansion"],
  "productTagline": "Empowering women entrepreneurs with affordable financing",
  "shortDescription": "Special micro loans for women with lower interest rates and flexible terms. Designed to support women entrepreneurs.",
  "productHighlights": [
    "Lower interest rates",
    "Women-focused",
    "Flexible terms",
    "Business support"
  ],
  "keyFeatures": [
    "Loan amounts from $100 to $15,000",
    "Lower interest rates (1.5% per month)",
    "Flexible 3-24 month terms",
    "Business training support",
    "No collateral required"
  ],
  "benefits": [
    "Affordable rates for women",
    "Support women entrepreneurship",
    "Build business credit",
    "Access to business training"
  ],
  "targetAudience": "Women entrepreneurs, home-based business owners, and women seeking to start or expand businesses.",
  "howItWorks": "Step 1: Apply with business plan\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Access business training\nStep 5: Repay monthly",
  "processingTimeDescription": "Approval within 24 hours, funds disbursed within 48 hours, includes business training support",
  "isTermLoan": true,
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
  "penaltyWaiverAccount": "PENALTY-WAIVER"
}
```

**Key Features:**
- Loan Amount: $100 - $15,000
- Term: 3-24 months
- Interest Rate: 1.5% per month (~18% APR) - lower for women
- Repayment: Monthly
- Processing: 24 hours approval, 48 hours disbursement

---

## Product Comparison Matrix

| Product | Amount Range | Term | Interest Rate | Processing Time | Repayment |
|---------|--------------|------|---------------|-----------------|-----------|
| Weekly Micro | $50-$5,000 | 1-6 months | 2.5%/month | 2-4 hours | Weekly |
| Bi-Weekly | $100-$10,000 | 1-12 months | 2.0%/month | 4-8 hours | Bi-weekly |
| Monthly | $200-$20,000 | 3-24 months | 1.8%/month | 24-48 hours | Monthly |
| Group | $500-$50,000 | 6-24 months | 1.5%/month | 48-72 hours | Monthly |
| Business | $500-$25,000 | 3-18 months | 2.2%/month | 12-24 hours | Monthly |
| Agriculture | $200-$15,000 | 3-12 months | 1.2%/month | 24-48 hours | Monthly |
| Payday | $100-$2,000 | 1-3 months | 3.0%/month | 1-2 hours | Monthly |
| Emergency | $50-$5,000 | 1-6 months | 2.8%/month | 3-6 hours | Monthly |
| Student | $100-$10,000 | 6-36 months | 1.0%/month | 48-72 hours | Monthly |
| Women's | $100-$15,000 | 3-24 months | 1.5%/month | 24-48 hours | Monthly |
| **Trip Financing** | **$200-$50,000** | **1-6 months** | **2.0%/month** | **4-8 hours** | **Monthly** |
| **Fuel Credit** | **$100-$20,000** | **1-12 months** | **1.8%/month** | **2-4 hours** | **Monthly** |
| **Invoice Financing** | **$500-$100,000** | **1-6 months** | **1.5%/month** | **12-24 hours** | **Monthly** |
| **Warehouse Receipt** | **$1,000-$200,000** | **3-12 months** | **1.2%/month** | **48-72 hours** | **Monthly** |

---

## Usage Instructions

### Option 1: Using Seed Script (Recommended)
```bash
cd backend
npm run seed:micro-lending
```

### Option 2: Using API
```bash
# Create a product
curl -X POST http://localhost:3000/api/loan-products \
  -H "Content-Type: application/json" \
  -d @micro-loan-product.json
```

### Option 3: Using UI
1. Navigate to Administration → Loan Products
2. Click "Create Product"
3. Fill in the form using the configurations above
4. Save

---

## Customization Tips

1. **Adjust Interest Rates**: Modify `rateOfInterest` based on your risk model
2. **Change Loan Amounts**: Adjust `minimumLoanAmount` and `maximumLoanAmount`
3. **Modify Terms**: Change `minimumTerm` and `maximumTerm` ranges
4. **Update Processing Times**: Adjust `averageProcessingTime` and `averageDisbursementTime`
5. **Customize Eligibility**: Modify `minimumMonthlyIncome`, `employmentTypes`, etc.
6. **Add Use Cases**: Update `useCases` array with your specific use cases

---

## Next Steps

1. **Run Seed Script**: Create all 10 products at once
2. **Review Products**: Check in Administration → Loan Products
3. **Test Applications**: Create test loan applications
4. **Customize**: Adjust rates, amounts, and terms as needed
5. **Market**: Use marketing fields for customer-facing applications

---

## Notes

- All products use default accounting accounts (ensure accounts are seeded first)
- Interest rates are per month (multiply by 12 for annual rate)
- Processing times are in hours
- All products are unsecured (no collateral required)
- Group loans require co-applicants (3-10 members)
- Student loans require co-applicant (parent/guardian) and guarantor

