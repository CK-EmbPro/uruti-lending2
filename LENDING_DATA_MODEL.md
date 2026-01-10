# Frappe Lending Data Model

## Overview
This document provides a comprehensive view of the Frappe Lending data model, including all major entities (DocTypes) and their relationships.

## Core Entities

### 1. **Loan Product** (Master Data)
**Purpose**: Defines loan product templates with terms, rates, and account configurations.

**Key Fields**:
- `product_code` (Unique identifier)
- `product_name`
- `company` (Link to Company)
- `rate_of_interest` (Percent)
- `penalty_interest_rate` (Percent)
- `is_term_loan` (Check)
- `repayment_schedule_type` (Select: Monthly, Pro-rated, Line of Credit)
- `maximum_loan_amount` (Currency)
- `days_past_due_threshold_for_npa` (Int)
- `loan_category` (Link to Loan Category)
- **Accounting Accounts**: disbursement_account, payment_account, loan_account, interest_income_account, penalty_income_account, etc.
- `loan_charges` (Table: Loan Charges)
- `loan_partners` (Table: Loan Product Loan Partner - for co-lending)

**Relationships**:
- One-to-Many: → Loan, Loan Application
- Many-to-Many: → Loan Partner (via Loan Product Loan Partner)

---

### 2. **Loan Application** (Transaction)
**Purpose**: Initial loan application submitted by applicant.

**Key Fields**:
- `applicant_type` (Select: Employee, Customer)
- `applicant` (Dynamic Link based on applicant_type)
- `company` (Link to Company)
- `loan_product` (Link to Loan Product)
- `loan_amount` (Currency)
- `is_term_loan` (Check)
- `is_secured_loan` (Check)
- `rate_of_interest` (Percent)
- `repayment_method` (Select: Repay Fixed Amount, Repay Over Periods)
- `repayment_periods` (Int)
- `repayment_amount` (Currency)
- `total_payable_amount` (Currency)
- `total_payable_interest` (Currency)
- `status` (Select: Open, Approved, Rejected)
- `proposed_pledges` (Table: Proposed Pledge)
- `documents` (Table: Loan Application Document)

**Relationships**:
- Many-to-One: → Loan Product
- One-to-One: → Loan (when approved)
- One-to-Many: → Proposed Pledge, Loan Application Document

---

### 3. **Loan** (Core Transaction)
**Purpose**: The main loan record created from an approved application.

**Key Fields**:
- `applicant_type` (Select: Employee, Member, Customer)
- `applicant` (Dynamic Link)
- `loan_application` (Link to Loan Application) - optional
- `company` (Link to Company)
- `loan_product` (Link to Loan Product)
- `loan_amount` (Currency)
- `disbursed_amount` (Currency)
- `disbursement_date` (Date)
- `rate_of_interest` (Percent)
- `penalty_charges_rate` (Percent)
- `status` (Select: Draft, Sanctioned, Partially Disbursed, Disbursed, Active, Loan Closure Requested, Closed, Written Off, Settled)
- `is_term_loan` (Check)
- `is_secured_loan` (Check)
- `repayment_schedule_type` (Data)
- `repayment_method` (Select)
- `repayment_periods` (Int)
- `monthly_repayment_amount` (Currency)
- `repayment_frequency` (Select: Monthly, Daily, Weekly, Bi-Weekly, Quarterly, One Time)
- `moratorium_type` (Select: EMI, Principal)
- `moratorium_tenure` (Int)
- `treatment_of_interest` (Select: Capitalize, Add to first repayment)
- **Credit Limits** (for Line of Credit):
  - `limit_applicable_start` (Date)
  - `limit_applicable_end` (Date)
  - `maximum_limit_amount` (Currency)
  - `utilized_limit_amount` (Currency)
  - `available_limit_amount` (Currency)
- **Loan Classification**:
  - `days_past_due` (Int)
  - `classification_code` (Link to Loan Classification)
  - `classification_name` (Data)
  - `is_npa` (Check)
  - `manual_npa` (Check)
  - `unmark_npa` (Check)
- **Restructure Info**:
  - `loan_restructure_count` (Int)
  - `watch_period_end_date` (Date)
  - `tenure_post_restructure` (Int)
- **Totals**:
  - `total_payment` (Currency)
  - `total_interest_payable` (Currency)
  - `total_principal_paid` (Currency)
  - `total_amount_paid` (Currency)
- **Adjustments**:
  - `written_off_amount` (Currency)
  - `debit_adjustment_amount` (Currency)
  - `credit_adjustment_amount` (Currency)
  - `refund_amount` (Currency)
  - `excess_amount_paid` (Currency)
- **Account Freeze**:
  - `freeze_account` (Check)
  - `freeze_date` (Date)
- **Co-Lending**:
  - `loan_partner` (Link to Loan Partner)
  - `fldg_triggered` (Check)
  - `fldg_trigger_date` (Date)
- **Accounting**:
  - `cost_center` (Link to Cost Center)
  - `disbursement_account`, `payment_account`, `loan_account`
  - `interest_income_account`, `penalty_income_account`
- `loan_charges` (Table: Loan Disbursement Charge)
- `cancellation_date`, `settlement_date`, `closure_date` (Dates)

**Relationships**:
- Many-to-One: → Loan Product, Loan Application, Loan Partner, Company
- One-to-Many: → Loan Disbursement, Loan Repayment, Loan Repayment Schedule, Loan Interest Accrual, Loan Demand, Loan Security Assignment, Loan Restructure, Loan Write Off, Loan Refund, Loan Transfer, Loan Adjustment, Loan Balance Adjustment

---

### 4. **Loan Disbursement** (Transaction)
**Purpose**: Records actual money disbursed to the borrower.

**Key Fields**:
- `against_loan` (Link to Loan)
- `applicant_type`, `applicant`
- `company`
- `disbursement_date` (Date)
- `disbursed_amount` (Currency)
- `disbursement_account` (Link to Account)
- `loan_account` (Link to Account)
- `status` (Select)
- `loan_disbursement_charges` (Table: Loan Disbursement Charge)

**Relationships**:
- Many-to-One: → Loan
- One-to-Many: → Loan Disbursement Charge

---

### 5. **Loan Repayment** (Transaction)
**Purpose**: Records repayments made by the borrower.

**Key Fields**:
- `against_loan` (Link to Loan)
- `applicant_type`, `applicant`
- `company`
- `posting_date` (Datetime)
- `value_date` (Date)
- `repayment_type` (Select: Normal Repayment, Interest Waiver, Penalty Waiver, Loan Closure, Full Settlement, Write Off Settlement)
- `amount_paid` (Currency)
- `principal_amount_paid` (Currency)
- `interest_payable` (Currency)
- `penalty_amount` (Currency)
- `payable_amount` (Currency)
- `payable_principal_amount` (Currency)
- `pending_principal_amount` (Currency)
- `excess_amount` (Currency)
- `repayment_details` (Table: Loan Repayment Detail)
- `payable_charges` (Table: Loan Repayment Charges)
- `prepayment_charges` (Table: Prepayment Charges)
- `mode_of_payment` (Link)
- `bank_account` (Link)
- `clearance_date` (Date)
- `reference_number` (Data)
- `days_past_due` (Int)
- `is_npa` (Check)
- `is_backdated` (Check)
- `loan_disbursement` (Link) - for partial disbursements
- `loan_restructure` (Link)
- `loan_adjustment` (Link)
- `bulk_repayment_log` (Link)

**Relationships**:
- Many-to-One: → Loan, Loan Disbursement, Loan Restructure, Loan Adjustment
- One-to-Many: → Loan Repayment Detail, Loan Repayment Charges, Prepayment Charges

---

### 6. **Loan Repayment Schedule** (Transaction)
**Purpose**: Pre-calculated schedule of repayments for term loans.

**Key Fields**:
- `against_loan` (Link to Loan)
- `payment_date` (Date)
- `principal_amount` (Currency)
- `interest_amount` (Currency)
- `total_payment` (Currency)
- `balance_loan_amount` (Currency)
- `status` (Select: Pending, Partially Paid, Completed, Initiated)
- `loan_restructure` (Link)

**Relationships**:
- Many-to-One: → Loan, Loan Restructure

---

### 7. **Loan Interest Accrual** (Transaction)
**Purpose**: Records daily interest accrual for loans.

**Key Fields**:
- `against_loan` (Link to Loan)
- `posting_date` (Date)
- `accrual_type` (Select: Regular, Additional, Broken Period Interest)
- `interest_amount` (Currency)
- `penalty_amount` (Currency)
- `process_loan_interest_accrual` (Link)

**Relationships**:
- Many-to-One: → Loan, Process Loan Interest Accrual

---

### 8. **Loan Demand** (Transaction)
**Purpose**: Records demands/bills generated for loan repayments.

**Key Fields**:
- `against_loan` (Link to Loan)
- `applicant_type`, `applicant`
- `demand_date` (Date)
- `posting_date` (Date)
- `due_date` (Date)
- `principal_amount` (Currency)
- `interest_amount` (Currency)
- `penalty_amount` (Currency)
- `total_demand_amount` (Currency)
- `status` (Select: Unpaid, Partially Paid, Paid, Waived)
- `loan_demand_offset_details` (Table: Loan Demand Offset Detail)

**Relationships**:
- Many-to-One: → Loan
- One-to-Many: → Loan Demand Offset Detail

---

### 9. **Loan Security** (Master Data)
**Purpose**: Defines security/collateral types and details.

**Key Fields**:
- `loan_security_type` (Link to Loan Security Type)
- `applicant_type`, `applicant`
- `uom` (Unit of Measure)
- `haircut` (Percent)
- `loan_security_prices` (Table: Loan Security Price)

**Relationships**:
- Many-to-One: → Loan Security Type
- One-to-Many: → Loan Security Price, Pledge

---

### 10. **Loan Security Assignment** (Transaction)
**Purpose**: Assigns securities to loans (pledging process).

**Key Fields**:
- `loan` (Link to Loan)
- `loan_application` (Link to Loan Application)
- `applicant_type`, `applicant`
- `company`
- `pledge_time` (Datetime)
- `release_time` (Datetime)
- `status` (Select: Pledge Requested, Unpledged, Pledged, Release Requested, Released, Repossessed, Cancelled)
- `securities` (Table: Pledge)
- `total_security_value` (Currency)
- `maximum_loan_value` (Currency)

**Relationships**:
- Many-to-One: → Loan, Loan Application
- One-to-Many: → Pledge

---

### 11. **Loan Restructure** (Transaction)
**Purpose**: Records loan restructuring/modification.

**Key Fields**:
- `loan` (Link to Loan)
- `restructure_type` (Select: Normal Restructure, Settlement Restructure)
- `restructure_date` (Date)
- `pending_principal_amount` (Currency)
- `total_overdue_amount` (Currency)
- `principal_overdue` (Currency)
- `interest_overdue` (Currency)
- `penalty_overdue` (Currency)
- `charges_overdue` (Currency)
- `unaccrued_interest` (Currency)
- `available_security_deposit` (Currency)
- `status` (Select)

**Relationships**:
- Many-to-One: → Loan
- One-to-Many: → Loan Repayment Schedule (new schedule)

---

### 12. **Loan Write Off** (Transaction)
**Purpose**: Records write-off of bad loans.

**Key Fields**:
- `loan` (Link to Loan)
- `posting_date` (Date)
- `value_date` (Date)
- `write_off_amount` (Currency)
- `is_settlement_write_off` (Check)

**Relationships**:
- Many-to-One: → Loan

---

### 13. **Loan Partner** (Master Data)
**Purpose**: Defines co-lending partners.

**Key Fields**:
- `partner_name`
- `company`
- `share_percentage` (Percent)
- `interest_rate` (Percent)
- `loan_partner_addresses` (Table: Loan Partner Address)
- `loan_partner_shareables` (Table: Loan Partner Shareable)

**Relationships**:
- Many-to-Many: → Loan Product (via Loan Product Loan Partner)
- One-to-Many: → Loan

---

### 14. **Loan Category** (Master Data)
**Purpose**: Categorizes loans.

**Key Fields**:
- `category_name`
- `description`

**Relationships**:
- One-to-Many: → Loan Product, Loan

---

### 15. **Loan Classification** (Master Data)
**Purpose**: Defines asset classification codes (Standard, Sub-standard, Doubtful, Loss).

**Key Fields**:
- `classification_code`
- `classification_name`
- `days_past_due_from` (Int)
- `days_past_due_to` (Int)

**Relationships**:
- One-to-Many: → Loan

---

## Supporting Entities

### Process Doctypes (Batch Processing)
- **Process Loan Interest Accrual**: Daily batch processing for interest accrual
- **Process Loan Demand**: Daily batch processing for demand generation
- **Process Loan Classification**: Daily batch processing for loan classification
- **Process Loan Security Shortfall**: Daily batch processing for security shortfall
- **Process Loan Restructure Limit**: Monthly batch processing for restructure limits

### Log/History Doctypes
- **Days Past Due Log**: Tracks changes in days past due
- **Loan NPA Log**: Tracks NPA status changes
- **Loan Freeze Log**: Tracks account freeze events
- **Loan Limit Change Log**: Tracks credit limit changes
- **Loan Restructure Limit Log**: Tracks restructure limit changes
- **Bulk Repayment Log**: Tracks bulk repayment operations

### Adjustment Doctypes
- **Loan Adjustment**: Adjustments to loan amounts
- **Loan Balance Adjustment**: Balance adjustments
- **Loan Accrual Repost**: Reposting of interest accruals
- **Loan Repayment Repost**: Reposting of repayments

### Other Entities
- **Loan Transfer**: Transfer loans between entities
- **Loan Refund**: Refunds to borrowers
- **Loan Security Deposit**: Security deposits
- **Loan Security Release**: Release of securities
- **Loan Security Shortfall**: Shortfall in security coverage
- **Sanctioned Loan Amount**: Sanctioned amounts
- **Co Lender Schedule**: Co-lending schedules

## Entity Relationship Diagram (Simplified)

```
Loan Product (1) ──→ (N) Loan Application
                        │
                        ↓ (when approved)
Loan Product (1) ──→ (N) Loan
                        │
                        ├──→ (N) Loan Disbursement
                        ├──→ (N) Loan Repayment
                        ├──→ (N) Loan Repayment Schedule
                        ├──→ (N) Loan Interest Accrual
                        ├──→ (N) Loan Demand
                        ├──→ (N) Loan Security Assignment
                        ├──→ (N) Loan Restructure
                        ├──→ (N) Loan Write Off
                        └──→ (N) Loan Refund

Loan Security (1) ──→ (N) Pledge ──→ (N) Loan Security Assignment

Loan Partner (1) ──→ (N) Loan (via loan_partner field)

Loan Category (1) ──→ (N) Loan Product
                  └──→ (N) Loan

Loan Classification (1) ──→ (N) Loan
```

## Key Relationships Summary

1. **Loan Product → Loan**: One product can have many loans
2. **Loan Application → Loan**: One application creates one loan (when approved)
3. **Loan → Loan Disbursement**: One loan can have multiple disbursements (partial)
4. **Loan → Loan Repayment**: One loan has many repayments
5. **Loan → Loan Repayment Schedule**: One loan has one schedule (for term loans)
6. **Loan → Loan Interest Accrual**: One loan has many accrual entries (daily)
7. **Loan → Loan Demand**: One loan has many demands (periodic bills)
8. **Loan → Loan Security Assignment**: One loan can have multiple security assignments
9. **Loan Security → Pledge**: One security can be pledged multiple times
10. **Loan → Loan Restructure**: One loan can be restructured multiple times

## Status Workflows

### Loan Status Flow:
```
Draft → Sanctioned → Partially Disbursed → Disbursed → Active 
  → Loan Closure Requested → Closed/Written Off/Settled
```

### Loan Application Status Flow:
```
Open → Approved/Rejected
```

### Loan Security Assignment Status Flow:
```
Pledge Requested → Pledged → Release Requested → Released
```

## Notes

- All monetary fields use Currency type with company currency
- Dates are critical for calculations (accrual, demand, repayment schedules)
- The system supports both term loans and line of credit (LOC) loans
- Co-lending is supported through Loan Partner relationships
- NPA (Non-Performing Asset) tracking is built-in
- The system maintains audit trails for financial transactions
- Accounting integration is through GL entries (via ERPNext)

