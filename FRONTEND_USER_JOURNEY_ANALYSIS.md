# Frontend User Journey Analysis - Uruti Lending Platform

## Overview

This document analyzes the user journey and frontend interactions in the Uruti Lending Platform (based on Frappe Lending). The frontend is built using Frappe Framework's client-side JavaScript, providing a form-based interface for loan management operations.

---

## 1. Entry Points & Navigation

### 1.1 Main Workspace
- **Route**: `/app/lending`
- **Workspace**: "Lending" workspace with dashboard
- **Key Shortcuts**:
  - Company
  - Loan Application (shows count of "Open" applications)
  - Loan
  - Dashboard

### 1.2 Dashboard Cards
The workspace organizes features into card groups:
- **Loan**: Core loan management
- **Loan Processes**: Processing workflows
- **Disbursement and Repayment**: Transaction management
- **Loan Security**: Collateral management
- **Taxes and Charges**: Fee management
- **Loan Transfers**: Transfer operations
- **Loan Classification**: NPA and classification
- **Co-Lending**: Partner management
- **Loan Adjustments**: Balance adjustments
- **Banking**: Banking operations
- **Reports**: Reporting and analytics

---

## 2. Primary User Journeys

### Journey 1: Loan Origination (New Loan Application)

#### Step 1: Create Loan Application
**Form**: `Loan Application`
**Route**: Create new Loan Application document

**User Actions**:
1. Select **Applicant Type** (Customer/Employee)
2. Enter **Applicant** details:
   - Phone number and email trigger duplicate customer check
   - If duplicate found, user can fetch existing customer
3. Fill **Company** and **Posting Date**
4. Select **Loan Product** (filtered by company)
5. Enter **Loan Amount**
6. Configure loan type:
   - **Is Term Loan**: Yes/No
   - **Is Secured Loan**: Yes/No
7. Set **Rate of Interest**

**For Secured Loans**:
- Add **Proposed Pledges** (child table):
  - Select Loan Security
  - System auto-fetches security price
  - Enter Quantity
  - System calculates:
    - Amount = Qty × Price
    - Post Haircut Amount = Amount - (Amount × Haircut%)
  - System calculates **Maximum Loan Amount** from all pledges

**For Term Loans**:
- Select **Repayment Method**:
  - "Repay Fixed Amount per Period" → Enter **Repayment Amount**
  - "Repay Over Number of Periods" → Enter **Repayment Periods**

**Dynamic Behavior**:
- Fields show/hide based on loan type selections
- Duplicate customer detection with auto-fill option
- Real-time security value calculations

#### Step 2: Submit Application
- Click **Submit** button
- Application status changes to "Submitted" (if workflow enabled)

#### Step 3: Workflow Approval (Multi-step)
**Workflow States**:
1. **Draft** → Loan Officer can edit
2. **Initiated** → Loan Officer initiates
3. **KYC Pending** → Loan Processor reviews
4. **KYC Complete** → Loan Appraiser completes KYC
5. **Approved** → Loan Underwriter approves
6. **Rejected** → Can be rejected at any stage

**User Actions**:
- Each role sees available workflow actions
- Actions appear as buttons in the form
- Email notifications sent on state transitions

#### Step 4: Create Loan from Approved Application
**Condition**: Application must be "Approved" and submitted

**User Actions**:
1. Open approved Loan Application
2. Click **Create → Loan** button (appears when approved)
3. System creates Loan document with:
   - All application details pre-filled
   - Fields from application marked as read-only
   - Proposed pledges copied to securities table

**Alternative**: Create Loan Security Assignment first (for secured loans)

---

### Journey 2: Loan Management (After Creation)

#### Step 1: View/Create Loan
**Form**: `Loan`
**Route**: Open existing Loan or create new

**Key Sections**:
- **Applicant Details**: Applicant type, name, loan application reference
- **Loan Details**: Product, amount, interest rate, status
- **Term Details**: Repayment method, periods, frequency, moratorium
- **Credit Limits**: For Line of Credit loans
- **Classification**: NPA status, DPD, classification codes
- **Account Info**: All accounting accounts
- **Totals**: Payment totals, principal, interest, penalties

**Dynamic Features**:
- **Dashboard Stats** (for Disbursed loans):
  - Disbursed Amount (blue indicator)
  - Pending Principal (orange indicator)

#### Step 2: Loan Disbursement
**Condition**: Loan status must be "Sanctioned", "Partially Disbursed", or "Active"

**User Actions**:
1. Open Loan document
2. Click **Create → Loan Disbursement** button
3. System opens pre-filled Loan Disbursement form:
   - Loan details auto-populated
   - Disbursement amount = Loan Amount - Already Disbursed
   - Repayment start date included
4. User confirms and submits
5. System:
   - Updates loan status to "Disbursed" or "Partially Disbursed"
   - Creates repayment schedule
   - Generates accounting entries

**From Disbursement Form**:
- Can create **Loan Repayment** directly
- Button appears after disbursement is submitted

#### Step 3: Loan Repayment
**Condition**: Loan must be "Disbursed" or "Partially Disbursed"

**User Actions**:
1. Open Loan document
2. Click **Create → Loan Repayment** button
3. System opens Loan Repayment form with:
   - Loan details pre-filled
   - Outstanding amounts calculated
4. User enters:
   - **Value Date**: Triggers amount calculation
   - **Repayment Type**: Normal, Prepayment, Waiver, etc.
   - **Amount Paid**
5. System auto-calculates:
   - Pending Principal Amount
   - Payable Principal Amount
   - Interest Payable
   - Penalty Amount
   - Total Charges Payable
   - Payable Amount
6. User reviews and submits
7. System:
   - Allocates payment (principal, interest, penalty, charges)
   - Updates loan totals
   - Creates accounting entries
   - Updates repayment schedule

**Repayment Types Supported**:
- Normal Repayment
- Prepayment
- Interest Waiver
- Penalty Waiver
- Charges Waiver
- Loan Closure
- And more...

#### Step 4: Loan Closure
**Condition**: Loan must be "Disbursed" or "Partially Disbursed"

**User Actions**:
1. Open Loan document
2. Click **Status → Request Loan Closure** button
3. System changes status to "Loan Closure Requested"
4. For secured loans:
   - Click **Create → Loan Security Release** button
   - Release all securities
5. For unsecured term loans:
   - Click **Status → Close Loan** button (appears when closure requested)
6. System:
   - Closes the loan
   - Updates status to "Closed"
   - Handles any excess amounts
   - Auto write-off for small amounts

---

### Journey 3: Security Management (For Secured Loans)

#### Step 1: Create Loan Security Assignment
**From Loan Application** (if approved and secured):
1. Click **Create → Loan Security Assignment** button
2. System creates assignment with proposed pledges

**From Loan** (if secured):
1. Create Loan Security Assignment manually
2. Link to loan

#### Step 2: Add Pledges
**Form**: `Loan Security Assignment`

**User Actions**:
1. Add pledges in **Securities** table:
   - Select **Loan Security**
   - System auto-fetches:
     - Current security price
     - Available quantity (if applicable)
   - Enter **Quantity**
   - System calculates:
     - Amount = Qty × Price
     - Post Haircut Amount = Amount - (Amount × Haircut%)
2. System calculates totals:
   - Total Security Value
   - Maximum Loan Value

#### Step 3: Submit Assignment
- Submit the assignment
- Securities are now pledged to the loan

#### Step 4: Release Security
**Condition**: Assignment status must be "Release Requested"

**User Actions**:
1. Open Loan Security Assignment
2. Click **Release** button
3. System releases all pledged securities

---

### Journey 4: Loan Restructure

#### Step 1: Create Loan Restructure
**Form**: `Loan Restructure`

**User Actions**:
1. Select **Loan** (must be active)
2. Enter **Restructure Date**
3. System auto-calculates:
   - Pending Principal Amount
   - Total Overdue Amount
   - Principal Overdue
   - Interest Overdue
   - Penalty Overdue
   - Charges Overdue
   - Unaccrued Interest
   - Available Security Deposit
4. Configure new terms:
   - **New Repayment Method**:
     - "Repay Fixed Amount per Period" → Enter new monthly amount
     - "Repay Over Number of Periods" → Enter new period count
   - **New Interest Rate** (optional)
   - **New Repayment Frequency** (optional)
5. Submit restructure
6. System:
   - Creates new repayment schedule
   - Adjusts loan terms
   - Updates loan status

---

### Journey 5: Loan Write-Off & Adjustments

#### Write-Off
**Condition**: Loan must be "Disbursed", "Partially Disbursed", or "Loan Closure Requested"

**User Actions**:
1. Open Loan document
2. Click **Create → Loan Write Off** button
3. Enter write-off amount
4. Submit
5. System:
   - Updates loan totals
   - Creates accounting entries
   - Updates loan status if fully written off

#### Balance Adjustment
**Form**: `Loan Balance Adjustment`

**User Actions**:
1. Create new adjustment
2. Link to loan
3. Enter adjustment type (Debit/Credit)
4. Enter amount and reason
5. Submit
6. System updates loan balances

---

## 3. User Interface Patterns

### 3.1 Form-Based Interface
- All operations use Frappe's form interface
- Forms have sections/collapsible groups
- Child tables for related records (pledges, charges, etc.)

### 3.2 Dynamic Field Behavior
- **Show/Hide**: Fields appear based on selections
  - Example: Repayment amount/periods based on method
  - Security fields only for secured loans
- **Enable/Disable**: Fields become read-only based on state
  - Example: Application fields read-only after approval
- **Required/Optional**: Field requirements change dynamically
  - Example: Security pledges required for secured loans

### 3.3 Real-Time Calculations
- **Auto-calculation on field changes**:
  - Security amounts on quantity/price change
  - Repayment amounts on value date change
  - Overdue amounts on restructure date change
- **Server-side calculations**:
  - All financial calculations done server-side
  - Results displayed immediately

### 3.4 Action Buttons
- **Context-aware buttons**:
  - Buttons appear based on document status
  - Different actions for different states
- **Create buttons**:
  - Create related documents (Loan from Application)
  - Pre-fill data from parent document
- **Status buttons**:
  - Change document status
  - Trigger workflows

### 3.5 Workflow Integration
- **Workflow actions** appear as buttons
- **State-based permissions**: Only authorized roles see actions
- **Email notifications** on state changes
- **Workflow history** visible in document

### 3.6 Data Validation
- **Client-side validation**:
  - Required fields
  - Data type validation
  - Business rule validation
- **Server-side validation**:
  - Complex business rules
  - Duplicate checks
  - Status transition validation

### 3.7 Query Filters
- **Dynamic filters**:
  - Loan products filtered by company
  - Loans filtered by status
  - Accounts filtered by company and type
- **Dependent fields**:
  - Applicant filtered by applicant type
  - Disbursements filtered by loan

---

## 4. Key User Roles & Permissions

### 4.1 Loan Officer
- Create and edit loan applications
- Initiate workflow
- View loans and applications

### 4.2 Loan Processor
- Review applications
- Move to KYC stage
- Reject applications

### 4.3 Loan Appraiser
- Complete KYC verification
- Review security assignments
- Approve or reject

### 4.4 Loan Underwriter
- Final approval authority
- Can approve applications
- Can reject at final stage

### 4.5 Loan Manager
- Full access to all loan operations
- Can create loans, disbursements, repayments
- Can manage security assignments
- Can perform write-offs and adjustments

---

## 5. Navigation Patterns

### 5.1 List Views
- All doctypes have list views
- Filters available for common searches
- Quick filters for status, date ranges, etc.

### 5.2 Form Navigation
- **Create**: New document button
- **Open**: Click on list item
- **Related**: Links to related documents
- **Make**: Create related documents from current form

### 5.3 Breadcrumbs
- Shows current document type and name
- Can navigate back to list

### 5.4 Search
- Global search available
- Searches across all indexed fields
- Quick search in list views

---

## 6. Data Flow Patterns

### 6.1 Parent-Child Relationships
- **Loan Application → Loan**: One-to-one
- **Loan → Disbursements**: One-to-many
- **Loan → Repayments**: One-to-many
- **Loan → Security Assignment**: One-to-many
- **Security Assignment → Pledges**: One-to-many

### 6.2 Status Transitions
- **Application**: Draft → Submitted → Approved/Rejected
- **Loan**: Draft → Sanctioned → Disbursed → Active → Closed
- **Security Assignment**: Active → Release Requested → Released

### 6.3 Calculation Triggers
- **On field change**: Immediate calculation
- **On submit**: Final validation and calculation
- **On related document**: Cascade updates

---

## 7. Error Handling & User Feedback

### 7.1 Validation Errors
- **Inline errors**: Show next to fields
- **Form-level errors**: Show at top of form
- **Business rule violations**: Clear error messages

### 7.2 Confirmations
- **Destructive actions**: Confirmation dialogs
  - Loan closure
  - Security release
  - Write-off
- **State changes**: Confirmations for important transitions

### 7.3 Success Feedback
- **Success messages**: After successful operations
- **Auto-refresh**: Forms refresh after related operations
- **Navigation**: Auto-navigate to created documents

### 7.4 Duplicate Detection
- **Customer duplicates**: Alert with option to use existing
- **Auto-fill**: Option to populate from existing record

---

## 8. Reporting & Analytics

### 8.1 Dashboard
- **Charts**: New loans, disbursements, interest accrual
- **Number cards**: Key metrics
- **Shortcuts**: Quick access to common operations

### 8.2 Reports
- Portfolio reports
- NPA reports
- Collection reports
- Disbursement reports
- Overdue reports
- All with CSV export capability

---

## 9. Mobile & Responsive Considerations

### 9.1 Form Layout
- Responsive form sections
- Mobile-friendly child tables
- Touch-friendly buttons

### 9.2 List Views
- Responsive tables
- Mobile list view alternative
- Quick filters accessible on mobile

---

## 10. Integration Points

### 10.1 Accounting Integration
- Automatic journal entry creation
- GL entry generation
- Account validation

### 10.2 Workflow Engine
- State management
- Role-based actions
- Email notifications

### 10.3 Document Management
- Document upload in applications
- Document verification workflow
- Document type management

---

## Summary

The frontend provides a comprehensive, form-based interface for managing the complete loan lifecycle. Key characteristics:

1. **Workflow-Driven**: Multi-step approvals with role-based access
2. **Context-Aware**: Dynamic UI based on loan type and status
3. **Real-Time Calculations**: Immediate feedback on user actions
4. **Integrated**: Seamless flow between related documents
5. **Validated**: Client and server-side validation
6. **User-Friendly**: Clear navigation, confirmations, and feedback

The user journey flows naturally from application → approval → loan creation → disbursement → repayment → closure, with security management, restructures, and adjustments available as needed throughout the lifecycle.

