# Frappe Lending - Technical Specification for Multi-Language Implementation

## Overview
This document provides comprehensive technical specifications for rebuilding the Frappe Lending platform in any programming language. It includes architecture, algorithms, state machines, data flows, and implementation patterns.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Core Algorithms & Calculations](#2-core-algorithms--calculations)
3. [State Machines & Workflows](#3-state-machines--workflows)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Component Design](#5-component-design)
6. [Implementation Patterns](#6-implementation-patterns)
7. [Sequence Diagrams](#7-sequence-diagrams)
8. [Technical Requirements](#8-technical-requirements)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  (Web UI, Mobile App, API Gateway, Third-party Integrations) │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Loan Mgmt    │  │ Origination  │  │ Security Mgmt │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Calculation  │  │ Accounting   │  │ Reporting    │      │
│  │ Engine       │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Validators   │  │ State        │  │ Workflow     │      │
│  │              │  │ Machines     │  │ Engine       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Scheduler    │  │ Event        │  │ Notification │      │
│  │ Service      │  │ Handler      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       Data Access Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repository   │  │ Transaction  │  │ Cache        │      │
│  │ Pattern      │  │ Manager      │  │ Manager      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                        Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Database     │  │ File Storage │  │ Message      │      │
│  │ (SQL/NoSQL)  │  │              │  │ Queue       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

#### 1.2.1 Loan Management Service
- **Purpose**: Core loan lifecycle management
- **Responsibilities**:
  - Loan creation, update, cancellation
  - Status management
  - Loan queries and reporting
- **Key Methods**:
  - `createLoan(loanData)`
  - `updateLoan(loanId, updates)`
  - `submitLoan(loanId)`
  - `cancelLoan(loanId)`
  - `getLoan(loanId)`
  - `listLoans(filters)`

#### 1.2.2 Calculation Engine
- **Purpose**: All financial calculations
- **Responsibilities**:
  - EMI calculation
  - Interest accrual
  - Penalty calculation
  - Repayment schedule generation
  - Outstanding amount calculation
- **Key Methods**:
  - `calculateEMI(principal, rate, periods, frequency)`
  - `calculateInterest(principal, rate, days, dayCountConvention)`
  - `calculatePenalty(overdueAmount, rate, daysOverdue)`
  - `generateRepaymentSchedule(loan)`
  - `calculateOutstanding(loanId, asOfDate)`

#### 1.2.3 Repayment Service
- **Purpose**: Handle all repayment operations
- **Responsibilities**:
  - Process repayments
  - Allocate payments to demands
  - Handle excess payments
  - Process prepayments
- **Key Methods**:
  - `processRepayment(repaymentData)`
  - `allocatePayment(amount, demands, allocationOrder)`
  - `handleExcessPayment(loanId, excessAmount)`
  - `processPrepayment(loanId, amount)`

#### 1.2.4 Disbursement Service
- **Purpose**: Handle loan disbursements
- **Responsibilities**:
  - Create disbursement records
  - Update loan status
  - Generate accounting entries
- **Key Methods**:
  - `createDisbursement(disbursementData)`
  - `processDisbursement(disbursementId)`
  - `getDisbursementHistory(loanId)`

#### 1.2.5 Interest Accrual Service
- **Purpose**: Daily interest accrual processing
- **Responsibilities**:
  - Calculate daily interest
  - Create accrual entries
  - Handle term loan vs LOC differences
- **Key Methods**:
  - `accrueInterest(loanId, postingDate)`
  - `batchAccrueInterest(postingDate)`
  - `getAccruedInterest(loanId, fromDate, toDate)`

#### 1.2.6 Demand Generation Service
- **Purpose**: Generate loan demands from schedules
- **Responsibilities**:
  - Create demands from repayment schedules
  - Calculate overdue amounts
  - Generate penalty demands
- **Key Methods**:
  - `generateDemands(loanId, postingDate)`
  - `batchGenerateDemands(postingDate)`
  - `calculateOverdue(demandId, asOfDate)`

#### 1.2.7 Security Management Service
- **Purpose**: Manage loan securities/collateral
- **Responsibilities**:
  - Security assignment
  - Valuation
  - Shortfall calculation
- **Key Methods**:
  - `assignSecurity(assignmentData)`
  - `calculateSecurityValue(securityId, haircut)`
  - `checkShortfall(loanId)`

#### 1.2.8 Accounting Service
- **Purpose**: Generate accounting entries
- **Responsibilities**:
  - Create GL entries
  - Handle double-entry bookkeeping
  - Integration with accounting system
- **Key Methods**:
  - `createGLEntries(transaction, entries)`
  - `reverseGLEntries(transactionId)`
  - `getAccountBalance(accountId, asOfDate)`

#### 1.2.9 Scheduler Service
- **Purpose**: Execute scheduled batch jobs
- **Responsibilities**:
  - Daily interest accrual
  - Daily demand generation
  - Security shortfall checks
  - Loan classification
- **Key Methods**:
  - `scheduleDailyJobs()`
  - `scheduleMonthlyJobs()`
  - `executeJob(jobName, params)`

---

## 2. Core Algorithms & Calculations

### 2.1 EMI Calculation (Reducing Balance Method)

#### Algorithm
```
FUNCTION calculateEMI(principal, annualRate, periods, frequency):
    IF frequency == "One Time":
        periods = 1
    
    IF annualRate > 0:
        // Convert annual rate to periodic rate
        periodicRate = annualRate / (getFrequencyMultiplier(frequency) * 100)
        
        // EMI Formula: [P × R × (1+R)^N] / [(1+R)^N - 1]
        numerator = principal * periodicRate * POWER(1 + periodicRate, periods)
        denominator = POWER(1 + periodicRate, periods) - 1
        emi = CEIL(numerator / denominator)
    ELSE:
        // No interest - simple division
        emi = CEIL(principal / periods)
    
    RETURN emi

FUNCTION getFrequencyMultiplier(frequency):
    SWITCH frequency:
        CASE "Monthly": RETURN 12
        CASE "Bi-Weekly": RETURN 26
        CASE "Weekly": RETURN 52
        CASE "Daily": RETURN 365
        CASE "Quarterly": RETURN 4
        CASE "One Time": RETURN 1
        DEFAULT: RETURN 12
```

#### Implementation Notes
- Use `CEIL` (ceiling) function to round up
- Handle zero interest rate case separately
- Precision: Use currency precision (typically 2 decimal places)

### 2.2 Interest Calculation

#### Algorithm (Simple Interest)
```
FUNCTION calculateInterest(principal, annualRate, days, dayCountConvention, postingDate):
    // Get days in year based on convention
    daysInYear = getDaysInYear(dayCountConvention, postingDate)
    
    // Calculate interest: (Principal × Rate × Days) / (Days in Year × 100)
    interest = (principal * annualRate * days) / (daysInYear * 100)
    
    // Round to precision
    interest = ROUND(interest, currencyPrecision)
    
    RETURN interest

FUNCTION getDaysInYear(convention, date):
    SWITCH convention:
        CASE "Actual/365": RETURN 365
        CASE "Actual/360": RETURN 360
        CASE "Actual/Actual": RETURN getActualDaysInYear(date)
        CASE "30/360": RETURN 360
        DEFAULT: RETURN 365
```

#### Implementation Notes
- Day count conventions affect interest calculation
- For term loans, interest is calculated per schedule period
- For LOC loans, interest is calculated daily

### 2.3 Repayment Schedule Generation

#### Algorithm (Term Loan - Monthly Schedule)
```
FUNCTION generateRepaymentSchedule(loan):
    schedule = []
    balance = loan.disbursed_amount
    emi = calculateEMI(loan.loan_amount, loan.rate_of_interest, 
                       loan.repayment_periods, loan.repayment_frequency)
    
    paymentDate = loan.repayment_start_date
    previousInterestAmount = 0
    carryForwardInterest = 0
    
    FOR i = 1 TO loan.repayment_periods:
        // Calculate days in period
        days = calculateDaysInPeriod(paymentDate, loan.repayment_frequency)
        
        // Calculate interest for this period
        interest = calculateInterest(balance, loan.rate_of_interest, 
                                   days, loan.day_count_convention, paymentDate)
        
        // Add carry forward interest if any
        IF carryForwardInterest > 0:
            interest = interest + carryForwardInterest
            carryForwardInterest = 0
        
        // Add previous period's excess interest
        IF previousInterestAmount > 0:
            interest = interest + previousInterestAmount
            previousInterestAmount = 0
        
        // Calculate principal
        principal = emi - interest
        
        // Handle case where interest exceeds EMI
        IF interest > emi:
            previousInterestAmount = interest - emi
            interest = emi
            principal = 0
        
        // Update balance
        balance = balance + interest - emi
        
        // Handle negative balance (overpayment)
        IF balance < 0:
            principal = principal + balance
            balance = 0
        
        // Create schedule entry
        scheduleEntry = {
            installment_number: i,
            payment_date: paymentDate,
            principal_amount: principal,
            interest_amount: interest,
            total_payment: principal + interest,
            balance_loan_amount: balance,
            days: days
        }
        schedule.APPEND(scheduleEntry)
        
        // Move to next payment date
        paymentDate = getNextPaymentDate(paymentDate, loan.repayment_frequency)
    
    RETURN schedule
```

#### Schedule Types

**1. Monthly as per repayment start date:**
```
FUNCTION getNextPaymentDate(currentDate, frequency):
    RETURN addMonths(currentDate, 1)
```

**2. Pro-rated calendar months:**
```
FUNCTION getNextPaymentDate(currentDate, frequency, repaymentDateOn):
    IF repaymentDateOn == "Start of Month":
        RETURN getFirstDayOfNextMonth(currentDate)
    ELSE: // End of Month
        RETURN getLastDayOfNextMonth(currentDate)
```

**3. Monthly as per cycle date:**
```
FUNCTION getNextPaymentDate(currentDate, frequency, cycleDay):
    nextMonth = addMonths(currentDate, 1)
    RETURN setDayOfMonth(nextMonth, cycleDay)
```

### 2.4 Interest Accrual Algorithm

#### For Line of Credit (LOC) Loans
```
FUNCTION accrueInterestLOC(loan, postingDate):
    // Get last accrual date
    lastAccrualDate = getLastAccrualDate(loan.id, postingDate)
    
    // Calculate days since last accrual
    days = dateDiff(postingDate, lastAccrualDate)
    
    IF days <= 0:
        RETURN // Already accrued
    
    // Get outstanding principal
    principal = getPendingPrincipalAmount(loan.id)
    
    // Calculate interest
    interest = calculateInterest(principal, loan.rate_of_interest, 
                               days, loan.day_count_convention, postingDate)
    
    IF interest > 0:
        // Create accrual entry
        createAccrualEntry({
            loan_id: loan.id,
            posting_date: postingDate,
            principal_amount: principal,
            interest_amount: interest,
            days: days,
            interest_type: "Normal Interest"
        })
```

#### For Term Loans
```
FUNCTION accrueInterestTermLoan(loan, postingDate):
    // Get repayment schedules overlapping with accrual period
    schedules = getOverlappingSchedules(loan.id, postingDate)
    
    totalInterest = 0
    
    FOR EACH schedule IN schedules:
        // Get last accrual date for this schedule
        lastAccrualDate = getLastAccrualDateForSchedule(schedule.id, postingDate)
        
        // Get principal amount for this schedule period
        principal = getPrincipalAmountForSchedule(schedule.id, postingDate)
        
        // Calculate days
        days = dateDiff(postingDate, lastAccrualDate)
        
        // Calculate interest
        interest = calculateInterest(principal, loan.rate_of_interest, 
                                   days, loan.day_count_convention, postingDate)
        
        IF interest > 0:
            totalInterest = totalInterest + interest
            
            // Create accrual entry linked to schedule
            createAccrualEntry({
                loan_id: loan.id,
                repayment_schedule_id: schedule.id,
                posting_date: postingDate,
                principal_amount: principal,
                interest_amount: interest,
                days: days,
                interest_type: "Normal Interest"
            })
    
    RETURN totalInterest
```

### 2.5 Penalty Calculation

#### Algorithm
```
FUNCTION calculatePenalty(loan, demand, asOfDate):
    // Check if grace period applies
    IF isWithinGracePeriod(demand.due_date, loan.grace_period_days, asOfDate):
        RETURN 0
    
    // Calculate days overdue
    daysOverdue = dateDiff(asOfDate, demand.due_date)
    
    IF daysOverdue <= 0:
        RETURN 0
    
    // Get outstanding amount
    outstandingAmount = demand.outstanding_amount
    
    // Calculate penalty: (Outstanding × Penalty Rate × Days) / (365 × 100)
    penaltyRate = loan.penalty_interest_rate
    daysInYear = 365 // or based on day count convention
    
    penalty = (outstandingAmount * penaltyRate * daysOverdue) / (daysInYear * 100)
    
    // Round to precision
    penalty = ROUND(penalty, currencyPrecision)
    
    RETURN penalty
```

### 2.6 Repayment Allocation Algorithm

#### Algorithm
```
FUNCTION allocateRepayment(loanId, amountPaid, postingDate, allocationOrder):
    // Get all unpaid demands
    demands = getUnpaidDemands(loanId, postingDate)
    
    // Sort demands by allocation order
    sortedDemands = sortDemandsByOrder(demands, allocationOrder)
    
    remainingAmount = amountPaid
    allocations = []
    
    FOR EACH demand IN sortedDemands:
        IF remainingAmount <= 0:
            BREAK
        
        // Calculate allocation amount
        allocationAmount = MIN(remainingAmount, demand.outstanding_amount)
        
        // Allocate
        allocation = {
            demand_id: demand.id,
            demand_type: demand.demand_type,
            demand_subtype: demand.demand_subtype,
            allocated_amount: allocationAmount
        }
        allocations.APPEND(allocation)
        
        // Update demand
        demand.outstanding_amount = demand.outstanding_amount - allocationAmount
        
        // Update remaining
        remainingAmount = remainingAmount - allocationAmount
    
    // Handle excess payment
    IF remainingAmount > 0:
        excessAmount = remainingAmount
        updateLoanExcessAmount(loanId, excessAmount)
    
    RETURN allocations
```

#### Allocation Order (Default)
1. Penalty
2. Interest
3. Principal
4. Charges

### 2.7 Outstanding Amount Calculation

#### Algorithm
```
FUNCTION calculateOutstanding(loanId, asOfDate, includeUnaccrued = false):
    loan = getLoan(loanId)
    
    // Get disbursed amount
    disbursedAmount = getTotalDisbursedAmount(loanId)
    
    // Get total principal paid
    principalPaid = getTotalPrincipalPaid(loanId, asOfDate)
    
    // Get total interest paid
    interestPaid = getTotalInterestPaid(loanId, asOfDate)
    
    // Calculate principal outstanding
    principalOutstanding = disbursedAmount - principalPaid
    
    // Get unpaid interest demands
    unpaidInterest = getUnpaidInterestDemands(loanId, asOfDate)
    
    // Get unpaid penalty demands
    unpaidPenalty = getUnpaidPenaltyDemands(loanId, asOfDate)
    
    // Get unpaid charges
    unpaidCharges = getUnpaidCharges(loanId, asOfDate)
    
    // Calculate unaccrued interest if needed
    unaccruedInterest = 0
    IF includeUnaccrued:
        unaccruedInterest = calculateUnaccruedInterest(loanId, asOfDate)
    
    // Total outstanding
    totalOutstanding = principalOutstanding + unpaidInterest + 
                      unpaidPenalty + unpaidCharges + unaccruedInterest
    
    RETURN {
        principal_outstanding: principalOutstanding,
        interest_outstanding: unpaidInterest,
        penalty_outstanding: unpaidPenalty,
        charges_outstanding: unpaidCharges,
        unaccrued_interest: unaccruedInterest,
        total_outstanding: totalOutstanding
    }
```

### 2.8 Security Valuation Algorithm

#### Algorithm
```
FUNCTION calculateSecurityValue(security, haircut):
    // Get current market value
    marketValue = security.current_market_value
    
    // Apply haircut
    // Loan value = Market Value × (1 - Haircut%)
    loanValue = marketValue * (1 - haircut / 100)
    
    RETURN loanValue

FUNCTION calculateMaximumLoanAmount(securities):
    totalLoanValue = 0
    
    FOR EACH security IN securities:
        loanValue = calculateSecurityValue(security, security.haircut)
        totalLoanValue = totalLoanValue + loanValue
    
    RETURN totalLoanValue
```

### 2.9 Security Shortfall Calculation

#### Algorithm
```
FUNCTION calculateSecurityShortfall(loanId, asOfDate):
    loan = getLoan(loanId)
    
    // Get current security value
    currentSecurityValue = getCurrentSecurityValue(loanId)
    
    // Calculate required security value
    // Typically: Outstanding Principal × Security Coverage Ratio
    outstandingPrincipal = calculateOutstanding(loanId, asOfDate).principal_outstanding
    requiredSecurityValue = outstandingPrincipal * loan.security_coverage_ratio
    
    // Calculate shortfall
    shortfall = requiredSecurityValue - currentSecurityValue
    
    IF shortfall > 0:
        RETURN {
            has_shortfall: true,
            shortfall_amount: shortfall,
            current_value: currentSecurityValue,
            required_value: requiredSecurityValue
        }
    ELSE:
        RETURN {
            has_shortfall: false,
            shortfall_amount: 0,
            current_value: currentSecurityValue,
            required_value: requiredSecurityValue
        }
```

---

## 3. State Machines & Workflows

### 3.1 Loan Status State Machine

#### States
- `Draft` - Initial state, not submitted
- `Sanctioned` - Submitted and approved, not disbursed
- `Partially Disbursed` - Some amount disbursed, not fully disbursed
- `Disbursed` - Fully disbursed, not yet active
- `Active` - Active loan with ongoing repayments
- `Loan Closure Requested` - Closure requested, pending approval
- `Closed` - Loan closed normally
- `Written Off` - Loan written off
- `Settled` - Loan settled (partial payment)

#### State Transitions

```
Draft → Sanctioned
  Trigger: submitLoan()
  Conditions:
    - Loan amount > 0
    - Loan product is active
    - Applicant exists
    - All required fields filled
  Actions:
    - Validate loan data
    - Set status to "Sanctioned"
    - Create audit trail

Sanctioned → Partially Disbursed
  Trigger: createDisbursement() (partial)
  Conditions:
    - Disbursement amount > 0
    - Disbursement amount < loan_amount
    - Total disbursed < loan_amount
  Actions:
    - Update disbursed_amount
    - Set status to "Partially Disbursed"
    - Generate repayment schedule (if term loan and first disbursement)

Partially Disbursed → Disbursed
  Trigger: createDisbursement() (final)
  Conditions:
    - Total disbursed == loan_amount
  Actions:
    - Update disbursed_amount
    - Set status to "Disbursed"

Disbursed → Active
  Trigger: Automatic (on first repayment or after disbursement date)
  Conditions:
    - At least one repayment made OR
    - Disbursement date passed
  Actions:
    - Set status to "Active"
    - Start interest accrual

Active → Loan Closure Requested
  Trigger: requestLoanClosure()
  Conditions:
    - Loan is active
    - Outstanding amount can be paid
  Actions:
    - Set status to "Loan Closure Requested"
    - Calculate closure amount

Loan Closure Requested → Closed
  Trigger: processLoanClosure()
  Conditions:
    - Closure amount paid
    - All demands cleared
  Actions:
    - Set status to "Closed"
    - Close all related records

Active → Written Off
  Trigger: createLoanWriteOff()
  Conditions:
    - Loan is active
    - Write-off amount <= outstanding
  Actions:
    - Set status to "Written Off"
    - Create write-off entry
    - Update accounting

Active → Settled
  Trigger: processSettlement()
  Conditions:
    - Settlement amount agreed
    - Settlement amount < outstanding
  Actions:
    - Set status to "Settled"
    - Create settlement entry
```

#### State Machine Diagram
```
┌────────┐
│ Draft  │
└───┬────┘
    │ submitLoan()
    ▼
┌──────────────┐
│ Sanctioned   │
└───┬──────────┘
    │ createDisbursement() [partial]
    ▼
┌──────────────────────┐
│ Partially Disbursed  │
└───┬──────────────────┘
    │ createDisbursement() [final]
    ▼
┌──────────────┐
│ Disbursed    │
└───┬──────────┘
    │ [automatic]
    ▼
┌────────┐
│ Active │
└───┬────┘
    │
    ├──► requestLoanClosure() ──► ┌──────────────────────┐
    │                              │ Loan Closure         │
    │                              │ Requested            │
    │                              └───┬──────────────────┘
    │                                  │ processClosure()
    │                                  ▼
    │                              ┌────────┐
    │                              │ Closed │
    │                              └────────┘
    │
    ├──► createWriteOff() ──► ┌────────────┐
    │                          │ Written Off│
    │                          └────────────┘
    │
    └──► processSettlement() ──► ┌──────────┐
                                  │ Settled  │
                                  └──────────┘
```

### 3.2 Loan Application State Machine

#### States
- `Open` - Initial state
- `Initiated` - Application initiated
- `KYC Pending` - KYC verification pending
- `KYC Complete` - KYC completed
- `Approved` - Application approved
- `Rejected` - Application rejected

#### State Transitions
```
Open → Initiated
  Trigger: initiateApplication()
  Allowed Roles: Loan Officer

Initiated → KYC Pending
  Trigger: reviewApplication()
  Allowed Roles: Loan Processor

Initiated → Rejected
  Trigger: rejectApplication()
  Allowed Roles: Loan Processor

KYC Pending → KYC Complete
  Trigger: completeKYC()
  Allowed Roles: Loan Appraiser

KYC Pending → Rejected
  Trigger: rejectApplication()
  Allowed Roles: Loan Appraiser

KYC Complete → Approved
  Trigger: approveApplication()
  Allowed Roles: Loan Underwriter

KYC Complete → Rejected
  Trigger: rejectApplication()
  Allowed Roles: Loan Underwriter
```

### 3.3 Loan Security Assignment State Machine

#### States
- `Pledge Requested` - Pledge request created
- `Pledged` - Security pledged
- `Release Requested` - Release request created
- `Released` - Security released

#### State Transitions
```
Pledge Requested → Pledged
  Trigger: approvePledge()
  Conditions:
    - Security value sufficient
    - Security available
  Actions:
    - Update security status
    - Link security to loan

Pledged → Release Requested
  Trigger: requestRelease()
  Conditions:
    - Loan closed OR
    - Security no longer needed
  Actions:
    - Create release request

Release Requested → Released
  Trigger: approveRelease()
  Conditions:
    - Loan closed OR
    - Alternative security provided
  Actions:
    - Unlink security from loan
    - Update security status
```

---

## 4. Data Flow Diagrams

### 4.1 Loan Creation Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ createLoanRequest()
       ▼
┌─────────────────┐
│ Loan Service    │
│ - Validate      │
│ - Create Record │
└──────┬──────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Validation Service│
       │    │ - Check rules     │
       │    └───────────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Calculation Engine │
       │    │ - Calculate EMI    │
       │    │ - Generate Schedule│
       │    └───────────────────┘
       │
       └──► ┌──────────────────┐
            │ Database          │
            │ - Save Loan       │
            │ - Save Schedule   │
            └───────────────────┘
```

### 4.2 Repayment Processing Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ processRepayment()
       ▼
┌─────────────────┐
│ Repayment       │
│ Service         │
└──────┬──────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Calculation Engine│
       │    │ - Get amounts     │
       │    │ - Calculate due   │
       │    └───────────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Allocation Engine │
       │    │ - Allocate payment│
       │    │ - Update demands  │
       │    └───────────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Accounting Service│
       │    │ - Create GL entries│
       │    └───────────────────┘
       │
       └──► ┌──────────────────┐
            │ Database           │
            │ - Save repayment   │
            │ - Update loan      │
            │ - Update demands   │
            └───────────────────┘
```

### 4.3 Interest Accrual Flow (Daily Batch)

```
┌─────────────────┐
│ Scheduler       │
│ (Daily Job)     │
└──────┬──────────┘
       │ executeDailyAccrual()
       ▼
┌─────────────────┐
│ Accrual Service │
└──────┬──────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Get Active Loans  │
       │    │ (from Database)    │
       │    └───────────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ FOR EACH Loan:    │
       │    │ - Calculate       │
       │    │   Interest        │
       │    │ - Create Entry    │
       │    └───────────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ Accounting Service│
       │    │ - Create GL entries│
       │    └───────────────────┘
       │
       └──► ┌──────────────────┐
            │ Database           │
            │ - Save accruals    │
            │ - Update loan      │
            └───────────────────┘
```

---

## 5. Component Design

### 5.1 Loan Entity

```typescript
interface Loan {
  // Identity
  id: string;
  loan_number: string;
  company_id: string;
  
  // Applicant
  applicant_type: "Customer" | "Employee";
  applicant_id: string;
  
  // Product
  loan_product_id: string;
  
  // Amounts
  loan_amount: number;
  disbursed_amount: number;
  total_principal_paid: number;
  total_interest_paid: number;
  total_penalty_paid: number;
  excess_amount_paid: number;
  
  // Terms
  rate_of_interest: number;
  penalty_interest_rate: number;
  repayment_periods: number;
  repayment_frequency: string;
  repayment_method: string;
  repayment_start_date: Date;
  
  // Status
  status: LoanStatus;
  posting_date: Date;
  
  // Flags
  is_term_loan: boolean;
  is_secured_loan: boolean;
  
  // Dates
  disbursement_date: Date;
  closure_date: Date;
  
  // Relationships
  repayment_schedule_id: string;
  security_assignments: SecurityAssignment[];
  disbursements: Disbursement[];
  repayments: Repayment[];
}
```

### 5.2 Repayment Schedule Entity

```typescript
interface RepaymentSchedule {
  id: string;
  loan_id: string;
  schedule_type: string;
  number_of_rows: number;
  
  // Schedule entries
  entries: RepaymentScheduleEntry[];
}

interface RepaymentScheduleEntry {
  id: string;
  schedule_id: string;
  installment_number: number;
  payment_date: Date;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
  days: number;
  demand_generated: boolean;
  status: "Pending" | "Partially Paid" | "Completed";
}
```

### 5.3 Loan Demand Entity

```typescript
interface LoanDemand {
  id: string;
  loan_id: string;
  repayment_schedule_id: string;
  loan_disbursement_id: string;
  
  demand_date: Date;
  due_date: Date;
  
  demand_type: "Principal" | "Interest" | "Penalty" | "Charges";
  demand_subtype: string;
  
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  charges_amount: number;
  total_amount: number;
  
  paid_amount: number;
  outstanding_amount: number;
  
  status: "Unpaid" | "Partially Paid" | "Paid" | "Waived";
}
```

### 5.4 Interest Accrual Entity

```typescript
interface LoanInterestAccrual {
  id: string;
  loan_id: string;
  repayment_schedule_id: string;
  loan_disbursement_id: string;
  
  posting_date: Date;
  accrual_date: Date;
  
  principal_amount: number;
  interest_amount: number;
  days: number;
  
  interest_type: "Normal Interest" | "Additional Interest" | "Broken Period Interest";
  accrual_type: string;
  
  status: "Draft" | "Submitted";
}
```

---

## 6. Implementation Patterns

### 6.1 Repository Pattern

```typescript
interface LoanRepository {
  create(loan: Loan): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findByLoanNumber(loanNumber: string): Promise<Loan | null>;
  update(id: string, updates: Partial<Loan>): Promise<Loan>;
  delete(id: string): Promise<void>;
  find(filters: LoanFilters): Promise<Loan[]>;
  count(filters: LoanFilters): Promise<number>;
}
```

### 6.2 Service Layer Pattern

```typescript
class LoanService {
  constructor(
    private loanRepository: LoanRepository,
    private calculationEngine: CalculationEngine,
    private validator: LoanValidator,
    private accountingService: AccountingService
  ) {}
  
  async createLoan(data: CreateLoanDTO): Promise<Loan> {
    // 1. Validate
    await this.validator.validate(data);
    
    // 2. Calculate
    const calculations = await this.calculationEngine.calculateLoan(data);
    
    // 3. Create entity
    const loan = this.mapToLoan(data, calculations);
    
    // 4. Save
    return await this.loanRepository.create(loan);
  }
  
  async processRepayment(loanId: string, amount: number, date: Date): Promise<Repayment> {
    // 1. Get loan
    const loan = await this.loanRepository.findById(loanId);
    
    // 2. Calculate amounts
    const amounts = await this.calculationEngine.calculateRepaymentAmounts(loan, date);
    
    // 3. Allocate payment
    const allocations = await this.allocationEngine.allocate(amount, amounts.demands);
    
    // 4. Create repayment
    const repayment = this.createRepayment(loan, amount, allocations);
    
    // 5. Update loan
    await this.updateLoanAfterRepayment(loan, repayment);
    
    // 6. Create accounting entries
    await this.accountingService.createRepaymentEntries(repayment);
    
    return repayment;
  }
}
```

### 6.3 Strategy Pattern (for Calculation Methods)

```typescript
interface InterestCalculationStrategy {
  calculate(principal: number, rate: number, days: number, context: CalculationContext): number;
}

class SimpleInterestStrategy implements InterestCalculationStrategy {
  calculate(principal: number, rate: number, days: number, context: CalculationContext): number {
    const daysInYear = this.getDaysInYear(context.dayCountConvention, context.postingDate);
    return (principal * rate * days) / (daysInYear * 100);
  }
}

class CompoundInterestStrategy implements InterestCalculationStrategy {
  calculate(principal: number, rate: number, days: number, context: CalculationContext): number {
    // Compound interest calculation
  }
}

class CalculationEngine {
  constructor(private strategy: InterestCalculationStrategy) {}
  
  calculateInterest(principal: number, rate: number, days: number, context: CalculationContext): number {
    return this.strategy.calculate(principal, rate, days, context);
  }
}
```

### 6.4 State Machine Pattern

```typescript
class LoanStateMachine {
  private currentState: LoanStatus;
  private transitions: Map<LoanStatus, LoanStatus[]>;
  
  constructor(initialState: LoanStatus) {
    this.currentState = initialState;
    this.initializeTransitions();
  }
  
  canTransition(to: LoanStatus): boolean {
    const allowedStates = this.transitions.get(this.currentState);
    return allowedStates?.includes(to) ?? false;
  }
  
  transition(to: LoanStatus, context: TransitionContext): void {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid transition from ${this.currentState} to ${to}`);
    }
    
    // Execute transition actions
    this.executeTransitionActions(this.currentState, to, context);
    
    // Update state
    this.currentState = to;
  }
  
  private executeTransitionActions(from: LoanStatus, to: LoanStatus, context: TransitionContext): void {
    // Execute pre-transition validations
    // Execute transition actions
    // Execute post-transition actions
  }
}
```

### 6.5 Observer Pattern (for Events)

```typescript
interface LoanEventListener {
  onLoanCreated(loan: Loan): void;
  onLoanStatusChanged(loan: Loan, oldStatus: LoanStatus, newStatus: LoanStatus): void;
  onRepaymentProcessed(repayment: Repayment): void;
}

class LoanEventPublisher {
  private listeners: LoanEventListener[] = [];
  
  subscribe(listener: LoanEventListener): void {
    this.listeners.push(listener);
  }
  
  publishLoanCreated(loan: Loan): void {
    this.listeners.forEach(listener => listener.onLoanCreated(loan));
  }
  
  publishStatusChanged(loan: Loan, oldStatus: LoanStatus, newStatus: LoanStatus): void {
    this.listeners.forEach(listener => listener.onLoanStatusChanged(loan, oldStatus, newStatus));
  }
}
```

---

## 7. Sequence Diagrams

### 7.1 Loan Creation Sequence

```
User          LoanService    Validator    CalcEngine    Repository    Accounting
  │                │             │            │            │              │
  │ createLoan()   │             │            │            │              │
  ├───────────────►│             │            │            │              │
  │                │ validate()  │            │            │              │
  │                ├────────────►│            │            │              │
  │                │◄────────────┤            │            │              │
  │                │             │            │            │              │
  │                │ calculate() │            │            │              │
  │                ├─────────────────────────►│            │              │
  │                │◄─────────────────────────┤            │              │
  │                │             │            │            │              │
  │                │ create()    │            │            │              │
  │                ├──────────────────────────────────────►│              │
  │                │◄──────────────────────────────────────┤              │
  │                │             │            │            │              │
  │                │ createGLEntries()       │            │              │
  │                ├─────────────────────────────────────────────────────►│
  │                │◄─────────────────────────────────────────────────────┤
  │                │             │            │            │              │
  │◄───────────────┤             │            │            │              │
```

### 7.2 Repayment Processing Sequence

```
User          RepaymentService  CalcEngine    AllocationEngine  Repository    Accounting
  │                │                 │              │              │              │
  │ processRepayment()               │              │              │              │
  ├────────────────►│                 │              │              │              │
  │                │ getAmounts()    │              │              │              │
  │                ├─────────────────►│              │              │              │
  │                │◄─────────────────┤              │              │              │
  │                │                 │              │              │              │
  │                │ allocate()      │              │              │              │
  │                ├─────────────────────────────────►│              │              │
  │                │◄─────────────────────────────────┤              │              │
  │                │                 │              │              │              │
  │                │ save()          │              │              │              │
  │                ├─────────────────────────────────────────────────►│              │
  │                │◄─────────────────────────────────────────────────┤              │
  │                │                 │              │              │              │
  │                │ createGLEntries()               │              │              │
  │                ├─────────────────────────────────────────────────────────────►│
  │                │◄─────────────────────────────────────────────────────────────┤
  │                │                 │              │              │              │
  │◄────────────────┤                 │              │              │              │
```

---

## 8. Technical Requirements

### 8.1 Database Requirements

#### Tables Required
1. `loans` - Main loan table
2. `loan_products` - Loan product master
3. `loan_applications` - Loan applications
4. `loan_disbursements` - Disbursement records
5. `loan_repayments` - Repayment records
6. `loan_repayment_schedules` - Repayment schedules
7. `loan_repayment_schedule_entries` - Schedule entries
8. `loan_demands` - Loan demands
9. `loan_interest_accruals` - Interest accrual records
10. `loan_securities` - Security master
11. `loan_security_assignments` - Security assignments
12. `loan_security_pledges` - Pledge details

#### Indexes Required
- Primary keys on all tables
- Foreign keys for relationships
- Indexes on:
  - `loans.status`
  - `loans.applicant_id`
  - `loans.loan_product_id`
  - `loan_repayments.loan_id`
  - `loan_repayments.posting_date`
  - `loan_demands.loan_id`
  - `loan_demands.due_date`

### 8.2 API Requirements

#### RESTful Endpoints
- `POST /api/loans` - Create loan
- `GET /api/loans/:id` - Get loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan
- `POST /api/loans/:id/submit` - Submit loan
- `POST /api/loans/:id/disbursements` - Create disbursement
- `POST /api/loans/:id/repayments` - Process repayment
- `GET /api/loans/:id/outstanding` - Get outstanding amounts
- `GET /api/loans/:id/schedule` - Get repayment schedule

### 8.3 Performance Requirements

#### Response Times
- Loan creation: < 2 seconds
- Repayment processing: < 1 second
- Outstanding calculation: < 500ms
- Report generation: < 5 seconds

#### Throughput
- Support 1000+ concurrent users
- Process 10,000+ repayments per hour
- Handle 100,000+ loans in system

### 8.4 Security Requirements

#### Authentication
- JWT-based authentication
- Role-based access control
- API key support for integrations

#### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Audit trail for all financial transactions
- Data backup and recovery

### 8.5 Integration Requirements

#### Accounting System
- Generate GL entries
- Support double-entry bookkeeping
- Integration with ERPNext or similar

#### Payment Gateway
- Support multiple payment gateways
- Handle payment callbacks
- Reconcile payments

#### Notification System
- Email notifications
- SMS notifications
- In-app notifications

---

## 9. Implementation Checklist

### Phase 1: Core Entities
- [ ] Loan entity and repository
- [ ] Loan Product entity
- [ ] Repayment Schedule entity
- [ ] Demand entity
- [ ] Interest Accrual entity

### Phase 2: Calculation Engine
- [ ] EMI calculation
- [ ] Interest calculation
- [ ] Penalty calculation
- [ ] Outstanding calculation
- [ ] Schedule generation

### Phase 3: Core Services
- [ ] Loan Service
- [ ] Repayment Service
- [ ] Disbursement Service
- [ ] Interest Accrual Service
- [ ] Demand Generation Service

### Phase 4: State Management
- [ ] Loan state machine
- [ ] Application state machine
- [ ] Security assignment state machine

### Phase 5: Batch Processing
- [ ] Daily interest accrual job
- [ ] Daily demand generation job
- [ ] Security shortfall check job
- [ ] Loan classification job

### Phase 6: API Layer
- [ ] REST API endpoints
- [ ] Authentication middleware
- [ ] Validation middleware
- [ ] Error handling

### Phase 7: Accounting Integration
- [ ] GL entry generation
- [ ] Double-entry bookkeeping
- [ ] Account mapping

### Phase 8: Reporting
- [ ] Outstanding reports
- [ ] Cashflow reports
- [ ] Security reports
- [ ] Dashboard charts

---

## 10. Testing Requirements

### Unit Tests
- Calculation functions
- State machine transitions
- Validation rules
- Business logic

### Integration Tests
- API endpoints
- Database operations
- External integrations
- Batch jobs

### Performance Tests
- Load testing
- Stress testing
- Concurrent user testing

---

## Conclusion

This technical specification provides a comprehensive guide for rebuilding the Frappe Lending platform in any programming language. The key is to:

1. **Understand the business logic** - Loans, repayments, interest, penalties
2. **Implement accurate calculations** - EMI, interest, penalties
3. **Manage state correctly** - Loan lifecycle, status transitions
4. **Handle batch processing** - Daily accruals, demand generation
5. **Integrate with accounting** - GL entries, double-entry bookkeeping
6. **Ensure data integrity** - Validations, constraints, audit trails

The architecture and patterns described here are language-agnostic and can be implemented in Node.js, Java, Python, .NET, Go, or any other modern programming language.

