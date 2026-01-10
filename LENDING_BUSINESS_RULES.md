# Frappe Lending - Business Rules & Validations

## Overview
This document details the business rules, validations, calculations, and workflows that govern the Frappe Lending system.

---

## 1. Loan Product Rules

### 1.1 Product Configuration Rules
- **Company Validation**: Each loan product must belong to a specific company
- **Unique Product Code**: `product_code` must be unique across all companies
- **Unique Product Name**: `product_name` must be unique
- **Interest Rate**: `rate_of_interest` is mandatory and must be >= 0
- **Penalty Rate**: `penalty_interest_rate` is optional but recommended
- **NPA Threshold**: `days_past_due_threshold_for_npa` must be >= 0

### 1.2 Account Configuration Rules
- **Required Accounts**:
  - `disbursement_account` - Account from which money is disbursed
  - `payment_account` - Account where repayments are received
  - `loan_account` - Asset account for loan principal
  - `interest_income_account` - Income account for interest
  - `penalty_income_account` - Income account for penalties
  - `interest_accrued_account` - Liability account for accrued interest
  - `interest_receivable_account` - Asset account for interest receivable
  - `penalty_accrued_account` - Liability account for accrued penalties
  - `penalty_receivable_account` - Asset account for penalty receivable
  - `security_deposit_account` - Liability account for security deposits
  - `customer_refund_account` - Account for customer refunds
  - `write_off_account` - Expense account for write-offs
  - `write_off_recovery_account` - Income account for write-off recoveries
  - `interest_waiver_account` - Expense account for interest waivers
  - `penalty_waiver_account` - Expense account for penalty waivers

- **Account Validation**: All accounts must belong to the same company as the loan product

### 1.3 Term Loan Configuration
- **Repayment Schedule Types**:
  - `Monthly as per repayment start date` - Fixed monthly date
  - `Pro-rated calendar months` - Based on calendar month boundaries
  - `Monthly as per cycle date` - Based on cyclic day of month
  - `Line of Credit` - Revolving credit facility

- **Cyclic Date Rule**: If `repayment_schedule_type == "Monthly as per cycle date"`, then `cyclic_day_of_the_month` is mandatory (1-31)

### 1.4 Limits & Constraints
- **Maximum Loan Amount**: Optional limit per loan product
- **Minimum Days**: `min_days_bw_disbursement_first_repayment` must be >= 0
- **Grace Period**: `grace_period_in_days` - Days before penalty is charged (>= 0)
- **Excess Amount Limit**: `excess_amount_acceptance_limit` - Tolerance for excess payments during closure

---

## 2. Loan Application Rules

### 2.1 Application Validation
- **Applicant Type**: Must be either "Employee" or "Customer"
- **Applicant Validation**:
  - If `applicant_type == "Employee"`: Employee must exist and belong to the same company
  - If `applicant_type == "Customer"`: Customer is created automatically if not exists
- **Loan Product**: Must belong to the same company as the application
- **Loan Amount**: 
  - Must be > 0
  - Cannot exceed `maximum_loan_amount` from loan product
  - Cannot exceed `maximum_loan_amount` calculated from proposed securities

### 2.2 Repayment Method Rules
- **Repay Over Number of Periods**:
  - `repayment_periods` is mandatory
  - `repayment_amount` is calculated automatically
  - Formula: Uses amortization calculation based on loan amount, interest rate, and periods

- **Repay Fixed Amount per Period**:
  - `repayment_amount` is mandatory
  - `repayment_amount` cannot exceed `loan_amount`
  - `repayment_periods` is calculated automatically
  - Minimum repayment must be greater than interest-only payment

### 2.3 Security/Collateral Rules
- **Secured Loans**:
  - If `is_secured_loan == 1`, then `proposed_pledges` table must have at least one entry
  - `maximum_loan_amount` is calculated as: `sum(pledge_value * (1 - haircut/100))`
  - Loan amount cannot exceed `maximum_loan_amount`

### 2.4 Status Workflow
```
Open → [Approved/Rejected]
```
- Only "Approved" applications can create Loans
- "Rejected" applications cannot be converted to Loans

---

## 3. Loan Rules

### 3.1 Loan Creation Rules
- **From Application**: Loan can be created from approved Loan Application
- **Direct Creation**: Loan can be created directly (without application)
- **Company Validation**: Loan company must match Loan Product company
- **Employee Validation**: If `applicant_type == "Employee"`, employee must belong to same company
- **Cost Center**: Mandatory if `rate_of_interest > 0`

### 3.2 Loan Amount Rules
- **Term Loans**: `loan_amount` is required (unless Line of Credit)
- **Line of Credit**: `maximum_limit_amount` is used instead of `loan_amount`
- **Amount Validation**: 
  - Cannot exceed product's `maximum_loan_amount`
  - For secured loans: Cannot exceed `maximum_loan_amount` from securities

### 3.3 Repayment Terms Validation
- **Term Loans**:
  - `repayment_periods` is mandatory if `repayment_method == "Repay Over Number of Periods"`
  - `repayment_start_date` is mandatory (except for Line of Credit)
  - `repayment_frequency` is mandatory
  - `repayment_method` is mandatory

- **Line of Credit**:
  - `limit_applicable_start` is mandatory
  - `limit_applicable_end` is mandatory
  - `maximum_limit_amount` is mandatory
  - Repayment schedule is not generated

### 3.4 Status Workflow
```
Draft → Sanctioned → Partially Disbursed → Disbursed → Active 
  → Loan Closure Requested → Closed/Written Off/Settled
```

**Status Rules**:
- **Draft**: Initial state, not submitted
- **Sanctioned**: Submitted but not disbursed
- **Partially Disbursed**: Some but not all amount disbursed
- **Disbursed**: Full amount disbursed (for term loans)
- **Active**: Loan is active and repayments are being made
- **Loan Closure Requested**: Closure process initiated
- **Closed**: Loan fully paid and closed
- **Written Off**: Bad debt written off
- **Settled**: Settled with borrower

### 3.5 Account Validation
All accounts (disbursement_account, payment_account, loan_account, etc.) must:
- Belong to the same company as the loan
- Be active accounts
- Have appropriate account types

### 3.6 Limit Management (Line of Credit)
- **Available Limit**: `available_limit_amount = maximum_limit_amount - utilized_limit_amount`
- **Limit Renewal**: Cannot reduce `maximum_limit_amount` below `utilized_limit_amount`
- **Limit Change Log**: All limit changes are logged in `Loan Limit Change Log`

### 3.7 NPA (Non-Performing Asset) Rules
- **Automatic NPA**: Loan becomes NPA when `days_past_due > days_past_due_threshold_for_npa`
- **Manual NPA**: Can be manually marked as NPA via `manual_npa` flag
- **Unmark NPA**: Can only unmark if `watch_period_end_date` has passed
- **NPA Impact**: 
  - Interest moved to suspense ledger
  - Affects all loans of the same customer
  - Classification code updated

### 3.8 Account Freeze Rules
- **Freeze Account**: Can freeze loan account to stop processing
- **Freeze Date**: Mandatory when `freeze_account == 1`
- **Freeze Impact**:
  - Reverses all demands after freeze date
  - Reverses interest accruals after freeze date
  - Updates days past due
  - Stops further processing until unfrozen

---

## 4. Loan Disbursement Rules

### 4.1 Disbursement Validation
- **Loan Status**: Loan must be in "Sanctioned" or "Partially Disbursed" status
- **Disbursement Date**: Must be >= loan posting date
- **Disbursed Amount**: 
  - Must be > 0
  - Cannot exceed `loan_amount - disbursed_amount` (for term loans)
  - Cannot exceed `available_limit_amount` (for Line of Credit)
- **Minimum Days**: Must respect `min_days_bw_disbursement_first_repayment` from product

### 4.2 Partial Disbursements
- **Multiple Disbursements**: Allowed for term loans
- **Total Disbursed**: Sum of all disbursements cannot exceed `loan_amount`
- **Status Update**: 
  - "Partially Disbursed" if `disbursed_amount < loan_amount`
  - "Disbursed" if `disbursed_amount == loan_amount`

### 4.3 Broken Period Interest (BPI)
- **Calculation**: Interest for partial period between disbursement and first repayment
- **Recovery Methods**:
  - `Upfront Deduction` - Deducted from disbursement amount
  - `Amortized Over Tenure` - Spread over loan tenure
  - `Add to First EMI` - Added to first repayment

### 4.4 Charges
- **Disbursement Charges**: Can add charges during disbursement
- **Charge Accounts**: Fetched from Loan Product or Item Default

### 4.5 Accounting Entries
On disbursement submission:
- **Debit**: Loan Account (Asset)
- **Credit**: Disbursement Account (Bank/Cash)
- **Charges**: Debit to respective charge accounts, Credit to income accounts

---

## 5. Loan Repayment Rules

### 5.1 Repayment Types
- **Normal Repayment**: Regular repayment against demands
- **Interest Waiver**: Waive interest amount
- **Penalty Waiver**: Waive penalty amount
- **Charge Payment**: Payment against specific charges
- **Advance Payment**: Payment in advance of due date
- **Pre Payment**: Prepayment of principal
- **Loan Closure**: Full closure of loan
- **Full Settlement**: Settlement with borrower
- **Write Off Settlement**: Settlement via write-off

### 5.2 Repayment Validation
- **Loan Status**: Loan must be active (Disbursed/Active)
- **Value Date**: Date on which repayment is effective
- **Posting Date**: Date on which repayment is recorded
- **Amount Validation**:
  - `amount_paid` must be > 0
  - For closure types: Must cover all outstanding amounts
  - For normal repayment: Can be partial or full

### 5.3 Amount Calculation
The system calculates:
- `pending_principal_amount` - Outstanding principal
- `interest_payable` - Outstanding interest from demands
- `penalty_amount` - Outstanding penalties
- `total_charges_payable` - Outstanding charges
- `payable_amount` - Total amount due
- `unbooked_interest` - Interest not yet booked
- `unaccrued_interest` - Interest not yet accrued
- `available_security_deposit` - Available security deposit amount

### 5.4 Allocation Rules
Repayment is allocated in the following order (configurable via `Loan Demand Offset Order`):
1. Penalty
2. Interest
3. Principal
4. Charges

**Collection Offset Sequence** varies by asset classification:
- Standard Asset
- Sub Standard Asset
- Written Off Asset
- Settlement Collection

### 5.5 Moratorium Rules
- **No Repayments During Moratorium**: Repayments are blocked during moratorium period
- **Moratorium Types**:
  - `EMI` - Entire EMI is waived
  - `Principal` - Only principal is waived, interest continues

### 5.6 Excess Amount Handling
- **Excess Payment**: If `amount_paid > payable_amount`, excess is stored in `excess_amount`
- **Excess Usage**: Excess can be used for future repayments
- **Closure Excess**: During closure, excess within `excess_amount_acceptance_limit` is accepted

### 5.7 Prepayment Rules
- **Prepayment Charges**: May apply based on product configuration
- **Schedule Reschedule**: If prepayment reduces tenure, schedule is automatically rescheduled
- **Advance Payment**: Creates new repayment schedule entries

### 5.8 Security Deposit Usage
- **Available Deposit**: Can use `available_security_deposit` for repayment
- **Auto Application**: Applied automatically if configured

### 5.9 Accounting Entries
On repayment submission:
- **Debit**: Payment Account (Bank/Cash)
- **Credit**: Loan Account (Principal portion)
- **Credit**: Interest Income Account (Interest portion)
- **Credit**: Penalty Income Account (Penalty portion)

---

## 6. Loan Repayment Schedule Rules

### 6.1 Schedule Generation
- **Term Loans Only**: Schedules are generated only for term loans
- **Generation Trigger**: 
  - On loan submission (if disbursed)
  - On disbursement (if loan already submitted)
- **Schedule Type**: Based on `repayment_schedule_type` from loan product

### 6.2 Schedule Calculation
- **Principal**: Calculated based on repayment method
- **Interest**: Calculated based on outstanding principal and interest rate
- **Total Payment**: `principal + interest`
- **Balance**: Outstanding principal after each payment

### 6.3 Schedule Types

**Monthly as per repayment start date**:
- Fixed date each month (e.g., 15th of every month)
- Number of periods = `repayment_periods`

**Pro-rated calendar months**:
- Based on calendar month boundaries
- First period may be partial
- `repayment_date_on` determines if end or start of month

**Monthly as per cycle date**:
- Based on `cyclic_day_of_the_month` from product
- Fixed day each month (e.g., 5th of every month)

### 6.4 Schedule Status
- **Pending**: Not yet due
- **Partially Paid**: Partially paid
- **Completed**: Fully paid
- **Initiated**: For restructured loans

### 6.5 Moratorium Handling
- **Moratorium Period**: No schedule entries during moratorium
- **Interest Treatment**:
  - `Capitalize`: Added to principal
  - `Add to first repayment`: Added to first EMI after moratorium

---

## 7. Interest Accrual Rules

### 7.1 Daily Accrual
- **Frequency**: Daily batch job (`Process Loan Interest Accrual`)
- **Accrual Date**: Based on `posting_date`
- **Active Loans Only**: Only accrues for active loans
- **Frozen Loans**: No accrual for frozen loans

### 7.2 Accrual Types
- **Regular Interest**: Standard interest accrual
- **Additional Interest**: Additional interest (if configured)
- **Broken Period Interest**: Interest for partial periods

### 7.3 Accrual Calculation
```
Daily Interest = (Outstanding Principal × Annual Interest Rate) / (Days in Year × 100)
```
- **Day Count Convention**: Based on product configuration
- **Outstanding Principal**: Current outstanding principal amount

### 7.4 Accrual Accounting
- **Debit**: Interest Receivable Account
- **Credit**: Interest Accrued Account

### 7.5 Unaccrued Interest
- **Calculation**: Interest that should have been accrued but wasn't
- **Booking**: Booked when repayment is made or loan is closed

---

## 8. Loan Demand Rules

### 8.1 Demand Generation
- **Frequency**: Daily batch job (`Process Loan Demand`)
- **Generation**: Based on repayment schedule due dates
- **Demand Date**: Based on schedule payment date
- **Due Date**: Based on product configuration

### 8.2 Demand Components
- **Principal**: Principal amount due
- **Interest**: Interest amount due
- **Penalty**: Penalty amount (if overdue)
- **Charges**: Additional charges (if any)

### 8.3 Demand Status
- **Unpaid**: Not yet paid
- **Partially Paid**: Partially paid
- **Paid**: Fully paid
- **Waived**: Waived by lender

### 8.4 Overdue Calculation
- **Days Past Due**: Calculated from due date
- **Penalty Calculation**: Based on `penalty_interest_rate` and days overdue
- **Grace Period**: No penalty during grace period

---

## 9. Loan Security Rules

### 9.1 Security Assignment
- **Pledge Process**: Securities must be pledged before loan disbursement
- **Status Flow**: `Pledge Requested → Pledged → Release Requested → Released`
- **Multiple Securities**: Multiple securities can be pledged to one loan
- **Multiple Loans**: One security can be pledged to multiple loans (if available)

### 9.2 Security Valuation
- **Haircut**: Applied to security value (e.g., 20% haircut means 80% loan value)
- **Maximum Loan Value**: `security_value × (1 - haircut/100)`
- **Price Updates**: Security prices can be updated, affecting loan value

### 9.3 Security Shortfall
- **Calculation**: When security value falls below required amount
- **Monitoring**: Daily batch job checks for shortfalls
- **Actions**: 
  - Notify lender
  - Request additional security
  - Adjust loan terms

### 9.4 Security Release
- **Release Request**: Can request release of security
- **Validation**: Can only release if loan is closed or sufficient other securities
- **Release Process**: `Release Requested → Released`

---

## 10. Loan Restructure Rules

### 10.1 Restructure Types
- **Normal Restructure**: Modify loan terms (tenure, rate, etc.)
- **Settlement Restructure**: Settlement with borrower

### 10.2 Restructure Validation
- **Overdue Amounts**: Must capture all overdue amounts
- **New Schedule**: New repayment schedule is generated
- **Restructure Count**: Incremented on each restructure
- **Watch Period**: May have watch period after restructure

### 10.3 Restructure Impact
- **Schedule Regeneration**: Old schedule cancelled, new schedule created
- **Status Update**: Loan status may change
- **Classification**: May affect loan classification

---

## 11. Loan Write Off Rules

### 11.1 Write Off Conditions
- **Automatic Write Off**: If pending amount < `write_off_amount` from product
- **Manual Write Off**: Can be manually created
- **Settlement Write Off**: Part of settlement process

### 11.2 Write Off Validation
- **Write Off Amount**: Must equal `pending_principal_amount`
- **Loan Status**: Loan must be active
- **Unbooked Interest**: Unbooked interest is processed

### 11.3 Write Off Process
- **Interest Processing**: Unbooked interest is processed
- **Waivers**: Interest/penalty waivers are created
- **GL Entries**: Write off accounting entries
- **Suspense Cancellation**: Suspense entries are cancelled
- **Charges**: Charges are written off
- **Status Update**: Loan status → "Written Off"

---

## 12. Co-Lending Rules

### 12.1 Loan Partner Configuration
- **Share Percentage**: Partner's share in the loan
- **Interest Rate**: Partner's interest rate (may differ from loan rate)
- **Payment Ratio**: Ratio for payment distribution

### 12.2 Co-Lending Processing
- **Disbursement**: Shared based on share percentage
- **Repayment**: Distributed based on payment ratio
- **Interest**: Calculated separately for each partner
- **GL Entries**: Separate entries for each partner

### 12.3 FLDG (First Loss Default Guarantee)
- **Trigger**: Can be triggered for specific loans
- **Impact**: Affects partner share and risk distribution

---

## 13. Loan Classification Rules

### 13.1 Classification Codes
- **Standard**: Performing asset
- **Sub Standard**: Asset with some risk
- **Doubtful**: High risk asset
- **Loss**: Asset likely to be lost

### 13.2 Classification Criteria
- **Days Past Due**: Primary criteria
- **Range Based**: Each classification has a DPD range
- **Automatic Classification**: Daily batch job updates classification

### 13.3 Classification Impact
- **NPA Status**: Affects NPA marking
- **Provisioning**: May require provisioning
- **Collection Strategy**: Affects collection approach

---

## 14. Accounting Integration Rules

### 14.1 GL Entry Rules
- **Double Entry**: All transactions create balanced GL entries
- **Value Date**: GL entries use value date (not posting date)
- **Cost Center**: Mandatory for interest-bearing loans
- **Accounting Dimensions**: Supported for multi-dimensional accounting

### 14.2 Audit Trail
- **Maintained For**: 
  - Loan Balance Adjustment
  - Loan Disbursement
  - Loan Interest Accrual
  - Loan Refund
  - Loan Repayment
  - Loan Write Off

### 14.3 Bank Reconciliation
- **Supported Doctypes**:
  - Loan Repayment
  - Loan Disbursement
- **Clearance Date**: Used for bank reconciliation

---

## 15. Data Integrity Rules

### 15.1 Referential Integrity
- **Loan → Loan Product**: Must exist and be active
- **Loan → Company**: Must match product company
- **Loan → Applicant**: Must exist and belong to same company
- **Transactions → Loan**: Loan must exist and be active

### 15.2 Amount Consistency
- **Disbursed Amount**: Sum of disbursements = loan disbursed_amount
- **Repaid Amount**: Sum of repayments = loan total_amount_paid
- **Outstanding**: Calculated from transactions, not stored

### 15.3 Date Consistency
- **Disbursement Date**: Must be >= loan posting date
- **Repayment Date**: Must be >= disbursement date
- **Value Date**: Must be <= posting date (for backdated entries)

---

## 16. Business Process Rules

### 16.1 Loan Lifecycle
1. **Application** → Loan Application created
2. **Approval** → Application approved
3. **Sanction** → Loan created and sanctioned
4. **Disbursement** → Money disbursed
5. **Active** → Loan active, repayments ongoing
6. **Closure** → Loan closed or written off

### 16.2 Batch Processing
- **Daily Jobs**:
  - Interest Accrual
  - Demand Generation
  - Security Shortfall Check
  - Loan Classification
- **Monthly Jobs**:
  - Restructure Limit Calculation

### 16.3 Workflow Rules
- **Approval Workflow**: Loan applications can have approval workflows
- **State Management**: Status changes trigger validations
- **Document Flow**: Documents flow through defined states

---

## 17. Calculation Formulas

### 17.1 Interest Calculation
```
Daily Interest = (Principal × Annual Rate) / (Days in Year × 100)
Monthly Interest = (Principal × Annual Rate) / (12 × 100)
```

### 17.2 EMI Calculation (Reducing Balance)
```
EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
Where:
  P = Principal
  R = Monthly Interest Rate (Annual Rate / 12 / 100)
  N = Number of Periods
```

### 17.3 Penalty Calculation
```
Penalty = (Outstanding Amount × Penalty Rate × Days Overdue) / (Days in Year × 100)
```

### 17.4 Security Value Calculation
```
Maximum Loan Value = Security Value × (1 - Haircut%)
Available Security = Original Value - Utilized Value
```

---

## 18. Error Handling & Edge Cases

### 18.1 Validation Errors
- All validation errors prevent document submission
- Clear error messages guide users
- Field-level validations prevent invalid data entry

### 18.2 Calculation Edge Cases
- **Zero Interest**: Handled separately
- **Partial Periods**: Broken period interest calculated
- **Rounding**: Currency precision applied consistently
- **Negative Amounts**: Prevented through validations

### 18.3 Data Consistency
- **Concurrent Updates**: Handled through database locks
- **Backdated Entries**: Validated against existing transactions
- **Cancellation**: Proper reversal of all related entries

---

This document provides a comprehensive guide to all business rules and validations in the Frappe Lending system. For implementation details, refer to the source code in the respective doctype Python files.

