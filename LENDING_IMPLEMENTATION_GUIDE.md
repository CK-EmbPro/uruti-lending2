# Frappe Lending - Implementation Guide with Code Examples

## Overview
This guide provides practical implementation examples in multiple programming languages to help developers rebuild the Frappe Lending platform. It includes code snippets, data structures, and implementation patterns.

---

## Table of Contents

1. [Core Data Structures](#1-core-data-structures)
2. [Calculation Functions](#2-calculation-functions)
3. [State Machine Implementation](#3-state-machine-implementation)
4. [Service Layer Examples](#4-service-layer-examples)
5. [Database Schema](#5-database-schema)
6. [API Implementation](#6-api-implementation)
7. [Batch Processing](#7-batch-processing)

---

## 1. Core Data Structures

### 1.1 TypeScript/JavaScript

```typescript
// Loan Entity
interface Loan {
  id: string;
  loanNumber: string;
  companyId: string;
  applicantType: 'Customer' | 'Employee';
  applicantId: string;
  loanProductId: string;
  loanAmount: number;
  disbursedAmount: number;
  rateOfInterest: number;
  penaltyInterestRate: number;
  repaymentPeriods: number;
  repaymentFrequency: 'Monthly' | 'Bi-Weekly' | 'Weekly' | 'Daily' | 'Quarterly';
  repaymentMethod: 'Repay Over Number of Periods' | 'Repay Fixed Amount per Period';
  repaymentStartDate: Date;
  status: LoanStatus;
  isTermLoan: boolean;
  isSecuredLoan: boolean;
  postingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

type LoanStatus = 
  | 'Draft' 
  | 'Sanctioned' 
  | 'Partially Disbursed' 
  | 'Disbursed' 
  | 'Active' 
  | 'Loan Closure Requested' 
  | 'Closed' 
  | 'Written Off' 
  | 'Settled';

// Repayment Schedule Entry
interface RepaymentScheduleEntry {
  id: string;
  scheduleId: string;
  installmentNumber: number;
  paymentDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  balanceLoanAmount: number;
  days: number;
  demandGenerated: boolean;
  status: 'Pending' | 'Partially Paid' | 'Completed';
}

// Loan Demand
interface LoanDemand {
  id: string;
  loanId: string;
  repaymentScheduleId?: string;
  demandDate: Date;
  dueDate: Date;
  demandType: 'Principal' | 'Interest' | 'Penalty' | 'Charges';
  demandSubtype: string;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Waived';
}
```

### 1.2 Python

```python
from dataclasses import dataclass
from datetime import date
from enum import Enum
from typing import Optional

class LoanStatus(Enum):
    DRAFT = "Draft"
    SANCTIONED = "Sanctioned"
    PARTIALLY_DISBURSED = "Partially Disbursed"
    DISBURSED = "Disbursed"
    ACTIVE = "Active"
    LOAN_CLOSURE_REQUESTED = "Loan Closure Requested"
    CLOSED = "Closed"
    WRITTEN_OFF = "Written Off"
    SETTLED = "Settled"

class ApplicantType(Enum):
    CUSTOMER = "Customer"
    EMPLOYEE = "Employee"

@dataclass
class Loan:
    id: str
    loan_number: str
    company_id: str
    applicant_type: ApplicantType
    applicant_id: str
    loan_product_id: str
    loan_amount: float
    disbursed_amount: float
    rate_of_interest: float
    penalty_interest_rate: float
    repayment_periods: int
    repayment_frequency: str
    repayment_method: str
    repayment_start_date: date
    status: LoanStatus
    is_term_loan: bool
    is_secured_loan: bool
    posting_date: date
    created_at: date
    updated_at: date

@dataclass
class RepaymentScheduleEntry:
    id: str
    schedule_id: str
    installment_number: int
    payment_date: date
    principal_amount: float
    interest_amount: float
    total_payment: float
    balance_loan_amount: float
    days: int
    demand_generated: bool
    status: str
```

### 1.3 Java

```java
package com.lending.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Loan {
    private String id;
    private String loanNumber;
    private String companyId;
    private ApplicantType applicantType;
    private String applicantId;
    private String loanProductId;
    private BigDecimal loanAmount;
    private BigDecimal disbursedAmount;
    private BigDecimal rateOfInterest;
    private BigDecimal penaltyInterestRate;
    private Integer repaymentPeriods;
    private RepaymentFrequency repaymentFrequency;
    private RepaymentMethod repaymentMethod;
    private LocalDate repaymentStartDate;
    private LoanStatus status;
    private Boolean isTermLoan;
    private Boolean isSecuredLoan;
    private LocalDate postingDate;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    
    // Getters and setters
}

public enum LoanStatus {
    DRAFT, SANCTIONED, PARTIALLY_DISBURSED, DISBURSED, 
    ACTIVE, LOAN_CLOSURE_REQUESTED, CLOSED, WRITTEN_OFF, SETTLED
}

public enum RepaymentFrequency {
    MONTHLY, BI_WEEKLY, WEEKLY, DAILY, QUARTERLY
}
```

---

## 2. Calculation Functions

### 2.1 EMI Calculation

#### TypeScript/JavaScript
```typescript
function calculateEMI(
  principal: number,
  annualRate: number,
  periods: number,
  frequency: string
): number {
  if (frequency === 'One Time') {
    periods = 1;
  }
  
  if (annualRate > 0) {
    const frequencyMultiplier = getFrequencyMultiplier(frequency);
    const periodicRate = annualRate / (frequencyMultiplier * 100);
    
    const numerator = principal * periodicRate * Math.pow(1 + periodicRate, periods);
    const denominator = Math.pow(1 + periodicRate, periods) - 1;
    
    return Math.ceil(numerator / denominator);
  } else {
    return Math.ceil(principal / periods);
  }
}

function getFrequencyMultiplier(frequency: string): number {
  const multipliers: Record<string, number> = {
    'Monthly': 12,
    'Bi-Weekly': 26,
    'Weekly': 52,
    'Daily': 365,
    'Quarterly': 4,
    'One Time': 1
  };
  return multipliers[frequency] || 12;
}
```

#### Python
```python
import math
from typing import Literal

def calculate_emi(
    principal: float,
    annual_rate: float,
    periods: int,
    frequency: str
) -> float:
    if frequency == 'One Time':
        periods = 1
    
    if annual_rate > 0:
        frequency_multiplier = get_frequency_multiplier(frequency)
        periodic_rate = annual_rate / (frequency_multiplier * 100)
        
        numerator = principal * periodic_rate * (1 + periodic_rate) ** periods
        denominator = (1 + periodic_rate) ** periods - 1
        
        return math.ceil(numerator / denominator)
    else:
        return math.ceil(principal / periods)

def get_frequency_multiplier(frequency: str) -> int:
    multipliers = {
        'Monthly': 12,
        'Bi-Weekly': 26,
        'Weekly': 52,
        'Daily': 365,
        'Quarterly': 4,
        'One Time': 1
    }
    return multipliers.get(frequency, 12)
```

#### Java
```java
import java.math.BigDecimal;
import java.math.RoundingMode;

public class CalculationEngine {
    public static BigDecimal calculateEMI(
        BigDecimal principal,
        BigDecimal annualRate,
        int periods,
        String frequency
    ) {
        if ("One Time".equals(frequency)) {
            periods = 1;
        }
        
        if (annualRate.compareTo(BigDecimal.ZERO) > 0) {
            int frequencyMultiplier = getFrequencyMultiplier(frequency);
            BigDecimal periodicRate = annualRate.divide(
                BigDecimal.valueOf(frequencyMultiplier * 100),
                10,
                RoundingMode.HALF_UP
            );
            
            BigDecimal onePlusRate = BigDecimal.ONE.add(periodicRate);
            BigDecimal numerator = principal
                .multiply(periodicRate)
                .multiply(onePlusRate.pow(periods));
            BigDecimal denominator = onePlusRate.pow(periods).subtract(BigDecimal.ONE);
            
            return numerator.divide(denominator, 2, RoundingMode.CEILING);
        } else {
            return principal.divide(
                BigDecimal.valueOf(periods),
                2,
                RoundingMode.CEILING
            );
        }
    }
    
    private static int getFrequencyMultiplier(String frequency) {
        switch (frequency) {
            case "Monthly": return 12;
            case "Bi-Weekly": return 26;
            case "Weekly": return 52;
            case "Daily": return 365;
            case "Quarterly": return 4;
            case "One Time": return 1;
            default: return 12;
        }
    }
}
```

### 2.2 Interest Calculation

#### TypeScript/JavaScript
```typescript
function calculateInterest(
  principal: number,
  annualRate: number,
  days: number,
  dayCountConvention: string,
  postingDate: Date
): number {
  const daysInYear = getDaysInYear(dayCountConvention, postingDate);
  const interest = (principal * annualRate * days) / (daysInYear * 100);
  return roundToPrecision(interest, 2);
}

function getDaysInYear(convention: string, date: Date): number {
  switch (convention) {
    case 'Actual/365':
      return 365;
    case 'Actual/360':
      return 360;
    case 'Actual/Actual':
      return isLeapYear(date.getFullYear()) ? 366 : 365;
    case '30/360':
      return 360;
    default:
      return 365;
  }
}

function roundToPrecision(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}
```

#### Python
```python
from datetime import date
import calendar

def calculate_interest(
    principal: float,
    annual_rate: float,
    days: int,
    day_count_convention: str,
    posting_date: date
) -> float:
    days_in_year = get_days_in_year(day_count_convention, posting_date)
    interest = (principal * annual_rate * days) / (days_in_year * 100)
    return round(interest, 2)

def get_days_in_year(convention: str, posting_date: date) -> int:
    if convention == 'Actual/365':
        return 365
    elif convention == 'Actual/360':
        return 360
    elif convention == 'Actual/Actual':
        return 366 if calendar.isleap(posting_date.year) else 365
    elif convention == '30/360':
        return 360
    else:
        return 365
```

### 2.3 Repayment Schedule Generation

#### TypeScript/JavaScript
```typescript
function generateRepaymentSchedule(loan: Loan): RepaymentScheduleEntry[] {
  const schedule: RepaymentScheduleEntry[] = [];
  let balance = loan.disbursedAmount;
  const emi = calculateEMI(
    loan.loanAmount,
    loan.rateOfInterest,
    loan.repaymentPeriods,
    loan.repaymentFrequency
  );
  
  let paymentDate = new Date(loan.repaymentStartDate);
  let previousInterestAmount = 0;
  let carryForwardInterest = 0;
  
  for (let i = 1; i <= loan.repaymentPeriods; i++) {
    const days = calculateDaysInPeriod(paymentDate, loan.repaymentFrequency);
    
    // Calculate interest
    let interest = calculateInterest(
      balance,
      loan.rateOfInterest,
      days,
      'Actual/365',
      paymentDate
    );
    
    // Add carry forward interest
    if (carryForwardInterest > 0) {
      interest += carryForwardInterest;
      carryForwardInterest = 0;
    }
    
    // Add previous period's excess interest
    if (previousInterestAmount > 0) {
      interest += previousInterestAmount;
      previousInterestAmount = 0;
    }
    
    // Calculate principal
    let principal = emi - interest;
    
    // Handle case where interest exceeds EMI
    if (interest > emi) {
      previousInterestAmount = interest - emi;
      interest = emi;
      principal = 0;
    }
    
    // Update balance
    balance = balance + interest - emi;
    
    // Handle negative balance
    if (balance < 0) {
      principal += balance;
      balance = 0;
    }
    
    schedule.push({
      id: generateId(),
      scheduleId: loan.id,
      installmentNumber: i,
      paymentDate: new Date(paymentDate),
      principalAmount: roundToPrecision(principal, 2),
      interestAmount: roundToPrecision(interest, 2),
      totalPayment: roundToPrecision(principal + interest, 2),
      balanceLoanAmount: roundToPrecision(balance, 2),
      days: days,
      demandGenerated: false,
      status: 'Pending'
    });
    
    // Move to next payment date
    paymentDate = getNextPaymentDate(paymentDate, loan.repaymentFrequency);
  }
  
  return schedule;
}
```

---

## 3. State Machine Implementation

### 3.1 TypeScript/JavaScript

```typescript
class LoanStateMachine {
  private currentState: LoanStatus;
  private transitions: Map<LoanStatus, LoanStatus[]>;
  
  constructor(initialState: LoanStatus) {
    this.currentState = initialState;
    this.initializeTransitions();
  }
  
  private initializeTransitions(): void {
    this.transitions = new Map([
      ['Draft', ['Sanctioned']],
      ['Sanctioned', ['Partially Disbursed', 'Disbursed']],
      ['Partially Disbursed', ['Partially Disbursed', 'Disbursed']],
      ['Disbursed', ['Active']],
      ['Active', ['Loan Closure Requested', 'Written Off', 'Settled']],
      ['Loan Closure Requested', ['Closed']]
    ]);
  }
  
  canTransition(to: LoanStatus): boolean {
    const allowedStates = this.transitions.get(this.currentState);
    return allowedStates?.includes(to) ?? false;
  }
  
  transition(to: LoanStatus, context: TransitionContext): void {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition from ${this.currentState} to ${to}`
      );
    }
    
    this.executeTransitionActions(this.currentState, to, context);
    this.currentState = to;
  }
  
  private executeTransitionActions(
    from: LoanStatus,
    to: LoanStatus,
    context: TransitionContext
  ): void {
    // Execute pre-transition validations
    this.validateTransition(from, to, context);
    
    // Execute transition-specific actions
    switch (`${from}->${to}`) {
      case 'Draft->Sanctioned':
        this.onSanction(context);
        break;
      case 'Sanctioned->Disbursed':
        this.onDisburse(context);
        break;
      case 'Disbursed->Active':
        this.onActivate(context);
        break;
      // ... other transitions
    }
  }
  
  getCurrentState(): LoanStatus {
    return this.currentState;
  }
}
```

### 3.2 Python

```python
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass

class LoanStatus(Enum):
    DRAFT = "Draft"
    SANCTIONED = "Sanctioned"
    PARTIALLY_DISBURSED = "Partially Disbursed"
    DISBURSED = "Disbursed"
    ACTIVE = "Active"
    LOAN_CLOSURE_REQUESTED = "Loan Closure Requested"
    CLOSED = "Closed"
    WRITTEN_OFF = "Written Off"
    SETTLED = "Settled"

@dataclass
class TransitionContext:
    loan_id: str
    user_id: str
    timestamp: str
    metadata: Dict

class LoanStateMachine:
    def __init__(self, initial_state: LoanStatus):
        self.current_state = initial_state
        self.transitions = self._initialize_transitions()
    
    def _initialize_transitions(self) -> Dict[LoanStatus, List[LoanStatus]]:
        return {
            LoanStatus.DRAFT: [LoanStatus.SANCTIONED],
            LoanStatus.SANCTIONED: [
                LoanStatus.PARTIALLY_DISBURSED,
                LoanStatus.DISBURSED
            ],
            LoanStatus.PARTIALLY_DISBURSED: [
                LoanStatus.PARTIALLY_DISBURSED,
                LoanStatus.DISBURSED
            ],
            LoanStatus.DISBURSED: [LoanStatus.ACTIVE],
            LoanStatus.ACTIVE: [
                LoanStatus.LOAN_CLOSURE_REQUESTED,
                LoanStatus.WRITTEN_OFF,
                LoanStatus.SETTLED
            ],
            LoanStatus.LOAN_CLOSURE_REQUESTED: [LoanStatus.CLOSED]
        }
    
    def can_transition(self, to_state: LoanStatus) -> bool:
        allowed_states = self.transitions.get(self.current_state, [])
        return to_state in allowed_states
    
    def transition(self, to_state: LoanStatus, context: TransitionContext):
        if not self.can_transition(to_state):
            raise ValueError(
                f"Invalid transition from {self.current_state} to {to_state}"
            )
        
        self._execute_transition_actions(self.current_state, to_state, context)
        self.current_state = to_state
    
    def _execute_transition_actions(
        self,
        from_state: LoanStatus,
        to_state: LoanStatus,
        context: TransitionContext
    ):
        # Validate transition
        self._validate_transition(from_state, to_state, context)
        
        # Execute transition-specific actions
        transition_key = f"{from_state.value}->{to_state.value}"
        if transition_key == "Draft->Sanctioned":
            self._on_sanction(context)
        elif transition_key == "Sanctioned->Disbursed":
            self._on_disburse(context)
        # ... other transitions
```

---

## 4. Service Layer Examples

### 4.1 TypeScript/JavaScript

```typescript
class LoanService {
  constructor(
    private loanRepository: LoanRepository,
    private calculationEngine: CalculationEngine,
    private validator: LoanValidator,
    private accountingService: AccountingService,
    private eventPublisher: EventPublisher
  ) {}
  
  async createLoan(data: CreateLoanDTO): Promise<Loan> {
    // 1. Validate
    await this.validator.validate(data);
    
    // 2. Calculate EMI and schedule
    const emi = this.calculationEngine.calculateEMI(
      data.loanAmount,
      data.rateOfInterest,
      data.repaymentPeriods,
      data.repaymentFrequency
    );
    
    const schedule = this.calculationEngine.generateRepaymentSchedule({
      ...data,
      disbursedAmount: 0 // Will be updated on disbursement
    });
    
    // 3. Create loan entity
    const loan: Loan = {
      id: generateId(),
      loanNumber: await this.generateLoanNumber(),
      ...data,
      status: 'Draft',
      disbursedAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 4. Save to database
    const savedLoan = await this.loanRepository.create(loan);
    
    // 5. Save repayment schedule
    await this.saveRepaymentSchedule(savedLoan.id, schedule);
    
    // 6. Publish event
    await this.eventPublisher.publish('loan.created', savedLoan);
    
    return savedLoan;
  }
  
  async processRepayment(
    loanId: string,
    amount: number,
    postingDate: Date
  ): Promise<Repayment> {
    // 1. Get loan
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    // 2. Calculate amounts due
    const amounts = await this.calculationEngine.calculateRepaymentAmounts(
      loan,
      postingDate
    );
    
    // 3. Allocate payment
    const allocations = await this.allocationEngine.allocate(
      amount,
      amounts.demands,
      amounts.allocationOrder
    );
    
    // 4. Create repayment record
    const repayment: Repayment = {
      id: generateId(),
      loanId: loan.id,
      postingDate: postingDate,
      amountPaid: amount,
      principalPaid: allocations.principal,
      interestPaid: allocations.interest,
      penaltyPaid: allocations.penalty,
      chargesPaid: allocations.charges,
      excessAmount: allocations.excess,
      status: 'Draft',
      createdAt: new Date()
    };
    
    // 5. Update loan
    loan.totalPrincipalPaid += allocations.principal;
    loan.totalInterestPaid += allocations.interest;
    loan.totalPenaltyPaid += allocations.penalty;
    loan.excessAmountPaid += allocations.excess;
    
    // Update status if needed
    if (loan.status === 'Disbursed') {
      loan.status = 'Active';
    }
    
    // 6. Save repayment and update loan
    await this.repaymentRepository.create(repayment);
    await this.loanRepository.update(loan.id, loan);
    
    // 7. Update demands
    await this.updateDemands(allocations);
    
    // 8. Create accounting entries
    await this.accountingService.createRepaymentEntries(repayment);
    
    // 9. Publish event
    await this.eventPublisher.publish('repayment.processed', repayment);
    
    return repayment;
  }
}
```

### 4.2 Python

```python
from typing import Optional
from datetime import date

class LoanService:
    def __init__(
        self,
        loan_repository: LoanRepository,
        calculation_engine: CalculationEngine,
        validator: LoanValidator,
        accounting_service: AccountingService,
        event_publisher: EventPublisher
    ):
        self.loan_repository = loan_repository
        self.calculation_engine = calculation_engine
        self.validator = validator
        self.accounting_service = accounting_service
        self.event_publisher = event_publisher
    
    async def create_loan(self, data: CreateLoanDTO) -> Loan:
        # 1. Validate
        await self.validator.validate(data)
        
        # 2. Calculate EMI
        emi = self.calculation_engine.calculate_emi(
            data.loan_amount,
            data.rate_of_interest,
            data.repayment_periods,
            data.repayment_frequency
        )
        
        # 3. Create loan entity
        loan = Loan(
            id=generate_id(),
            loan_number=await self.generate_loan_number(),
            **data,
            status=LoanStatus.DRAFT,
            disbursed_amount=0.0,
            created_at=date.today(),
            updated_at=date.today()
        )
        
        # 4. Save to database
        saved_loan = await self.loan_repository.create(loan)
        
        # 5. Generate and save repayment schedule
        if loan.is_term_loan:
            schedule = self.calculation_engine.generate_repayment_schedule(loan)
            await self.save_repayment_schedule(saved_loan.id, schedule)
        
        # 6. Publish event
        await self.event_publisher.publish('loan.created', saved_loan)
        
        return saved_loan
    
    async def process_repayment(
        self,
        loan_id: str,
        amount: float,
        posting_date: date
    ) -> Repayment:
        # 1. Get loan
        loan = await self.loan_repository.find_by_id(loan_id)
        if not loan:
            raise ValueError('Loan not found')
        
        # 2. Calculate amounts due
        amounts = await self.calculation_engine.calculate_repayment_amounts(
            loan,
            posting_date
        )
        
        # 3. Allocate payment
        allocations = await self.allocation_engine.allocate(
            amount,
            amounts.demands,
            amounts.allocation_order
        )
        
        # 4. Create repayment record
        repayment = Repayment(
            id=generate_id(),
            loan_id=loan.id,
            posting_date=posting_date,
            amount_paid=amount,
            principal_paid=allocations.principal,
            interest_paid=allocations.interest,
            penalty_paid=allocations.penalty,
            charges_paid=allocations.charges,
            excess_amount=allocations.excess,
            status='Draft',
            created_at=date.today()
        )
        
        # 5. Update loan
        loan.total_principal_paid += allocations.principal
        loan.total_interest_paid += allocations.interest
        loan.total_penalty_paid += allocations.penalty
        loan.excess_amount_paid += allocations.excess
        
        if loan.status == LoanStatus.DISBURSED:
            loan.status = LoanStatus.ACTIVE
        
        # 6. Save
        await self.repayment_repository.create(repayment)
        await self.loan_repository.update(loan.id, loan)
        
        # 7. Update demands
        await self.update_demands(allocations)
        
        # 8. Create accounting entries
        await self.accounting_service.create_repayment_entries(repayment)
        
        # 9. Publish event
        await self.event_publisher.publish('repayment.processed', repayment)
        
        return repayment
```

---

## 5. Database Schema

### 5.1 SQL Schema (PostgreSQL/MySQL)

```sql
-- Loans Table
CREATE TABLE loans (
    id VARCHAR(50) PRIMARY KEY,
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    applicant_type ENUM('Customer', 'Employee') NOT NULL,
    applicant_id VARCHAR(50) NOT NULL,
    loan_product_id VARCHAR(50) NOT NULL,
    loan_amount DECIMAL(15, 2) NOT NULL,
    disbursed_amount DECIMAL(15, 2) DEFAULT 0,
    rate_of_interest DECIMAL(5, 2) NOT NULL,
    penalty_interest_rate DECIMAL(5, 2) DEFAULT 0,
    repayment_periods INT NOT NULL,
    repayment_frequency VARCHAR(20) NOT NULL,
    repayment_method VARCHAR(50) NOT NULL,
    repayment_start_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    is_term_loan BOOLEAN DEFAULT FALSE,
    is_secured_loan BOOLEAN DEFAULT FALSE,
    posting_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_applicant (applicant_id),
    INDEX idx_loan_product (loan_product_id),
    INDEX idx_posting_date (posting_date)
);

-- Repayment Schedules Table
CREATE TABLE repayment_schedules (
    id VARCHAR(50) PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    schedule_type VARCHAR(50) NOT NULL,
    number_of_rows INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id)
);

-- Repayment Schedule Entries Table
CREATE TABLE repayment_schedule_entries (
    id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    installment_number INT NOT NULL,
    payment_date DATE NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_amount DECIMAL(15, 2) NOT NULL,
    total_payment DECIMAL(15, 2) NOT NULL,
    balance_loan_amount DECIMAL(15, 2) NOT NULL,
    days INT NOT NULL,
    demand_generated BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id) ON DELETE CASCADE,
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_payment_date (payment_date)
);

-- Loan Demands Table
CREATE TABLE loan_demands (
    id VARCHAR(50) PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    repayment_schedule_id VARCHAR(50),
    demand_date DATE NOT NULL,
    due_date DATE NOT NULL,
    demand_type VARCHAR(20) NOT NULL,
    demand_subtype VARCHAR(50),
    principal_amount DECIMAL(15, 2) DEFAULT 0,
    interest_amount DECIMAL(15, 2) DEFAULT 0,
    penalty_amount DECIMAL(15, 2) DEFAULT 0,
    charges_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    outstanding_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- Loan Interest Accruals Table
CREATE TABLE loan_interest_accruals (
    id VARCHAR(50) PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    repayment_schedule_id VARCHAR(50),
    posting_date DATE NOT NULL,
    accrual_date DATE NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_amount DECIMAL(15, 2) NOT NULL,
    days INT NOT NULL,
    interest_type VARCHAR(50) NOT NULL,
    accrual_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_posting_date (posting_date)
);

-- Loan Repayments Table
CREATE TABLE loan_repayments (
    id VARCHAR(50) PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    posting_date DATE NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    principal_paid DECIMAL(15, 2) DEFAULT 0,
    interest_paid DECIMAL(15, 2) DEFAULT 0,
    penalty_paid DECIMAL(15, 2) DEFAULT 0,
    charges_paid DECIMAL(15, 2) DEFAULT 0,
    excess_amount DECIMAL(15, 2) DEFAULT 0,
    repayment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_posting_date (posting_date)
);
```

---

## 6. API Implementation

### 6.1 REST API (Node.js/Express)

```typescript
import express from 'express';
import { LoanService } from './services/LoanService';

const router = express.Router();

// Create loan
router.post('/loans', async (req, res) => {
  try {
    const loan = await loanService.createLoan(req.body);
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get loan
router.get('/loans/:id', async (req, res) => {
  try {
    const loan = await loanService.getLoan(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process repayment
router.post('/loans/:id/repayments', async (req, res) => {
  try {
    const { amount, postingDate } = req.body;
    const repayment = await loanService.processRepayment(
      req.params.id,
      amount,
      new Date(postingDate)
    );
    res.status(201).json(repayment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get outstanding amounts
router.get('/loans/:id/outstanding', async (req, res) => {
  try {
    const asOfDate = req.query.asOfDate 
      ? new Date(req.query.asOfDate as string)
      : new Date();
    const outstanding = await loanService.getOutstanding(
      req.params.id,
      asOfDate
    );
    res.json(outstanding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 6.2 Python (Flask/FastAPI)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date

app = FastAPI()

class CreateLoanDTO(BaseModel):
    company_id: str
    applicant_type: str
    applicant_id: str
    loan_product_id: str
    loan_amount: float
    rate_of_interest: float
    repayment_periods: int
    repayment_frequency: str
    repayment_method: str
    repayment_start_date: date

@app.post("/loans")
async def create_loan(data: CreateLoanDTO):
    try:
        loan = await loan_service.create_loan(data.dict())
        return loan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/loans/{loan_id}")
async def get_loan(loan_id: str):
    loan = await loan_service.get_loan(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

@app.post("/loans/{loan_id}/repayments")
async def process_repayment(loan_id: str, amount: float, posting_date: date):
    try:
        repayment = await loan_service.process_repayment(
            loan_id,
            amount,
            posting_date
        )
        return repayment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 7. Batch Processing

### 7.1 Daily Interest Accrual Job

#### TypeScript/JavaScript
```typescript
class InterestAccrualJob {
  constructor(
    private loanRepository: LoanRepository,
    private accrualService: InterestAccrualService
  ) {}
  
  async execute(postingDate: Date): Promise<void> {
    // Get all active loans
    const activeLoans = await this.loanRepository.find({
      status: 'Active',
      isTermLoan: true // or false for LOC
    });
    
    for (const loan of activeLoans) {
      try {
        if (loan.isTermLoan) {
          await this.accrualService.accrueInterestTermLoan(loan, postingDate);
        } else {
          await this.accrualService.accrueInterestLOC(loan, postingDate);
        }
      } catch (error) {
        console.error(`Failed to accrue interest for loan ${loan.id}:`, error);
        // Log error but continue with other loans
      }
    }
  }
}

// Schedule job (using node-cron)
import cron from 'node-cron';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const job = new InterestAccrualJob(loanRepository, accrualService);
  await job.execute(new Date());
});
```

#### Python
```python
from datetime import date
from apscheduler.schedulers.blocking import BlockingScheduler

class InterestAccrualJob:
    def __init__(
        self,
        loan_repository: LoanRepository,
        accrual_service: InterestAccrualService
    ):
        self.loan_repository = loan_repository
        self.accrual_service = accrual_service
    
    async def execute(self, posting_date: date):
        # Get all active loans
        active_loans = await self.loan_repository.find({
            'status': 'Active'
        })
        
        for loan in active_loans:
            try:
                if loan.is_term_loan:
                    await self.accrual_service.accrue_interest_term_loan(
                        loan,
                        posting_date
                    )
                else:
                    await self.accrual_service.accrue_interest_loc(
                        loan,
                        posting_date
                    )
            except Exception as e:
                print(f"Failed to accrue interest for loan {loan.id}: {e}")
                # Log error but continue

# Schedule job
scheduler = BlockingScheduler()

# Run daily at 2 AM
scheduler.add_job(
    execute_daily_accrual,
    'cron',
    hour=2,
    minute=0
)

scheduler.start()
```

---

## Conclusion

This implementation guide provides practical code examples in multiple languages to help developers rebuild the Frappe Lending platform. The examples cover:

1. **Data Structures** - Entity definitions in TypeScript, Python, and Java
2. **Calculation Functions** - EMI, interest, penalty calculations
3. **State Machines** - Loan status management
4. **Service Layer** - Business logic implementation
5. **Database Schema** - SQL table definitions
6. **API Implementation** - REST API examples
7. **Batch Processing** - Scheduled job examples

These examples can be adapted to any programming language or framework. The key is to maintain the business logic and calculation accuracy while using the patterns and structures that fit your technology stack.

