# Frappe Lending - Database Schema Reference

## Overview
This document provides detailed information about the database schema for Frappe Lending, including table structures, indexes, constraints, and relationships.

---

## Database Architecture

### Framework: Frappe Framework
- **Database Engine**: MariaDB/MySQL (InnoDB)
- **ORM**: Frappe's built-in ORM
- **Schema Generation**: Automatic from DocType JSON definitions
- **Table Naming**: `tab{Doctype Name}` (e.g., `tabLoan`, `tabLoan Application`)

---

## Core Tables

### 1. `tabLoan` (Loan)

**Table Name**: `tabLoan`

**Primary Key**: `name` (VARCHAR)

**Auto-naming**: `ACC-LOAN-.YYYY.-.#####` (e.g., ACC-LOAN-2024-00001)

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `creation` | DATETIME | NOT NULL | Yes | Creation timestamp |
| `modified` | DATETIME | NOT NULL | Yes | Last modified |
| `modified_by` | VARCHAR(140) | | | Last modifier |
| `owner` | VARCHAR(140) | | | Document owner |
| `docstatus` | TINYINT | DEFAULT 0 | | Document status (0=Draft, 1=Submitted, 2=Cancelled) |
| `idx` | INT | | | Index for sorting |
| `applicant_type` | VARCHAR(140) | NOT NULL | Yes | Employee/Member/Customer |
| `applicant` | VARCHAR(140) | NOT NULL | Yes | Applicant reference |
| `applicant_name` | VARCHAR(140) | | | Applicant name |
| `loan_application` | VARCHAR(140) | | | Source application |
| `company` | VARCHAR(140) | NOT NULL | Yes | Company |
| `posting_date` | DATE | NOT NULL | Yes | Posting date |
| `status` | VARCHAR(140) | | Yes | Loan status |
| `loan_product` | VARCHAR(140) | NOT NULL | Yes | Loan product |
| `loan_amount` | DECIMAL(18,2) | | | Loan amount |
| `disbursed_amount` | DECIMAL(18,2) | | | Disbursed amount |
| `disbursement_date` | DATE | | | First disbursement date |
| `rate_of_interest` | DECIMAL(18,2) | NOT NULL | | Interest rate |
| `penalty_charges_rate` | DECIMAL(18,2) | | | Penalty rate |
| `is_term_loan` | TINYINT(1) | DEFAULT 0 | | Is term loan |
| `is_secured_loan` | TINYINT(1) | DEFAULT 0 | | Is secured loan |
| `repayment_schedule_type` | VARCHAR(140) | | | Schedule type |
| `repayment_method` | VARCHAR(140) | | | Repayment method |
| `repayment_periods` | INT | | | Number of periods |
| `monthly_repayment_amount` | DECIMAL(18,2) | | | Monthly EMI |
| `repayment_start_date` | DATE | | | First repayment date |
| `repayment_frequency` | VARCHAR(140) | | | Frequency |
| `moratorium_type` | VARCHAR(140) | | | Moratorium type |
| `moratorium_tenure` | INT | | | Moratorium months |
| `treatment_of_interest` | VARCHAR(140) | | | Interest treatment |
| `maximum_limit_amount` | DECIMAL(18,2) | | | Max limit (LOC) |
| `utilized_limit_amount` | DECIMAL(18,2) | | | Utilized limit |
| `available_limit_amount` | DECIMAL(18,2) | | | Available limit |
| `limit_applicable_start` | DATE | | | Limit start date |
| `limit_applicable_end` | DATE | | | Limit end date |
| `days_past_due` | INT | | | Days past due |
| `classification_code` | VARCHAR(140) | | | Asset classification |
| `classification_name` | VARCHAR(140) | | | Classification name |
| `is_npa` | TINYINT(1) | DEFAULT 0 | | Is NPA |
| `manual_npa` | TINYINT(1) | DEFAULT 0 | | Manual NPA |
| `unmark_npa` | TINYINT(1) | DEFAULT 0 | | Unmark NPA |
| `loan_restructure_count` | INT | | | Restructure count |
| `watch_period_end_date` | DATE | | | Watch period end |
| `tenure_post_restructure` | INT | | | Tenure after restructure |
| `total_payment` | DECIMAL(18,2) | | | Total payable |
| `total_interest_payable` | DECIMAL(18,2) | | | Total interest |
| `total_principal_paid` | DECIMAL(18,2) | | | Principal paid |
| `total_amount_paid` | DECIMAL(18,2) | | | Total paid |
| `written_off_amount` | DECIMAL(18,2) | | | Written off |
| `debit_adjustment_amount` | DECIMAL(18,2) | | | Debit adjustments |
| `credit_adjustment_amount` | DECIMAL(18,2) | | | Credit adjustments |
| `refund_amount` | DECIMAL(18,2) | | | Refund amount |
| `excess_amount_paid` | DECIMAL(18,2) | | | Excess paid |
| `freeze_account` | TINYINT(1) | DEFAULT 0 | | Freeze flag |
| `freeze_date` | DATE | | | Freeze date |
| `loan_partner` | VARCHAR(140) | | | Co-lending partner |
| `fldg_triggered` | TINYINT(1) | DEFAULT 0 | | FLDG triggered |
| `fldg_trigger_date` | DATE | | | FLDG date |
| `cost_center` | VARCHAR(140) | | | Cost center |
| `disbursement_account` | VARCHAR(140) | NOT NULL | | Disbursement account |
| `payment_account` | VARCHAR(140) | NOT NULL | | Payment account |
| `loan_account` | VARCHAR(140) | NOT NULL | | Loan account |
| `interest_income_account` | VARCHAR(140) | NOT NULL | | Interest account |
| `penalty_income_account` | VARCHAR(140) | NOT NULL | | Penalty account |
| `cancellation_date` | DATE | | | Cancellation date |
| `settlement_date` | DATE | | | Settlement date |
| `closure_date` | DATE | | | Closure date |
| `amended_from` | VARCHAR(140) | | | Amended from |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `applicant_type`, `applicant` (search_index)
- INDEX on `company` (standard filter)
- INDEX on `loan_product` (standard filter)
- INDEX on `status` (standard filter)
- INDEX on `posting_date` (search_fields)
- INDEX on `creation` (sort_field)

**Foreign Keys** (Logical, not enforced):
- `loan_product` → `tabLoan Product.name`
- `company` → `tabCompany.name`
- `applicant` → Dynamic (based on `applicant_type`)
- `loan_application` → `tabLoan Application.name`
- `loan_partner` → `tabLoan Partner.name`
- `classification_code` → `tabLoan Classification.name`
- `cost_center` → `tabCost Center.name`
- All account fields → `tabAccount.name`

**Constraints**:
- `docstatus` must be 0, 1, or 2
- `status` must be one of defined values
- `loan_amount` >= 0 (non_negative)
- `rate_of_interest` >= 0
- `applicant_type` must match applicant doctype

---

### 2. `tabLoan Product` (Loan Product)

**Table Name**: `tabLoan Product`

**Primary Key**: `name` (VARCHAR)

**Auto-naming**: `field:product_code` (unique)

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `product_code` | VARCHAR(140) | UNIQUE, NOT NULL | Yes | Product code |
| `product_name` | VARCHAR(140) | UNIQUE, NOT NULL | Yes | Product name |
| `company` | VARCHAR(140) | NOT NULL | Yes | Company |
| `rate_of_interest` | DECIMAL(18,2) | NOT NULL | | Interest rate |
| `penalty_interest_rate` | DECIMAL(18,2) | | | Penalty rate |
| `is_term_loan` | TINYINT(1) | DEFAULT 0 | | Is term loan |
| `repayment_schedule_type` | VARCHAR(140) | | | Schedule type |
| `cyclic_day_of_the_month` | INT | | | Cyclic day |
| `repayment_date_on` | VARCHAR(140) | | | Repayment date position |
| `maximum_loan_amount` | DECIMAL(18,2) | | | Max loan amount |
| `days_past_due_threshold_for_npa` | INT | | | NPA threshold |
| `min_days_bw_disbursement_first_repayment` | INT | NOT NULL | | Min days gap |
| `grace_period_in_days` | INT | | | Grace period |
| `write_off_amount` | DECIMAL(18,2) | | | Auto write-off limit |
| `excess_amount_acceptance_limit` | DECIMAL(10,2) | | | Excess tolerance |
| `disabled` | TINYINT(1) | DEFAULT 0 | | Disabled flag |
| `loan_category` | VARCHAR(140) | | | Loan category |
| `bpi_recovery_method` | VARCHAR(140) | | | BPI recovery method |
| `validate_normal_repayment` | TINYINT(1) | DEFAULT 0 | | Validate repayment |
| `disbursement_account` | VARCHAR(140) | NOT NULL | | Disbursement account |
| `payment_account` | VARCHAR(140) | NOT NULL | | Payment account |
| `loan_account` | VARCHAR(140) | NOT NULL | | Loan account |
| `interest_income_account` | VARCHAR(140) | NOT NULL | | Interest account |
| `penalty_income_account` | VARCHAR(140) | NOT NULL | | Penalty account |
| `interest_accrued_account` | VARCHAR(140) | NOT NULL | | Accrued interest |
| `interest_receivable_account` | VARCHAR(140) | NOT NULL | | Interest receivable |
| `interest_waiver_account` | VARCHAR(140) | NOT NULL | | Interest waiver |
| `penalty_accrued_account` | VARCHAR(140) | NOT NULL | | Accrued penalty |
| `penalty_receivable_account` | VARCHAR(140) | NOT NULL | | Penalty receivable |
| `penalty_waiver_account` | VARCHAR(140) | NOT NULL | | Penalty waiver |
| `security_deposit_account` | VARCHAR(140) | NOT NULL | | Security deposit |
| `customer_refund_account` | VARCHAR(140) | NOT NULL | | Refund account |
| `write_off_account` | VARCHAR(140) | NOT NULL | | Write-off account |
| `write_off_recovery_account` | VARCHAR(140) | NOT NULL | | Recovery account |
| `collection_offset_sequence_for_standard_asset` | VARCHAR(140) | | | Standard asset sequence |
| `collection_offset_sequence_for_sub_standard_asset` | VARCHAR(140) | | | Sub-standard sequence |
| `collection_offset_sequence_for_written_off_asset` | VARCHAR(140) | | | Written-off sequence |
| `collection_offset_sequence_for_settlement_collection` | VARCHAR(140) | | | Settlement sequence |

**Indexes**:
- PRIMARY KEY (`name`)
- UNIQUE INDEX on `product_code`
- UNIQUE INDEX on `product_name`
- INDEX on `company` (standard filter)
- INDEX on `modified` (sort_field)

**Child Tables**:
- `tabLoan Charges` (via `loan_charges` field)
- `tabLoan Product Loan Partner` (via `loan_partners` field)

---

### 3. `tabLoan Application` (Loan Application)

**Table Name**: `tabLoan Application`

**Primary Key**: `name` (VARCHAR)

**Auto-naming**: `ACC-LOAP-.YYYY.-.#####`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `applicant_type` | VARCHAR(140) | NOT NULL | Yes | Employee/Customer |
| `applicant` | VARCHAR(140) | | Yes | Applicant reference |
| `company` | VARCHAR(140) | NOT NULL | Yes | Company |
| `posting_date` | DATE | NOT NULL | | Application date |
| `status` | VARCHAR(140) | | | Status (Open/Approved/Rejected) |
| `loan_product` | VARCHAR(140) | NOT NULL | Yes | Loan product |
| `loan_amount` | DECIMAL(18,2) | | | Loan amount |
| `is_term_loan` | TINYINT(1) | DEFAULT 0 | | Is term loan |
| `is_secured_loan` | TINYINT(1) | DEFAULT 0 | | Is secured loan |
| `rate_of_interest` | DECIMAL(18,2) | | | Interest rate |
| `repayment_method` | VARCHAR(140) | | | Repayment method |
| `repayment_periods` | INT | | | Repayment periods |
| `repayment_amount` | DECIMAL(18,2) | | | Monthly amount |
| `total_payable_amount` | DECIMAL(18,2) | | | Total payable |
| `total_payable_interest` | DECIMAL(18,2) | | | Total interest |
| `maximum_loan_amount` | DECIMAL(18,2) | | | Max from securities |
| `first_name` | VARCHAR(140) | | | First name (Customer) |
| `last_name` | VARCHAR(140) | | | Last name (Customer) |
| `applicant_email_address` | VARCHAR(140) | | | Email (Customer) |
| `applicant_phone_number` | VARCHAR(140) | | | Phone (Customer) |
| `address_line_1` | VARCHAR(140) | | | Address line 1 |
| `address_line_2` | VARCHAR(140) | | | Address line 2 |
| `city` | VARCHAR(140) | | | City |
| `state` | VARCHAR(140) | | | State |
| `zip_code` | INT | | | ZIP code |
| `country` | VARCHAR(140) | | | Country |
| `description` | TEXT | | | Reason/description |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `applicant_type`, `applicant` (global_search, standard_filter)
- INDEX on `loan_product` (list_view, standard_filter)
- INDEX on `loan_amount` (list_view)
- INDEX on `company` (list_view, standard_filter)
- INDEX on `modified` (sort_field)

**Child Tables**:
- `tabProposed Pledge` (via `proposed_pledges` field)
- `tabLoan Application Document` (via `documents` field)

---

### 4. `tabLoan Disbursement` (Loan Disbursement)

**Table Name**: `tabLoan Disbursement`

**Primary Key**: `name` (VARCHAR)

**Auto-naming**: `LM-DIS-.#####`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `against_loan` | VARCHAR(140) | NOT NULL | Yes | Loan reference |
| `applicant_type` | VARCHAR(140) | | | Applicant type |
| `applicant` | VARCHAR(140) | | | Applicant |
| `company` | VARCHAR(140) | | | Company |
| `disbursement_date` | DATE | NOT NULL | Yes | Disbursement date |
| `disbursed_amount` | DECIMAL(18,2) | NOT NULL | | Amount disbursed |
| `sanctioned_loan_amount` | DECIMAL(18,2) | | | Sanctioned amount |
| `current_disbursed_amount` | DECIMAL(18,2) | | | Current disbursed |
| `posting_date` | DATE | | | Posting date |
| `broken_period_interest` | DECIMAL(18,2) | | | BPI amount |
| `broken_period_interest_days` | INT | | | BPI days |
| `bpi_amount_difference` | DECIMAL(18,2) | | | BPI difference |
| `bpi_difference_date` | DATE | | | BPI difference date |
| `principal_amount_paid` | DECIMAL(18,2) | | | Principal paid |
| `status` | VARCHAR(140) | | | Disbursement status |
| `mode_of_payment` | VARCHAR(140) | | | Payment mode |
| `disbursement_account` | VARCHAR(140) | NOT NULL | | Disbursement account |
| `loan_account` | VARCHAR(140) | NOT NULL | | Loan account |
| `refund_account` | VARCHAR(140) | | | Refund account |
| `bank_account` | VARCHAR(140) | | | Bank account |
| `cost_center` | VARCHAR(140) | | | Cost center |
| `reference_date` | DATE | | | Reference date |
| `reference_number` | VARCHAR(140) | | | Reference number |
| `clearance_date` | DATE | | | Bank clearance date |
| `days_past_due` | INT | | | Days past due |
| `withhold_security_deposit` | TINYINT(1) | DEFAULT 0 | | Withhold deposit |
| `repayment_start_date` | DATE | | | Repayment start |
| `repayment_frequency` | VARCHAR(140) | | | Frequency |
| `repayment_method` | VARCHAR(140) | | | Method |
| `tenure` | INT | | | Tenure |
| `is_term_loan` | TINYINT(1) | | | Is term loan |
| `repayment_schedule_type` | VARCHAR(140) | | | Schedule type |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `against_loan` (list_view, standard_filter, search_index)
- INDEX on `disbursement_date` (list_view, search_index)
- INDEX on `company` (standard_filter)

**Child Tables**:
- `tabLoan Disbursement Charge` (via `loan_disbursement_charges` field)

---

### 5. `tabLoan Repayment` (Loan Repayment)

**Table Name**: `tabLoan Repayment`

**Primary Key**: `name` (VARCHAR)

**Auto-naming**: `LM-REP-.####`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `against_loan` | VARCHAR(140) | NOT NULL | Yes | Loan reference |
| `applicant_type` | VARCHAR(140) | | | Applicant type |
| `applicant` | VARCHAR(140) | | | Applicant |
| `company` | VARCHAR(140) | | | Company |
| `posting_date` | DATETIME | NOT NULL | Yes | Posting datetime |
| `value_date` | DATETIME | NOT NULL | | Value date |
| `repayment_type` | VARCHAR(140) | | | Repayment type |
| `amount_paid` | DECIMAL(18,2) | NOT NULL | | Amount paid |
| `principal_amount_paid` | DECIMAL(18,2) | | | Principal paid |
| `interest_payable` | DECIMAL(18,2) | | | Interest payable |
| `total_interest_paid` | DECIMAL(18,2) | | | Interest paid |
| `penalty_amount` | DECIMAL(18,2) | | | Penalty amount |
| `total_penalty_paid` | DECIMAL(18,2) | | | Penalty paid |
| `payable_amount` | DECIMAL(18,2) | | | Total payable |
| `payable_principal_amount` | DECIMAL(18,2) | | | Principal payable |
| `pending_principal_amount` | DECIMAL(18,2) | | | Pending principal |
| `excess_amount` | DECIMAL(18,2) | | | Excess amount |
| `shortfall_amount` | DECIMAL(18,2) | | | Shortfall amount |
| `total_charges_payable` | DECIMAL(18,2) | | | Charges payable |
| `total_charges_paid` | DECIMAL(18,2) | | | Charges paid |
| `unbooked_interest_paid` | DECIMAL(18,2) | | | Unbooked interest |
| `unbooked_penalty_paid` | DECIMAL(18,2) | | | Unbooked penalty |
| `due_date` | DATE | | | Due date |
| `days_past_due` | INT | | | Days past due |
| `is_npa` | TINYINT(1) | | | Is NPA |
| `is_backdated` | TINYINT(1) | | | Is backdated |
| `is_write_off_waiver` | TINYINT(1) | | | Write-off waiver |
| `mode_of_payment` | VARCHAR(140) | | | Payment mode |
| `bank_account` | VARCHAR(140) | | | Bank account |
| `payment_account` | VARCHAR(140) | NOT NULL | | Payment account |
| `loan_account` | VARCHAR(140) | NOT NULL | | Loan account |
| `penalty_income_account` | VARCHAR(140) | NOT NULL | | Penalty account |
| `cost_center` | VARCHAR(140) | | | Cost center |
| `loan_disbursement` | VARCHAR(140) | | | Specific disbursement |
| `loan_restructure` | VARCHAR(140) | | | Related restructure |
| `loan_adjustment` | VARCHAR(140) | | | Related adjustment |
| `bulk_repayment_log` | VARCHAR(140) | | | Bulk operation |
| `reference_date` | DATE | | | Reference date |
| `reference_number` | VARCHAR(140) | | | Reference number |
| `clearance_date` | DATE | | | Bank clearance |
| `manual_remarks` | TEXT | | | Manual remarks |
| `loan_partner` | VARCHAR(140) | | | Co-lending partner |
| `loan_partner_share_percentage` | DECIMAL(18,2) | | | Partner share % |
| `loan_partner_interest_rate` | DECIMAL(18,2) | | | Partner rate |
| `loan_partner_payment_ratio` | DECIMAL(18,2) | | | Payment ratio |
| `total_partner_interest_share` | DECIMAL(18,2) | | | Partner interest |
| `total_partner_principal_share` | DECIMAL(18,2) | | | Partner principal |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `against_loan` (list_view, standard_filter, search_index)
- INDEX on `posting_date` (list_view)
- INDEX on `company` (standard_filter)

**Child Tables**:
- `tabLoan Repayment Detail` (via `repayment_details` field)
- `tabLoan Repayment Charges` (via `payable_charges` field)
- `tabPrepayment Charges` (via `prepayment_charges` field)

---

### 6. `tabLoan Repayment Schedule` (Loan Repayment Schedule)

**Table Name**: `tabLoan Repayment Schedule`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `against_loan` | VARCHAR(140) | NOT NULL | Yes | Loan reference |
| `payment_date` | DATE | NOT NULL | Yes | Payment date |
| `principal_amount` | DECIMAL(18,2) | | | Principal amount |
| `interest_amount` | DECIMAL(18,2) | | | Interest amount |
| `total_payment` | DECIMAL(18,2) | | | Total payment |
| `balance_loan_amount` | DECIMAL(18,2) | | | Outstanding balance |
| `status` | VARCHAR(140) | | | Status |
| `loan_restructure` | VARCHAR(140) | | | Related restructure |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `against_loan`
- INDEX on `payment_date`

---

### 7. `tabLoan Interest Accrual` (Loan Interest Accrual)

**Table Name**: `tabLoan Interest Accrual`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `against_loan` | VARCHAR(140) | NOT NULL | Yes | Loan reference |
| `posting_date` | DATE | NOT NULL | Yes | Accrual date |
| `accrual_type` | VARCHAR(140) | | | Regular/Additional/BPI |
| `interest_amount` | DECIMAL(18,2) | | | Interest amount |
| `penalty_amount` | DECIMAL(18,2) | | | Penalty amount |
| `process_loan_interest_accrual` | VARCHAR(140) | | | Batch process |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `against_loan`
- INDEX on `posting_date`

---

### 8. `tabLoan Demand` (Loan Demand)

**Table Name**: `tabLoan Demand`

**Auto-naming**: `LM-LD-.#####`

**Key Columns**:

| Column | Type | Constraints | Index | Description |
|--------|------|-------------|-------|-------------|
| `name` | VARCHAR(140) | PRIMARY KEY | Yes | Document name |
| `against_loan` | VARCHAR(140) | NOT NULL | Yes | Loan reference |
| `applicant_type` | VARCHAR(140) | | | Applicant type |
| `applicant` | VARCHAR(140) | | | Applicant |
| `company` | VARCHAR(140) | | | Company |
| `demand_date` | DATE | NOT NULL | Yes | Demand date |
| `posting_date` | DATE | | | Posting date |
| `due_date` | DATE | | | Due date |
| `loan` | VARCHAR(140) | NOT NULL | | Loan reference |
| `loan_repayment_schedule` | VARCHAR(140) | | | Schedule reference |
| `loan_disbursement` | VARCHAR(140) | | | Disbursement reference |
| `repayment_schedule_detail` | VARCHAR(140) | | | Schedule detail |
| `demand_type` | VARCHAR(140) | | | Demand type |
| `demand_subtype` | VARCHAR(140) | | | Demand subtype |
| `demand_amount` | DECIMAL(18,2) | | | Total demand |
| `paid_amount` | DECIMAL(18,2) | | | Paid amount |
| `waived_amount` | DECIMAL(18,2) | | | Waived amount |
| `outstanding_amount` | DECIMAL(18,2) | | | Outstanding |
| `status` | VARCHAR(140) | | | Status |
| `cost_center` | VARCHAR(140) | | | Cost center |
| `loan_partner` | VARCHAR(140) | | | Co-lending partner |
| `partner_share_allocated` | DECIMAL(18,2) | | | Partner share |
| `partner_share` | DECIMAL(18,2) | | | Partner share amount |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `against_loan`
- INDEX on `demand_date`
- INDEX on `due_date`

**Child Tables**:
- `tabLoan Demand Offset Detail` (via `loan_demand_offset_details` field)

---

## Child Tables (Table Fields)

### Child Table Structure

All child tables follow the pattern: `tab{Parent Doctype} {Child Doctype}`

**Common Columns in Child Tables**:
- `name` (VARCHAR) - Auto-generated name
- `parent` (VARCHAR) - Parent document name
- `parenttype` (VARCHAR) - Parent doctype
- `parentfield` (VARCHAR) - Parent field name
- `idx` (INT) - Row index
- `creation` (DATETIME)
- `modified` (DATETIME)
- `owner` (VARCHAR)
- `modified_by` (VARCHAR)
- `docstatus` (TINYINT)

### Example: `tabLoan Loan Disbursement Charge`

**Parent**: `tabLoan`
**Field**: `loan_charges`

**Key Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `name` | VARCHAR(140) | Row name |
| `parent` | VARCHAR(140) | Loan name |
| `parenttype` | VARCHAR(140) | "Loan" |
| `parentfield` | VARCHAR(140) | "loan_charges" |
| `charge` | VARCHAR(140) | Charge type |
| `account` | VARCHAR(140) | Charge account |
| `amount` | DECIMAL(18,2) | Charge amount |

**Indexes**:
- PRIMARY KEY (`name`)
- INDEX on `parent`

---

## Database Relationships

### Foreign Key Relationships (Logical)

Frappe uses logical foreign keys (not database-enforced):

1. **Loan → Loan Product**
   - `tabLoan.loan_product` → `tabLoan Product.name`

2. **Loan → Loan Application**
   - `tabLoan.loan_application` → `tabLoan Application.name`

3. **Loan Disbursement → Loan**
   - `tabLoan Disbursement.against_loan` → `tabLoan.name`

4. **Loan Repayment → Loan**
   - `tabLoan Repayment.against_loan` → `tabLoan.name`

5. **Loan Repayment Schedule → Loan**
   - `tabLoan Repayment Schedule.against_loan` → `tabLoan.name`

6. **Loan Interest Accrual → Loan**
   - `tabLoan Interest Accrual.against_loan` → `tabLoan.name`

7. **Loan Demand → Loan**
   - `tabLoan Demand.against_loan` → `tabLoan.name`
   - `tabLoan Demand.loan` → `tabLoan.name`

8. **Loan Security Assignment → Loan**
   - `tabLoan Security Assignment.loan` → `tabLoan.name`

9. **Pledge → Loan Security**
   - `tabPledge.loan_security` → `tabLoan Security.name`

10. **All Child Tables → Parent**
    - `tab{Parent} {Child}.parent` → `tab{Parent}.name`

---

## Indexes and Performance

### Search Indexes

Fields marked with `search_index: 1` in JSON create indexes:
- `tabLoan.applicant_type`, `tabLoan.applicant`
- `tabLoan.company`
- `tabLoan.loan_product`
- `tabLoan.status`
- `tabLoan Disbursement.against_loan`
- `tabLoan Disbursement.disbursement_date`
- `tabLoan Repayment.against_loan`

### Standard Filter Indexes

Fields marked with `in_standard_filter: 1` are indexed for filtering:
- `tabLoan.company`
- `tabLoan.loan_product`
- `tabLoan.status`
- `tabLoan Application.applicant_type`, `tabLoan Application.applicant`

### List View Indexes

Fields marked with `in_list_view: 1` are optimized for list queries:
- `tabLoan.posting_date`
- `tabLoan.loan_product`
- `tabLoan Application.loan_product`
- `tabLoan Application.loan_amount`
- `tabLoan Application.company`

### Sort Indexes

Fields marked as `sort_field` are indexed:
- `tabLoan.creation` (DESC)
- `tabLoan Product.modified` (DESC)
- `tabLoan Application.modified` (DESC)

---

## Data Types Mapping

### Frappe Field Types → SQL Types

| Frappe Type | SQL Type | Notes |
|-------------|----------|-------|
| Data | VARCHAR(140) | Text field |
| Link | VARCHAR(140) | Reference to doctype |
| Dynamic Link | VARCHAR(140) | Dynamic reference |
| Int | INT | Integer |
| Float | DECIMAL(18,2) | Decimal number |
| Currency | DECIMAL(18,2) | Currency amount |
| Percent | DECIMAL(18,2) | Percentage |
| Date | DATE | Date only |
| Datetime | DATETIME | Date and time |
| Time | TIME | Time only |
| Text | TEXT | Long text |
| Small Text | TEXT | Medium text |
| Long Text | LONGTEXT | Very long text |
| Check | TINYINT(1) | Boolean (0 or 1) |
| Select | VARCHAR(140) | Selection |
| Table | Child Table | Separate table |
| Attach | TEXT | File path |
| Attach Image | TEXT | Image path |
| HTML | LONGTEXT | HTML content |
| Code | LONGTEXT | Code content |
| JSON | JSON | JSON data |

---

## Table Naming Conventions

### Main Tables
- Pattern: `tab{Doctype Name}`
- Spaces replaced with nothing
- Examples:
  - `Loan` → `tabLoan`
  - `Loan Application` → `tabLoan Application`
  - `Loan Product` → `tabLoan Product`

### Child Tables
- Pattern: `tab{Parent Doctype} {Child Doctype}`
- Examples:
  - `Loan Charges` (child of `Loan Product`) → `tabLoan Product Loan Charges`
  - `Loan Disbursement Charge` (child of `Loan`) → `tabLoan Loan Disbursement Charge`
  - `Proposed Pledge` (child of `Loan Application`) → `tabLoan Application Proposed Pledge`

---

## Constraints and Validations

### Database-Level Constraints

1. **Primary Key**: `name` column (always)
2. **Unique Constraints**: 
   - `tabLoan Product.product_code` (unique)
   - `tabLoan Product.product_name` (unique)
3. **NOT NULL Constraints**: Based on `reqd: 1` in JSON
4. **Default Values**: Based on `default` in JSON
5. **Check Constraints**: Via application logic (not DB-level)

### Application-Level Validations

All business validations are in Python code, not database constraints:
- Foreign key relationships
- Amount validations
- Date validations
- Status transitions
- Business rules

---

## Audit Trail

### Standard Audit Columns

All tables include:
- `creation` (DATETIME) - When created
- `modified` (DATETIME) - Last modified
- `modified_by` (VARCHAR) - Who modified
- `owner` (VARCHAR) - Who created
- `docstatus` (TINYINT) - Document status

### Change Tracking

Tables with `track_changes: 1` in JSON maintain version history:
- `tabVersion` table stores document versions
- Tracks all field changes
- Maintains complete audit trail

---

## Database Maintenance

### Index Maintenance
- Indexes are automatically created from DocType definitions
- Rebuild indexes: `bench --site {site} migrate`
- Analyze tables: `ANALYZE TABLE tabLoan;`

### Table Optimization
- Regular `OPTIMIZE TABLE` recommended for large tables
- `tabLoan Repayment` (high transaction volume)
- `tabLoan Interest Accrual` (daily entries)
- `tabLoan Demand` (periodic entries)

### Backup Considerations
- All tables use InnoDB engine (transactional)
- Point-in-time recovery supported
- Foreign key constraints are logical (not enforced)
- Child tables must be backed up with parent tables

---

## Query Examples

### Get Loan with Related Data
```sql
SELECT 
    l.name,
    l.applicant,
    l.loan_amount,
    l.disbursed_amount,
    lp.product_name,
    COUNT(ld.name) as disbursement_count,
    SUM(lr.amount_paid) as total_repayments
FROM `tabLoan` l
LEFT JOIN `tabLoan Product` lp ON l.loan_product = lp.name
LEFT JOIN `tabLoan Disbursement` ld ON ld.against_loan = l.name
LEFT JOIN `tabLoan Repayment` lr ON lr.against_loan = l.name
WHERE l.company = 'ABC Bank'
GROUP BY l.name;
```

### Get Outstanding Loans
```sql
SELECT 
    l.name,
    l.applicant,
    l.loan_amount,
    l.disbursed_amount,
    (l.disbursed_amount - COALESCE(SUM(lr.principal_amount_paid), 0)) as outstanding_principal
FROM `tabLoan` l
LEFT JOIN `tabLoan Repayment` lr ON lr.against_loan = l.name AND lr.docstatus = 1
WHERE l.status IN ('Disbursed', 'Active')
    AND l.docstatus = 1
GROUP BY l.name
HAVING outstanding_principal > 0;
```

### Get Daily Interest Accrual Summary
```sql
SELECT 
    DATE(posting_date) as accrual_date,
    COUNT(*) as loan_count,
    SUM(interest_amount) as total_interest,
    SUM(penalty_amount) as total_penalty
FROM `tabLoan Interest Accrual`
WHERE docstatus = 1
    AND posting_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(posting_date)
ORDER BY accrual_date DESC;
```

---

## Migration and Schema Changes

### Adding New Fields
1. Update DocType JSON file
2. Run migration: `bench --site {site} migrate`
3. Schema automatically updated

### Modifying Field Types
1. Update DocType JSON
2. Run migration (data conversion handled automatically)
3. Verify data integrity

### Adding Indexes
1. Add `search_index: 1` to field in JSON
2. Run migration
3. Index created automatically

---

This document provides comprehensive database schema information. For specific table structures, refer to the DocType JSON files in the codebase.

