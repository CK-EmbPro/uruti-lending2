# Frappe Lending - Field Reference Guide

## Overview
This document provides a comprehensive reference for all fields in the major Lending doctypes, including data types, constraints, dependencies, and usage.

---

## Loan Product Fields

### Basic Information
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `product_code` | Data | Yes | Unique product identifier | Unique, No spaces |
| `product_name` | Data | Yes | Product display name | Unique |
| `company` | Link (Company) | Yes | Company owning the product | Must exist |
| `loan_category` | Link (Loan Category) | No | Category classification | Optional |
| `disabled` | Check | No | Disable product | Default: 0 |

### Interest & Rates
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `rate_of_interest` | Percent | Yes | Annual interest rate | >= 0 |
| `penalty_interest_rate` | Percent | No | Penalty rate per annum | >= 0 |
| `grace_period_in_days` | Int | No | Days before penalty applies | >= 0 |

### Loan Configuration
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `is_term_loan` | Check | No | Is this a term loan? | Default: 0 |
| `maximum_loan_amount` | Currency | No | Maximum loan amount | >= 0 |
| `repayment_schedule_type` | Select | Conditional | Schedule type | Required if is_term_loan |
| `cyclic_day_of_the_month` | Int | Conditional | Day for cyclic schedules | 1-31, Required if schedule_type = "Monthly as per cycle date" |
| `repayment_date_on` | Select | Conditional | Date position | Required if schedule_type = "Pro-rated calendar months" |
| `min_days_bw_disbursement_first_repayment` | Int | Yes | Minimum days gap | >= 0 |
| `days_past_due_threshold_for_npa` | Int | No | DPD threshold for NPA | >= 0 |
| `write_off_amount` | Currency | No | Auto write-off limit | >= 0 |
| `excess_amount_acceptance_limit` | Float | No | Excess payment tolerance | 0-1 (percentage) |
| `validate_normal_repayment` | Check | No | Validate normal repayments | Default: 0 |
| `bpi_recovery_method` | Select | No | Broken period interest method | Options: Upfront Deduction, Amortized Over Tenure, Add to First EMI |

### Collection Offset Sequences
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collection_offset_sequence_for_standard_asset` | Link (Loan Demand Offset Order) | No | Offset sequence for standard assets |
| `collection_offset_sequence_for_sub_standard_asset` | Link (Loan Demand Offset Order) | No | Offset sequence for sub-standard assets |
| `collection_offset_sequence_for_written_off_asset` | Link (Loan Demand Offset Order) | No | Offset sequence for written-off assets |
| `collection_offset_sequence_for_settlement_collection` | Link (Loan Demand Offset Order) | No | Offset sequence for settlements |

### Account Configuration
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `disbursement_account` | Link (Account) | Yes | Account for disbursements |
| `payment_account` | Link (Account) | Yes | Account for repayments |
| `loan_account` | Link (Account) | Yes | Asset account for loan principal |
| `security_deposit_account` | Link (Account) | Yes | Liability account for security deposits |
| `suspense_collection_account` | Link (Account) | No | Suspense account for collections |
| `customer_refund_account` | Link (Account) | Yes | Account for customer refunds |
| `subsidy_adjustment_account` | Link (Account) | No | Account for subsidy adjustments |

### Interest Accounts
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `interest_income_account` | Link (Account) | Yes | Income account for interest |
| `interest_accrued_account` | Link (Account) | Yes | Liability for accrued interest |
| `interest_receivable_account` | Link (Account) | Yes | Asset for interest receivable |
| `interest_waiver_account` | Link (Account) | Yes | Expense for interest waivers |
| `suspense_interest_income` | Link (Account) | No | Suspense for interest income |
| `broken_period_interest_recovery_account` | Link (Account) | Yes | Account for BPI recovery |

### Additional Interest Accounts
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `same_as_regular_interest_accounts` | Check | No | Use same as regular accounts | Default: 0 |
| `additional_interest_income` | Link (Account) | Conditional | Additional interest income | Required if not same_as_regular |
| `additional_interest_accrued` | Link (Account) | Conditional | Additional interest accrued | Required if not same_as_regular |
| `additional_interest_receivable` | Link (Account) | Conditional | Additional interest receivable | Required if not same_as_regular |
| `additional_interest_suspense` | Link (Account) | Conditional | Additional interest suspense | Required if not same_as_regular |
| `additional_interest_waiver` | Link (Account) | Conditional | Additional interest waiver | Required if not same_as_regular |

### Penalty Accounts
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `penalty_income_account` | Link (Account) | Yes | Income account for penalties |
| `penalty_accrued_account` | Link (Account) | Yes | Liability for accrued penalties |
| `penalty_receivable_account` | Link (Account) | Yes | Asset for penalty receivable |
| `penalty_waiver_account` | Link (Account) | Yes | Expense for penalty waivers |
| `penalty_suspense_account` | Link (Account) | No | Suspense for penalties |

### Write Off Accounts
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `write_off_account` | Link (Account) | Yes | Expense account for write-offs |
| `write_off_recovery_account` | Link (Account) | Yes | Income account for recoveries |

### Charges & Partners
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_charges` | Table (Loan Charges) | No | Charge types and rates |
| `loan_partners` | Table (Loan Product Loan Partner) | No | Co-lending partners |

---

## Loan Application Fields

### Applicant Information
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `applicant_type` | Select | Yes | Type: Employee or Customer | Options: Employee, Customer |
| `applicant` | Dynamic Link | Conditional | Applicant reference | Required if Employee, Auto-created if Customer |
| `first_name` | Data | Conditional | First name | Required if Customer |
| `last_name` | Data | Conditional | Last name | Required if Customer |
| `applicant_email_address` | Data | Conditional | Email address | Required if Customer |
| `applicant_phone_number` | Phone | Conditional | Phone number | Required if Customer |

### Address Information (Customer Only)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address_line_1` | Data | No | Street address |
| `address_line_2` | Data | No | Additional address |
| `city` | Data | No | City |
| `state` | Data | No | State/Province |
| `zip_code` | Int | No | ZIP/Postal code |
| `country` | Link (Country) | No | Country |

### Loan Details
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `company` | Link (Company) | Yes | Company | Must match loan product |
| `posting_date` | Date | Yes | Application date | Default: Today |
| `loan_product` | Link (Loan Product) | Yes | Loan product | Must belong to company |
| `loan_amount` | Currency | Yes | Requested loan amount | > 0, <= max from product |
| `is_term_loan` | Check | No | Is term loan | Fetched from product, Read-only |
| `is_secured_loan` | Check | No | Is secured loan | Default: 0 |
| `rate_of_interest` | Percent | No | Interest rate | Fetched from product, Read-only |
| `description` | Small Text | No | Application reason | Optional |

### Repayment Information (Term Loans Only)
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `repayment_method` | Select | Conditional | Repayment method | Required if is_term_loan |
| `repayment_periods` | Int | Conditional | Number of periods | Required if method = "Repay Over Number of Periods" |
| `repayment_amount` | Currency | Conditional | Monthly amount | Required if method = "Repay Fixed Amount per Period" |
| `total_payable_amount` | Currency | No | Total payable | Calculated, Read-only |
| `total_payable_interest` | Currency | No | Total interest | Calculated, Read-only |

### Security Information (Secured Loans Only)
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `proposed_pledges` | Table (Proposed Pledge) | Conditional | Proposed securities | Required if is_secured_loan |
| `maximum_loan_amount` | Currency | No | Max from securities | Calculated, Read-only |

### Status & Documents
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | Select | No | Application status | Options: Open, Approved, Rejected |
| `documents` | Table (Loan Application Document) | No | Supporting documents |
| `amended_from` | Link (Loan Application) | No | Amended from | Read-only |

---

## Loan Fields

### Applicant & Basic Info
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `applicant_type` | Select | Yes | Type: Employee, Member, Customer | Options: Employee, Member, Customer |
| `applicant` | Dynamic Link | Yes | Applicant reference | Based on applicant_type |
| `applicant_name` | Data | No | Applicant name | Auto-filled, Read-only |
| `loan_application` | Link (Loan Application) | No | Source application | Optional |
| `company` | Link (Company) | Yes | Company | Must match product |
| `posting_date` | Date | Yes | Loan posting date | Default: Today |
| `status` | Select | No | Loan status | Auto-set, Read-only |

### Loan Product & Amount
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `loan_product` | Link (Loan Product) | Yes | Loan product | Must belong to company |
| `loan_amount` | Currency | Conditional | Loan amount | Required if not Line of Credit |
| `loan_category` | Link (Loan Category) | No | Loan category | Fetched from product |
| `loan_partner` | Link (Loan Partner) | No | Co-lending partner | Optional |
| `rate_of_interest` | Percent | Yes | Interest rate | Fetched from product |
| `penalty_charges_rate` | Percent | No | Penalty rate | Fetched from product |

### Disbursement Info
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `disbursement_date` | Date | No | First disbursement date | Set on first disbursement |
| `disbursed_amount` | Currency | No | Total disbursed | Calculated, Read-only |

### Term Loan Details
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `is_term_loan` | Check | No | Is term loan | Fetched from product, Read-only |
| `repayment_schedule_type` | Data | No | Schedule type | Fetched from product, Read-only |
| `repayment_method` | Select | Conditional | Repayment method | Required if is_term_loan |
| `repayment_periods` | Int | Conditional | Number of periods | Required if method = "Repay Over Number of Periods" |
| `monthly_repayment_amount` | Currency | Conditional | Monthly EMI | Fetched from application |
| `repayment_start_date` | Date | Conditional | First repayment date | Required if is_term_loan |
| `repayment_frequency` | Select | Conditional | Frequency | Required if is_term_loan |
| `moratorium_type` | Select | Conditional | Moratorium type | Required if moratorium_tenure > 0 |
| `moratorium_tenure` | Int | Conditional | Moratorium months | Optional |
| `treatment_of_interest` | Select | Conditional | Interest treatment | Required if moratorium_type = "EMI" |

### Line of Credit Details
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `limit_applicable_start` | Date | Conditional | Limit start date | Required if Line of Credit |
| `limit_applicable_end` | Date | Conditional | Limit end date | Required if Line of Credit |
| `maximum_limit_amount` | Currency | Conditional | Maximum limit | Required if Line of Credit |
| `utilized_limit_amount` | Currency | No | Utilized amount | Calculated, Read-only |
| `available_limit_amount` | Currency | No | Available limit | Calculated, Read-only |

### Security & Classification
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_secured_loan` | Check | No | Is secured loan | Default: 0 |
| `maximum_loan_amount` | Currency | No | Max from securities | Calculated, Read-only |
| `days_past_due` | Int | No | Days past due | Calculated, Read-only |
| `classification_code` | Link (Loan Classification) | No | Asset classification | Auto-set, Read-only |
| `classification_name` | Data | No | Classification name | Auto-filled, Read-only |
| `is_npa` | Check | No | Is NPA | Auto-set, Read-only |
| `manual_npa` | Check | No | Manually marked NPA | Can be set on submit |
| `unmark_npa` | Check | No | Unmark NPA | Can be set on submit |

### Restructure Info
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_restructure_count` | Int | No | Number of restructures | Incremented, Read-only |
| `watch_period_end_date` | Date | No | Watch period end | Set on restructure |
| `tenure_post_restructure` | Int | No | Tenure after restructure | Set on restructure |

### Totals & Adjustments
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total_payment` | Currency | No | Total payable | Calculated, Read-only |
| `total_interest_payable` | Currency | No | Total interest | Calculated, Read-only |
| `total_principal_paid` | Currency | No | Principal paid | Calculated, Read-only |
| `total_amount_paid` | Currency | No | Total paid | Calculated, Read-only |
| `written_off_amount` | Currency | No | Written off amount | Calculated, Read-only |
| `debit_adjustment_amount` | Currency | No | Debit adjustments | Calculated, Read-only |
| `credit_adjustment_amount` | Currency | No | Credit adjustments | Calculated, Read-only |
| `refund_amount` | Currency | No | Refund amount | Calculated, Read-only |
| `excess_amount_paid` | Currency | No | Excess paid | Calculated, Read-only |

### Account Freeze
| Field | Type | Required | Description | Dependencies |
|-------|------|----------|-------------|--------------|
| `freeze_account` | Check | No | Freeze account | Can be set on submit |
| `freeze_date` | Date | Conditional | Freeze date | Required if freeze_account = 1 |

### Co-Lending
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fldg_triggered` | Check | No | FLDG triggered | Default: 0 |
| `fldg_trigger_date` | Date | Conditional | FLDG trigger date | Required if fldg_triggered = 1 |

### Accounting
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cost_center` | Link (Cost Center) | Conditional | Cost center | Required if rate_of_interest > 0 |
| `disbursement_account` | Link (Account) | Yes | Disbursement account | Fetched from product, Read-only |
| `payment_account` | Link (Account) | Yes | Payment account | Fetched from product, Read-only |
| `loan_account` | Link (Account) | Yes | Loan account | Fetched from product, Read-only |
| `interest_income_account` | Link (Account) | Yes | Interest income | Fetched from product, Read-only |
| `penalty_income_account` | Link (Account) | Yes | Penalty income | Fetched from product, Read-only |

### Charges & Dates
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_charges` | Table (Loan Disbursement Charge) | No | Loan charges |
| `cancellation_date` | Date | No | Cancellation date | Read-only |
| `settlement_date` | Date | No | Settlement date | Read-only |
| `closure_date` | Date | No | Closure date | Read-only |

---

## Loan Disbursement Fields

### Basic Info
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `against_loan` | Link (Loan) | Yes | Loan being disbursed |
| `applicant_type` | Data | No | Applicant type | Fetched from loan |
| `applicant` | Data | No | Applicant | Fetched from loan |
| `company` | Link (Company) | No | Company | Fetched from loan |
| `loan_product` | Data | No | Loan product | Fetched from loan |

### Disbursement Details
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `disbursement_date` | Date | Yes | Disbursement date | >= loan posting date |
| `disbursed_amount` | Currency | Yes | Amount disbursed | > 0, <= available |
| `sanctioned_loan_amount` | Currency | No | Sanctioned amount | Fetched, Read-only |
| `current_disbursed_amount` | Currency | No | Current disbursed | Fetched, Read-only |
| `status` | Select | No | Disbursement status | Auto-set |

### Broken Period Interest
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bpi_difference_date` | Date | No | BPI difference date |
| `broken_period_interest_days` | Int | No | BPI days | Calculated |
| `broken_period_interest` | Currency | No | BPI amount | Calculated |
| `bpi_amount_difference` | Currency | No | BPI difference | Calculated |

### Repayment Info (Fetched)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repayment_schedule_type` | Data | No | Schedule type | Fetched |
| `repayment_frequency` | Data | No | Frequency | Fetched |
| `repayment_method` | Data | No | Method | Fetched |
| `tenure` | Int | No | Tenure | Fetched |
| `repayment_start_date` | Date | No | Start date | Fetched |
| `monthly_repayment_amount` | Currency | No | Monthly amount | Fetched |
| `is_term_loan` | Check | No | Is term loan | Fetched |

### Accounting
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mode_of_payment` | Link (Mode of Payment) | No | Payment mode |
| `disbursement_account` | Link (Account) | Yes | Disbursement account | Fetched |
| `loan_account` | Link (Account) | Yes | Loan account | Fetched |
| `refund_account` | Link (Account) | No | Refund account |
| `bank_account` | Link (Bank Account) | No | Bank account |
| `cost_center` | Link (Cost Center) | No | Cost center | Fetched |

### Charges & References
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_disbursement_charges` | Table (Loan Disbursement Charge) | No | Disbursement charges |
| `reference_date` | Date | No | Reference date |
| `reference_number` | Data | No | Reference number |
| `clearance_date` | Date | No | Bank clearance date |
| `days_past_due` | Int | No | Days past due | Calculated |
| `withhold_security_deposit` | Check | No | Withhold deposit | Default: 0 |

---

## Loan Repayment Fields

### Basic Info
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `against_loan` | Link (Loan) | Yes | Loan being repaid |
| `applicant_type` | Data | No | Applicant type | Fetched |
| `applicant` | Data | No | Applicant | Fetched |
| `company` | Link (Company) | No | Company | Fetched |
| `loan_product` | Data | No | Loan product | Fetched |

### Repayment Type & Dates
| Field | Type | Required | Description | Options |
|-------|------|----------|-------------|---------|
| `repayment_type` | Select | Yes | Type of repayment | Normal Repayment, Interest Waiver, Penalty Waiver, Charge Payment, Advance Payment, Pre Payment, Loan Closure, Full Settlement, Write Off Settlement |
| `posting_date` | Datetime | Yes | Posting datetime | Default: Now |
| `value_date` | Datetime | Yes | Value date | Default: Now |
| `clearance_date` | Date | No | Bank clearance date | Optional |
| `reference_date` | Date | No | Reference date | Optional |
| `reference_number` | Data | No | Reference number | Optional |

### Amount Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount_paid` | Currency | Yes | Total amount paid | > 0 |
| `principal_amount_paid` | Currency | No | Principal paid | Calculated |
| `interest_payable` | Currency | No | Interest payable | Calculated |
| `total_interest_paid` | Currency | No | Interest paid | Calculated |
| `penalty_amount` | Currency | No | Penalty amount | Calculated |
| `total_penalty_paid` | Currency | No | Penalty paid | Calculated |
| `payable_amount` | Currency | No | Total payable | Calculated |
| `payable_principal_amount` | Currency | No | Principal payable | Calculated |
| `pending_principal_amount` | Currency | No | Pending principal | Calculated |
| `excess_amount` | Currency | No | Excess amount | Calculated |
| `shortfall_amount` | Currency | No | Shortfall amount | Calculated |
| `total_charges_payable` | Currency | No | Charges payable | Calculated |
| `total_charges_paid` | Currency | No | Charges paid | Calculated |
| `unbooked_interest_paid` | Currency | No | Unbooked interest | Calculated |
| `unbooked_penalty_paid` | Currency | No | Unbooked penalty | Calculated |

### Repayment Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repayment_details` | Table (Loan Repayment Detail) | No | Allocation details |
| `payable_charges` | Table (Loan Repayment Charges) | Conditional | Charges to pay | Required if type = "Charge Payment" |
| `prepayment_charges` | Table (Prepayment Charges) | No | Prepayment charges | Auto-calculated |

### Links & References
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_disbursement` | Link (Loan Disbursement) | No | Specific disbursement | Optional |
| `loan_restructure` | Link (Loan Restructure) | No | Related restructure | Optional |
| `loan_adjustment` | Link (Loan Adjustment) | No | Related adjustment | Optional |
| `bulk_repayment_log` | Link (Bulk Repayment Log) | No | Bulk operation | Optional |

### Flags & Status
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_term_loan` | Check | No | Is term loan | Fetched |
| `is_npa` | Check | No | Is NPA | Fetched |
| `is_backdated` | Check | No | Is backdated | Auto-set |
| `is_write_off_waiver` | Check | No | Is write-off waiver | Auto-set |
| `days_past_due` | Int | No | Days past due | Calculated |
| `repayment_schedule_type` | Data | No | Schedule type | Fetched |

### Payment & Accounting
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mode_of_payment` | Link (Mode of Payment) | No | Payment mode |
| `bank_account` | Link (Bank Account) | No | Bank account |
| `payment_account` | Link (Account) | Yes | Payment account | Fetched |
| `loan_account` | Link (Account) | Yes | Loan account | Fetched |
| `penalty_income_account` | Link (Account) | Yes | Penalty account | Fetched |
| `cost_center` | Link (Cost Center) | No | Cost center | Fetched |

### Co-Lending
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loan_partner` | Link (Loan Partner) | No | Co-lending partner | Fetched |
| `loan_partner_share_percentage` | Percent | No | Partner share | Fetched |
| `loan_partner_interest_rate` | Percent | No | Partner rate | Fetched |
| `loan_partner_payment_ratio` | Percent | No | Payment ratio | Calculated |
| `loan_partner_repayment_schedule_type` | Data | No | Partner schedule type | Fetched |
| `total_partner_interest_share` | Currency | No | Partner interest | Calculated |
| `total_partner_principal_share` | Currency | No | Partner principal | Calculated |

### Other
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `due_date` | Date | No | Due date | Calculated |
| `manual_remarks` | Small Text | No | Manual remarks | Optional |

---

## Field Dependencies & Conditional Logic

### Loan Product
- If `repayment_schedule_type == "Monthly as per cycle date"` → `cyclic_day_of_the_month` is required
- If `repayment_schedule_type == "Pro-rated calendar months"` → `repayment_date_on` is required
- If `same_as_regular_interest_accounts == 0` → Additional interest accounts are required

### Loan Application
- If `applicant_type == "Customer"` → Customer fields (name, email, phone, address) are required
- If `is_term_loan == 1` → Repayment fields are required
- If `is_secured_loan == 1` → `proposed_pledges` table is required
- If `repayment_method == "Repay Over Number of Periods"` → `repayment_periods` is required
- If `repayment_method == "Repay Fixed Amount per Period"` → `repayment_amount` is required

### Loan
- If `is_term_loan == 1` and not Line of Credit → Repayment terms are required
- If `repayment_schedule_type == "Line of Credit"` → Credit limit fields are required
- If `rate_of_interest > 0` → `cost_center` is required
- If `freeze_account == 1` → `freeze_date` is required
- If `fldg_triggered == 1` → `fldg_trigger_date` is required
- If `moratorium_tenure > 0` and `moratorium_type == "EMI"` → `treatment_of_interest` is required

### Loan Repayment
- If `repayment_type == "Charge Payment"` → `payable_charges` table can be used
- If `repayment_type` in closure types → Must cover all outstanding amounts
- If `loan_disbursement` is set → Validates against that specific disbursement

---

## Field Auto-Fill Rules

### From Loan Product
- `rate_of_interest` → Fetched to Loan and Loan Application
- `penalty_charges_rate` → Fetched to Loan
- `repayment_schedule_type` → Fetched to Loan
- `is_term_loan` → Fetched to Loan and Loan Application
- `loan_category` → Fetched to Loan
- All account fields → Fetched to Loan

### From Loan Application
- `repayment_amount` → Fetched to Loan (if term loan)
- `applicant`, `applicant_type` → Fetched to Loan
- `loan_amount` → Can be fetched to Loan

### From Loan
- Most fields → Fetched to Loan Disbursement and Loan Repayment
- `applicant`, `applicant_type` → Fetched to related transactions

### Calculated Fields
- `total_payable_amount`, `total_payable_interest` → Calculated in Loan Application
- `maximum_loan_amount` → Calculated from securities
- `available_limit_amount` → Calculated as `maximum_limit_amount - utilized_limit_amount`
- `days_past_due` → Calculated from demands
- `classification_code` → Auto-set based on DPD
- All totals → Calculated from related transactions

---

## Field Validation Rules

### Data Type Validations
- **Currency**: Must be >= 0 (unless specified otherwise)
- **Percent**: Must be >= 0
- **Int**: Must be >= 0 (for counts, days, etc.)
- **Date**: Must be valid date, cannot be future (unless backdating allowed)
- **Link**: Referenced document must exist and be active

### Business Rule Validations
- **Company Match**: All linked documents must belong to same company
- **Amount Limits**: Cannot exceed maximum limits from product
- **Date Sequence**: Dates must follow logical sequence (posting <= disbursement <= repayment)
- **Status Dependencies**: Actions allowed only in specific statuses
- **Required Fields**: Conditional requirements based on other field values

---

This field reference provides comprehensive details for all major fields. For specific field behaviors, refer to the Python validation methods in each doctype file.

