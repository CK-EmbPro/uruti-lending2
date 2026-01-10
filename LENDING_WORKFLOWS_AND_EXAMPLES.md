# Frappe Lending - Workflows & Use Cases

## Overview
This document provides detailed workflows, use cases, and examples for common lending operations in the Frappe Lending system.

---

## 1. Standard Loan Lifecycle Workflow

### 1.1 Complete Loan Journey

```
┌─────────────────┐
│ Loan Application│
│   (Open)        │
└────────┬────────┘
         │
         │ [Submit for Approval]
         ▼
┌─────────────────┐
│ Loan Application│
│  (Approved)     │
└────────┬────────┘
         │
         │ [Create Loan]
         ▼
┌─────────────────┐
│      Loan       │
│   (Draft)       │
└────────┬────────┘
         │
         │ [Submit]
         ▼
┌─────────────────┐
│      Loan       │
│  (Sanctioned)   │
└────────┬────────┘
         │
         │ [Create Disbursement]
         ▼
┌─────────────────┐
│ Loan Disbursement│
│   (Submitted)   │
└────────┬────────┘
         │
         │ [Loan Status Updated]
         ▼
┌─────────────────┐
│      Loan       │
│  (Disbursed)    │
└────────┬────────┘
         │
         │ [Repayments Made]
         ▼
┌─────────────────┐
│      Loan       │
│   (Active)      │
└────────┬────────┘
         │
         │ [All Amounts Paid]
         ▼
┌─────────────────┐
│      Loan       │
│   (Closed)      │
└─────────────────┘
```

### 1.2 Detailed Step-by-Step Process

#### Step 1: Create Loan Product
**Purpose**: Define loan product template

**Actions**:
1. Navigate to Loan Product
2. Enter product details:
   - Product Code: `HOME-LOAN-001`
   - Product Name: `Home Loan`
   - Company: `ABC Bank`
   - Rate of Interest: `8.5%`
   - Maximum Loan Amount: `50,00,000`
   - Is Term Loan: `Yes`
   - Repayment Schedule Type: `Monthly as per repayment start date`
3. Configure accounts (all required)
4. Save and Submit

**Result**: Loan product ready for use

---

#### Step 2: Create Loan Application
**Purpose**: Customer applies for loan

**Actions**:
1. Navigate to Loan Application
2. Select Applicant Type: `Customer`
3. Enter customer details (auto-created if new):
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@email.com`
   - Phone: `+1234567890`
4. Select Loan Product: `HOME-LOAN-001`
5. Enter Loan Amount: `30,00,000`
6. If secured, add proposed pledges
7. If term loan, enter repayment details
8. Save and Submit

**Result**: Application in "Open" status

---

#### Step 3: Approve Loan Application
**Purpose**: Lender approves the application

**Actions**:
1. Open Loan Application
2. Review details
3. Update Status: `Approved`
4. Save

**Result**: Application approved, ready to create loan

---

#### Step 4: Create Loan from Application
**Purpose**: Convert approved application to loan

**Actions**:
1. Open approved Loan Application
2. Click "Create Loan" button
3. Review pre-filled loan details
4. Make any necessary adjustments
5. Save

**Result**: Loan created in "Draft" status

---

#### Step 5: Submit Loan
**Purpose**: Sanction the loan

**Actions**:
1. Open Loan
2. Review all details
3. Submit

**Result**: Loan status → "Sanctioned"

---

#### Step 6: Create Loan Disbursement
**Purpose**: Disburse money to borrower

**Actions**:
1. Navigate to Loan Disbursement
2. Select Loan: `ACC-LOAN-2024-00001`
3. Enter Disbursement Date: `2024-01-15`
4. Enter Disbursed Amount: `30,00,000`
5. Select Mode of Payment: `Bank Transfer`
6. Add any disbursement charges
7. Save and Submit

**Result**: 
- Disbursement created
- Loan status → "Disbursed" (or "Partially Disbursed")
- Repayment schedule generated (if term loan)
- GL entries created

---

#### Step 7: Daily Interest Accrual (Automatic)
**Purpose**: Accrue interest daily

**Process**:
- Scheduled job runs daily
- Calculates interest for all active loans
- Creates Loan Interest Accrual entries
- Updates GL entries

**Result**: Interest accrued daily

---

#### Step 8: Generate Demands (Automatic)
**Purpose**: Generate bills based on repayment schedule

**Process**:
- Scheduled job runs daily
- Checks repayment schedule due dates
- Creates Loan Demand entries for due installments
- Sets due dates based on product configuration

**Result**: Demands generated for due installments

---

#### Step 9: Process Repayment
**Purpose**: Record borrower repayment

**Actions**:
1. Navigate to Loan Repayment
2. Select Loan: `ACC-LOAN-2024-00001`
3. Select Repayment Type: `Normal Repayment`
4. Enter Posting Date: `2024-02-15`
5. Enter Value Date: `2024-02-15`
6. System calculates payable amounts automatically
7. Enter Amount Paid: `50,000`
8. Select Mode of Payment: `Bank Transfer`
9. Review repayment details (allocation)
10. Save and Submit

**Result**:
- Repayment recorded
- Demands updated (paid/partially paid)
- Repayment schedule updated
- GL entries created
- Loan totals updated

---

#### Step 10: Loan Closure
**Purpose**: Close fully paid loan

**Actions**:
1. Navigate to Loan Repayment
2. Select Loan: `ACC-LOAN-2024-00001`
3. Select Repayment Type: `Loan Closure`
4. System calculates all outstanding amounts
5. Enter Amount Paid (should equal payable amount)
6. Save and Submit

**Result**:
- All outstanding amounts cleared
- Loan status → "Closed"
- Closure date set
- Final GL entries created

---

## 2. Secured Loan Workflow

### 2.1 Security Pledging Process

```
┌──────────────────────┐
│  Create Loan Security│
│   (Master Data)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Update Security Price│
│   (Current Value)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Loan Security        │
│ Assignment           │
│ (Pledge Requested)   │
└──────────┬───────────┘
           │
           │ [Submit]
           ▼
┌──────────────────────┐
│ Loan Security        │
│ Assignment           │
│ (Pledged)           │
└──────────┬───────────┘
           │
           │ [Link to Loan]
           ▼
┌──────────────────────┐
│      Loan            │
│  (Can Disburse)      │
└──────────────────────┘
```

### 2.2 Example: Secured Home Loan

**Scenario**: Customer wants ₹50,00,000 home loan secured by property worth ₹75,00,000

**Steps**:

1. **Create Security Type**:
   - Type Name: `Residential Property`
   - Haircut: `20%`
   - UOM: `Square Feet`

2. **Create Loan Security**:
   - Security Code: `PROP-001`
   - Security Name: `123 Main Street Property`
   - Security Type: `Residential Property`
   - Original Security Value: `75,00,000`

3. **Update Security Price**:
   - Security: `PROP-001`
   - Price: `75,00,000`
   - Valid From: `2024-01-01`

4. **Create Loan Security Assignment**:
   - Loan: `ACC-LOAN-2024-00001`
   - Add Pledge:
     - Security: `PROP-001`
     - Quantity: `1`
     - Pledge Value: `75,00,000`
   - Maximum Loan Value: `60,00,000` (75,00,000 × 0.8)
   - Submit

5. **Create Loan**:
   - Loan Amount: `50,00,000` (within security limit)
   - Is Secured Loan: `Yes`
   - Maximum Loan Amount: `60,00,000` (auto-calculated)

---

## 3. Partial Disbursement Workflow

### 3.1 Scenario: Construction Loan

**Use Case**: Disburse loan in stages as construction progresses

**Example**:
- Total Loan Amount: ₹50,00,000
- Disbursement 1: ₹20,00,000 (Foundation)
- Disbursement 2: ₹15,00,000 (Structure)
- Disbursement 3: ₹15,00,000 (Finishing)

**Process**:

1. **Create Loan**:
   - Loan Amount: `50,00,000`
   - Status: `Sanctioned`

2. **First Disbursement**:
   - Disbursed Amount: `20,00,000`
   - Loan Status → `Partially Disbursed`
   - Disbursed Amount: `20,00,000`

3. **Second Disbursement**:
   - Disbursed Amount: `15,00,000`
   - Loan Status → `Partially Disbursed`
   - Disbursed Amount: `35,00,000`

4. **Third Disbursement**:
   - Disbursed Amount: `15,00,000`
   - Loan Status → `Disbursed`
   - Disbursed Amount: `50,00,000`

**Note**: Repayment schedule is generated after first disbursement, but can be adjusted for subsequent disbursements.

---

## 4. Loan Restructure Workflow

### 4.1 Scenario: Borrower Facing Financial Difficulty

**Use Case**: Extend loan tenure due to temporary financial hardship

**Example**:
- Original Loan: ₹30,00,000, 5 years, ₹60,000/month
- Restructure: Extend to 7 years, reduce to ₹45,000/month

**Process**:

1. **Create Loan Restructure**:
   - Loan: `ACC-LOAN-2024-00001`
   - Restructure Type: `Normal Restructure`
   - Restructure Date: `2024-06-01`
   - System calculates overdue amounts:
     - Pending Principal: `25,00,000`
     - Interest Overdue: `1,50,000`
     - Penalty Overdue: `25,000`
   - New Terms:
     - Repayment Periods: `84` (7 years)
     - Monthly Repayment: `45,000`

2. **Submit Restructure**:
   - Old repayment schedule cancelled
   - New repayment schedule generated
   - Restructure count incremented
   - Watch period may be set

3. **Result**:
   - Loan continues with new terms
   - Overdue amounts included in new schedule
   - Borrower can manage payments

---

## 5. Loan Write Off Workflow

### 5.1 Scenario: Bad Debt Write Off

**Use Case**: Write off loan that cannot be recovered

**Example**:
- Loan: ₹10,00,000
- Outstanding: ₹2,50,000 (principal) + ₹50,000 (interest) = ₹3,00,000
- Decision: Write off as bad debt

**Process**:

1. **Create Loan Write Off**:
   - Loan: `ACC-LOAN-2024-00001`
   - Posting Date: `2024-12-01`
   - Value Date: `2024-12-01`
   - Write Off Amount: `2,50,000` (auto-calculated = pending principal)
   - Is Settlement Write Off: `No`

2. **Submit Write Off**:
   - Unbooked interest processed
   - Interest/penalty waivers created
   - GL entries:
     - Debit: Write Off Account (Expense)
     - Credit: Loan Account (Asset)
   - Suspense entries cancelled
   - Charges written off
   - Loan status → `Written Off`

3. **Result**:
   - Loan marked as written off
   - Accounting entries created
   - Loan no longer appears in active loans

---

## 6. Line of Credit (LOC) Workflow

### 6.1 Scenario: Revolving Credit Facility

**Use Case**: Business line of credit with drawdown and repayment flexibility

**Example**:
- Credit Limit: ₹50,00,000
- Period: 1 year (2024-01-01 to 2024-12-31)
- Drawdown 1: ₹20,00,000 on 2024-01-15
- Repayment 1: ₹5,00,000 on 2024-03-15
- Drawdown 2: ₹10,00,000 on 2024-06-01

**Process**:

1. **Create Loan (LOC)**:
   - Repayment Schedule Type: `Line of Credit`
   - Limit Applicable Start: `2024-01-01`
   - Limit Applicable End: `2024-12-31`
   - Maximum Limit Amount: `50,00,000`
   - Available Limit Amount: `50,00,000`

2. **First Drawdown**:
   - Create Loan Disbursement: `20,00,000`
   - Utilized Limit: `20,00,000`
   - Available Limit: `30,00,000`

3. **Repayment**:
   - Create Loan Repayment: `5,00,000`
   - Utilized Limit: `15,00,000`
   - Available Limit: `35,00,000`

4. **Second Drawdown**:
   - Create Loan Disbursement: `10,00,000`
   - Utilized Limit: `25,00,000`
   - Available Limit: `25,00,000`

**Note**: LOC loans don't have fixed repayment schedules. Interest is calculated on daily outstanding balance.

---

## 7. Co-Lending Workflow

### 7.1 Scenario: Partnership Loan

**Use Case**: Two lenders share a loan (80-20 split)

**Example**:
- Total Loan: ₹50,00,000
- Partner A (Primary): 80% = ₹40,00,000
- Partner B (Secondary): 20% = ₹10,00,000

**Process**:

1. **Configure Loan Partners**:
   - Create Loan Partner A: Share 80%, Rate 8%
   - Create Loan Partner B: Share 20%, Rate 7.5%
   - Link to Loan Product

2. **Create Loan**:
   - Loan Amount: `50,00,000`
   - Loan Partner: `Partner A` (primary)
   - System fetches partner configuration

3. **Disbursement**:
   - Total: `50,00,000`
   - Partner A Share: `40,00,000`
   - Partner B Share: `10,00,000`
   - Separate GL entries for each partner

4. **Repayment**:
   - Total Repayment: `5,00,000`
   - Partner A Share: `4,00,000` (80%)
   - Partner B Share: `1,00,000` (20%)
   - Interest calculated separately for each partner

---

## 8. NPA (Non-Performing Asset) Workflow

### 8.1 Scenario: Loan Becomes NPA

**Use Case**: Loan overdue beyond threshold

**Example**:
- Loan: ₹30,00,000
- DPD Threshold: 90 days
- Current DPD: 95 days

**Process**:

1. **Automatic Classification** (Daily Batch):
   - System checks DPD for all loans
   - Loan DPD: 95 days > 90 days threshold
   - Classification Code → `Sub Standard`
   - `is_npa` → `1` (True)

2. **Impact**:
   - Interest moved to suspense ledger
   - All loans of same customer marked NPA
   - Classification code updated
   - Collection strategy changes

3. **Manual NPA** (if needed):
   - Can manually mark as NPA before threshold
   - Set `manual_npa = 1`
   - Same impact as automatic

4. **Unmark NPA**:
   - Can unmark after watch period
   - Set `unmark_npa = 1`
   - Watch period end date must have passed
   - Interest moved back from suspense

---

## 9. Moratorium Workflow

### 9.1 Scenario: EMI Holiday

**Use Case**: Provide 3-month moratorium due to COVID-19

**Example**:
- Loan: ₹30,00,000, 5 years
- Moratorium: 3 months (EMI type)
- Interest Treatment: Capitalize

**Process**:

1. **Set Moratorium in Loan**:
   - Moratorium Type: `EMI`
   - Moratorium Tenure: `3`
   - Treatment of Interest: `Capitalize`

2. **Impact**:
   - No repayment schedule entries for 3 months
   - Interest during moratorium is capitalized (added to principal)
   - Repayment schedule resumes after moratorium
   - First EMI after moratorium includes capitalized interest

3. **Repayment Schedule**:
   - Months 1-3: No entries (moratorium)
   - Month 4: First EMI (includes capitalized interest)
   - Months 5-60: Regular EMIs

---

## 10. Prepayment Workflow

### 10.1 Scenario: Early Repayment

**Use Case**: Borrower pays extra to reduce tenure

**Example**:
- Loan: ₹30,00,000, 5 years, ₹60,000/month
- Prepayment: ₹5,00,000 on month 12

**Process**:

1. **Create Prepayment**:
   - Repayment Type: `Pre Payment`
   - Amount Paid: `5,00,000`
   - System calculates:
     - Principal Paid: `5,00,000`
     - Prepayment Charges: (if applicable)

2. **Schedule Reschedule**:
   - Old schedule cancelled
   - New schedule generated with reduced tenure
   - Monthly EMI remains same (or reduced if option chosen)
   - Total interest reduced

3. **Result**:
   - Loan tenure reduced
   - Interest savings for borrower
   - Prepayment charges applied (if configured)

---

## 11. Security Shortfall Workflow

### 11.1 Scenario: Security Value Drops

**Use Case**: Property value decreases, creating shortfall

**Example**:
- Original Security Value: ₹75,00,000
- Maximum Loan Value: ₹60,00,000 (80% LTV)
- Current Security Value: ₹55,00,000
- Maximum Loan Value Now: ₹44,00,000
- Loan Amount: ₹50,00,000
- Shortfall: ₹6,00,000

**Process**:

1. **Update Security Price**:
   - Security: `PROP-001`
   - New Price: `55,00,000`
   - Valid From: `2024-06-01`

2. **Daily Batch Check**:
   - System checks all secured loans
   - Calculates current maximum loan value
   - Compares with loan amount
   - Creates Loan Security Shortfall if shortfall exists

3. **Shortfall Actions**:
   - Notify lender
   - Request additional security
   - Adjust loan terms if needed
   - Monitor until resolved

---

## 12. Bulk Operations

### 12.1 Bulk Repayment

**Use Case**: Process multiple repayments at once

**Process**:

1. **Create Bulk Repayment Log**:
   - Select multiple loans
   - Upload repayment file (CSV/Excel)
   - Map columns:
     - Loan Number
     - Amount Paid
     - Payment Date
     - Reference Number

2. **Process Bulk Repayments**:
   - System creates individual Loan Repayment entries
   - Validates each repayment
   - Processes valid repayments
   - Reports errors for invalid ones

3. **Result**:
   - Multiple repayments processed
   - Bulk log tracks all operations
   - Individual repayment entries created

---

## 13. Reporting Workflows

### 13.1 Loan Outstanding Report

**Purpose**: View all outstanding loans

**Process**:
1. Navigate to Loan Outstanding Report
2. Set filters:
   - Company
   - Loan Product
   - Status
   - Date range
3. Generate report
4. Export if needed

**Output**: List of loans with outstanding amounts, DPD, classification

---

### 13.2 Cashflow Reports

**Purpose**: Forecast future cashflows

**Types**:
- **Past Cashflow**: Historical repayments
- **Future Cashflow**: Projected repayments

**Process**:
1. Navigate to Cashflow Report
2. Set date range
3. Select loan products/loans
4. Generate report

**Output**: Cashflow schedule showing expected receipts

---

## 14. Error Handling & Edge Cases

### 14.1 Backdated Entries

**Scenario**: Record repayment with past value date

**Validation**:
- Value date cannot be before disbursement date
- Cannot create entries that conflict with existing transactions
- System recalculates interest and demands

**Process**:
1. Create repayment with backdated value date
2. System validates against existing entries
3. Reverses and recreates affected entries
4. Updates all calculations

---

### 14.2 Cancellation Workflow

**Scenario**: Cancel a submitted document

**Process**:
1. Open submitted document
2. Click Cancel
3. System validates:
   - No dependent transactions
   - Can be cancelled
4. Cancel document
5. Reverse all GL entries
6. Update related documents

**Note**: Some documents cannot be cancelled if dependent transactions exist.

---

## 15. Integration Workflows

### 15.1 Accounting Integration

**Process**:
- All loan transactions create GL entries
- Entries use value date (not posting date)
- Double-entry bookkeeping maintained
- Cost center and accounting dimensions supported

### 15.2 Bank Reconciliation

**Process**:
1. Loan Repayment/Disbursement appears in bank statement
2. Match with bank transaction
3. Update clearance date
4. Reconcile in bank reconciliation statement

---

This document provides comprehensive workflows for all major lending operations. For specific implementation details, refer to the source code and business rules documentation.

