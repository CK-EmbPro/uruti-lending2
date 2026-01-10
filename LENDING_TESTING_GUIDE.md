# Frappe Lending - Testing Guide

## Overview
This guide provides comprehensive testing strategies, test cases, test data, and implementation examples for the Frappe Lending platform. It covers unit tests, integration tests, performance tests, and test automation.

---

## Table of Contents

1. [Testing Strategy](#1-testing-strategy)
2. [Test Data Setup](#2-test-data-setup)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [Calculation Tests](#5-calculation-tests)
6. [State Machine Tests](#6-state-machine-tests)
7. [API Tests](#7-api-tests)
8. [Batch Job Tests](#8-batch-job-tests)
9. [Performance Tests](#9-performance-tests)
10. [Test Automation](#10-test-automation)

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests  │  (10%)
                    │  (Few, Slow) │
                    └─────────────┘
                  ┌─────────────────┐
                  │ Integration     │  (30%)
                  │ Tests           │
                  │ (More, Medium)  │
                  └─────────────────┘
              ┌───────────────────────┐
              │    Unit Tests          │  (60%)
              │  (Many, Fast)          │
              └───────────────────────┘
```

### 1.2 Test Categories

1. **Unit Tests** - Test individual functions/classes in isolation
2. **Integration Tests** - Test component interactions
3. **Calculation Tests** - Verify financial calculations accuracy
4. **State Machine Tests** - Test state transitions
5. **API Tests** - Test REST endpoints
6. **Batch Job Tests** - Test scheduled jobs
7. **Performance Tests** - Test system performance
8. **End-to-End Tests** - Test complete workflows

### 1.3 Testing Principles

- **Test Independence**: Each test should be independent
- **Test Isolation**: Tests should not affect each other
- **Test Data**: Use fixtures and factories for test data
- **Test Coverage**: Aim for 80%+ code coverage
- **Test Speed**: Unit tests should be fast (< 100ms each)
- **Test Clarity**: Tests should be readable and self-documenting

---

## 2. Test Data Setup

### 2.1 Test Fixtures

#### TypeScript/JavaScript

```typescript
// test/fixtures/loanFixtures.ts
export const createTestLoanProduct = (overrides = {}) => ({
  productCode: 'TEST-PL-001',
  productName: 'Test Personal Loan',
  companyId: 'TEST-COMPANY',
  rateOfInterest: 12.5,
  penaltyInterestRate: 2.0,
  maximumLoanAmount: 1000000,
  isTermLoan: true,
  repaymentScheduleType: 'Monthly as per repayment start date',
  ...overrides
});

export const createTestLoan = (overrides = {}) => ({
  loanNumber: 'LOAN-001',
  companyId: 'TEST-COMPANY',
  applicantType: 'Customer',
  applicantId: 'CUST-001',
  loanProductId: 'TEST-PL-001',
  loanAmount: 100000,
  rateOfInterest: 12.5,
  repaymentPeriods: 12,
  repaymentFrequency: 'Monthly',
  repaymentMethod: 'Repay Over Number of Periods',
  repaymentStartDate: new Date('2024-01-15'),
  status: 'Draft',
  isTermLoan: true,
  isSecuredLoan: false,
  postingDate: new Date('2024-01-01'),
  ...overrides
});

export const createTestCustomer = (overrides = {}) => ({
  customerName: 'Test Customer',
  customerType: 'Individual',
  companyId: 'TEST-COMPANY',
  ...overrides
});
```

#### Python

```python
# tests/fixtures/loan_fixtures.py
from datetime import date, timedelta
from decimal import Decimal

def create_test_loan_product(**overrides):
    defaults = {
        'product_code': 'TEST-PL-001',
        'product_name': 'Test Personal Loan',
        'company_id': 'TEST-COMPANY',
        'rate_of_interest': Decimal('12.5'),
        'penalty_interest_rate': Decimal('2.0'),
        'maximum_loan_amount': Decimal('1000000'),
        'is_term_loan': True,
        'repayment_schedule_type': 'Monthly as per repayment start date'
    }
    defaults.update(overrides)
    return defaults

def create_test_loan(**overrides):
    defaults = {
        'loan_number': 'LOAN-001',
        'company_id': 'TEST-COMPANY',
        'applicant_type': 'Customer',
        'applicant_id': 'CUST-001',
        'loan_product_id': 'TEST-PL-001',
        'loan_amount': Decimal('100000'),
        'rate_of_interest': Decimal('12.5'),
        'repayment_periods': 12,
        'repayment_frequency': 'Monthly',
        'repayment_method': 'Repay Over Number of Periods',
        'repayment_start_date': date(2024, 1, 15),
        'status': 'Draft',
        'is_term_loan': True,
        'is_secured_loan': False,
        'posting_date': date(2024, 1, 1)
    }
    defaults.update(overrides)
    return defaults
```

### 2.2 Test Database Setup

```typescript
// test/setup/database.ts
export async function setupTestDatabase() {
  // Create test database
  await createDatabase('test_lending');
  
  // Run migrations
  await runMigrations();
  
  // Seed test data
  await seedTestData();
}

export async function teardownTestDatabase() {
  // Clean up test database
  await dropDatabase('test_lending');
}

export async function resetTestDatabase() {
  // Truncate all tables
  await truncateTables([
    'loans',
    'loan_products',
    'loan_repayments',
    'loan_demands',
    'loan_interest_accruals'
  ]);
}
```

---

## 3. Unit Tests

### 3.1 Calculation Function Tests

#### EMI Calculation Tests

```typescript
// test/unit/calculations/emi.test.ts
import { calculateEMI } from '../../../src/services/CalculationEngine';
import { describe, it, expect } from '@jest/globals';

describe('EMI Calculation', () => {
  it('should calculate EMI for standard loan', () => {
    const principal = 100000;
    const rate = 12; // 12% per annum
    const periods = 12; // 12 months
    const frequency = 'Monthly';
    
    const emi = calculateEMI(principal, rate, periods, frequency);
    
    // Expected EMI: 8884.87 (rounded up to 8885)
    expect(emi).toBe(8885);
  });
  
  it('should handle zero interest rate', () => {
    const principal = 100000;
    const rate = 0;
    const periods = 12;
    const frequency = 'Monthly';
    
    const emi = calculateEMI(principal, rate, periods, frequency);
    
    // Should be simple division: 100000 / 12 = 8333.33 (rounded up to 8334)
    expect(emi).toBe(8334);
  });
  
  it('should handle different frequencies', () => {
    const principal = 100000;
    const rate = 12;
    const periods = 52; // Weekly for 1 year
    
    const weeklyEMI = calculateEMI(principal, rate, periods, 'Weekly');
    const monthlyEMI = calculateEMI(principal, rate, 12, 'Monthly');
    
    // Weekly EMI should be approximately monthly EMI / 4
    expect(weeklyEMI).toBeCloseTo(monthlyEMI / 4, 0);
  });
  
  it('should handle one-time payment', () => {
    const principal = 100000;
    const rate = 12;
    const periods = 1;
    const frequency = 'One Time';
    
    const emi = calculateEMI(principal, rate, periods, frequency);
    
    // Should be principal + interest
    const expected = principal * (1 + rate / 100);
    expect(emi).toBe(Math.ceil(expected));
  });
});
```

#### Interest Calculation Tests

```typescript
// test/unit/calculations/interest.test.ts
import { calculateInterest } from '../../../src/services/CalculationEngine';

describe('Interest Calculation', () => {
  it('should calculate simple interest correctly', () => {
    const principal = 100000;
    const rate = 12; // 12% per annum
    const days = 30;
    const dayCountConvention = 'Actual/365';
    const postingDate = new Date('2024-01-15');
    
    const interest = calculateInterest(
      principal,
      rate,
      days,
      dayCountConvention,
      postingDate
    );
    
    // Expected: (100000 * 12 * 30) / (365 * 100) = 986.30
    expect(interest).toBeCloseTo(986.30, 2);
  });
  
  it('should handle different day count conventions', () => {
    const principal = 100000;
    const rate = 12;
    const days = 30;
    const postingDate = new Date('2024-01-15');
    
    const actual365 = calculateInterest(
      principal, rate, days, 'Actual/365', postingDate
    );
    const actual360 = calculateInterest(
      principal, rate, days, 'Actual/360', postingDate
    );
    
    // Actual/360 should be higher than Actual/365
    expect(actual360).toBeGreaterThan(actual365);
  });
  
  it('should handle leap year correctly', () => {
    const principal = 100000;
    const rate = 12;
    const days = 30;
    const leapYearDate = new Date('2024-02-15'); // 2024 is leap year
    const nonLeapYearDate = new Date('2023-02-15');
    
    const leapYearInterest = calculateInterest(
      principal, rate, days, 'Actual/Actual', leapYearDate
    );
    const nonLeapYearInterest = calculateInterest(
      principal, rate, days, 'Actual/Actual', nonLeapYearDate
    );
    
    // Leap year should use 366 days, non-leap year 365 days
    expect(leapYearInterest).toBeLessThan(nonLeapYearInterest);
  });
});
```

### 3.2 Validation Tests

```typescript
// test/unit/validators/loanValidator.test.ts
import { LoanValidator } from '../../../src/services/validators/LoanValidator';

describe('Loan Validator', () => {
  it('should validate loan amount is positive', () => {
    const loan = createTestLoan({ loanAmount: -1000 });
    
    expect(() => {
      LoanValidator.validate(loan);
    }).toThrow('Loan amount must be positive');
  });
  
  it('should validate interest rate is non-negative', () => {
    const loan = createTestLoan({ rateOfInterest: -5 });
    
    expect(() => {
      LoanValidator.validate(loan);
    }).toThrow('Interest rate must be non-negative');
  });
  
  it('should validate repayment periods is positive', () => {
    const loan = createTestLoan({ repaymentPeriods: 0 });
    
    expect(() => {
      LoanValidator.validate(loan);
    }).toThrow('Repayment periods must be positive');
  });
  
  it('should validate term loan has repayment schedule', () => {
    const loan = createTestLoan({
      isTermLoan: true,
      repaymentScheduleType: null
    });
    
    expect(() => {
      LoanValidator.validate(loan);
    }).toThrow('Term loans must have repayment schedule type');
  });
});
```

---

## 4. Integration Tests

### 4.1 Loan Creation Integration Test

```typescript
// test/integration/loan.test.ts
import { LoanService } from '../../../src/services/LoanService';
import { LoanRepository } from '../../../src/repositories/LoanRepository';
import { setupTestDatabase, teardownTestDatabase } from '../setup/database';

describe('Loan Service Integration', () => {
  let loanService: LoanService;
  let loanRepository: LoanRepository;
  
  beforeAll(async () => {
    await setupTestDatabase();
    loanRepository = new LoanRepository();
    loanService = new LoanService(loanRepository, /* ... other deps */);
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
  });
  
  beforeEach(async () => {
    await resetTestDatabase();
  });
  
  it('should create loan with repayment schedule', async () => {
    // Create loan product
    const product = await createTestLoanProduct();
    await loanProductRepository.create(product);
    
    // Create loan
    const loanData = createTestLoan({
      loanProductId: product.id
    });
    
    const loan = await loanService.createLoan(loanData);
    
    // Verify loan created
    expect(loan.id).toBeDefined();
    expect(loan.status).toBe('Draft');
    
    // Verify repayment schedule created
    const schedule = await repaymentScheduleRepository.findByLoanId(loan.id);
    expect(schedule).toBeDefined();
    expect(schedule.entries.length).toBe(loan.repaymentPeriods);
    
    // Verify first installment
    const firstInstallment = schedule.entries[0];
    expect(firstInstallment.installmentNumber).toBe(1);
    expect(firstInstallment.paymentDate).toEqual(loan.repaymentStartDate);
    expect(firstInstallment.totalPayment).toBeGreaterThan(0);
  });
  
  it('should update loan status on submission', async () => {
    const loan = await loanService.createLoan(createTestLoan());
    
    await loanService.submitLoan(loan.id);
    
    const updatedLoan = await loanRepository.findById(loan.id);
    expect(updatedLoan.status).toBe('Sanctioned');
  });
});
```

### 4.2 Repayment Processing Integration Test

```typescript
// test/integration/repayment.test.ts
describe('Repayment Service Integration', () => {
  it('should process repayment and update loan', async () => {
    // Create and disburse loan
    const loan = await createAndDisburseLoan(100000);
    
    // Process repayment
    const repayment = await repaymentService.processRepayment(
      loan.id,
      10000,
      new Date('2024-02-15')
    );
    
    // Verify repayment created
    expect(repayment.id).toBeDefined();
    expect(repayment.amountPaid).toBe(10000);
    
    // Verify loan updated
    const updatedLoan = await loanRepository.findById(loan.id);
    expect(updatedLoan.totalPrincipalPaid).toBeGreaterThan(0);
    expect(updatedLoan.status).toBe('Active');
    
    // Verify demands updated
    const demands = await demandRepository.findUnpaidByLoanId(loan.id);
    const totalOutstanding = demands.reduce(
      (sum, d) => sum + d.outstandingAmount,
      0
    );
    expect(totalOutstanding).toBeLessThan(loan.loanAmount);
  });
  
  it('should allocate repayment correctly', async () => {
    const loan = await createAndDisburseLoan(100000);
    
    // Create demands
    await createTestDemand(loan.id, 'Interest', 1000);
    await createTestDemand(loan.id, 'Principal', 9000);
    
    // Process repayment
    const repayment = await repaymentService.processRepayment(
      loan.id,
      10000,
      new Date('2024-02-15')
    );
    
    // Verify allocation order: Penalty → Interest → Principal
    expect(repayment.interestPaid).toBe(1000);
    expect(repayment.principalPaid).toBe(9000);
  });
});
```

---

## 5. Calculation Tests

### 5.1 Repayment Schedule Generation Tests

```typescript
// test/calculations/repaymentSchedule.test.ts
describe('Repayment Schedule Generation', () => {
  it('should generate correct schedule for term loan', () => {
    const loan = createTestLoan({
      loanAmount: 100000,
      rateOfInterest: 12,
      repaymentPeriods: 12,
      repaymentFrequency: 'Monthly',
      repaymentStartDate: new Date('2024-01-15')
    });
    
    const schedule = generateRepaymentSchedule(loan);
    
    // Verify schedule length
    expect(schedule.length).toBe(12);
    
    // Verify first installment
    const first = schedule[0];
    expect(first.installmentNumber).toBe(1);
    expect(first.paymentDate).toEqual(new Date('2024-01-15'));
    expect(first.totalPayment).toBeGreaterThan(0);
    
    // Verify last installment
    const last = schedule[11];
    expect(last.installmentNumber).toBe(12);
    expect(last.balanceLoanAmount).toBeCloseTo(0, 1);
    
    // Verify total payments
    const totalPayments = schedule.reduce(
      (sum, entry) => sum + entry.totalPayment,
      0
    );
    expect(totalPayments).toBeGreaterThan(loan.loanAmount);
  });
  
  it('should handle moratorium period', () => {
    const loan = createTestLoan({
      loanAmount: 100000,
      repaymentPeriods: 12,
      moratoriumType: 'EMI',
      moratoriumTenure: 3
    });
    
    const schedule = generateRepaymentSchedule(loan);
    
    // First 3 installments should have zero payment
    for (let i = 0; i < 3; i++) {
      expect(schedule[i].totalPayment).toBe(0);
    }
    
    // 4th installment should include moratorium interest
    expect(schedule[3].totalPayment).toBeGreaterThan(schedule[4].totalPayment);
  });
});
```

### 5.2 Interest Accrual Tests

```typescript
// test/calculations/interestAccrual.test.ts
describe('Interest Accrual', () => {
  it('should accrue interest daily for LOC loan', async () => {
    const loan = await createTestLOCLoan({
      loanAmount: 100000,
      rateOfInterest: 12
    });
    
    // Accrue interest for 30 days
    const accrual = await accrualService.accrueInterest(
      loan.id,
      new Date('2024-02-01')
    );
    
    // Expected: (100000 * 12 * 30) / (365 * 100) = 986.30
    expect(accrual.interestAmount).toBeCloseTo(986.30, 2);
    expect(accrual.days).toBe(30);
  });
  
  it('should accrue interest per schedule for term loan', async () => {
    const loan = await createTestTermLoan({
      loanAmount: 100000,
      rateOfInterest: 12,
      repaymentPeriods: 12
    });
    
    // Accrue interest for first schedule period
    const accruals = await accrualService.accrueInterestTermLoan(
      loan.id,
      new Date('2024-02-15')
    );
    
    // Should have accrual for first schedule entry
    expect(accruals.length).toBeGreaterThan(0);
    expect(accruals[0].repaymentScheduleId).toBeDefined();
  });
});
```

---

## 6. State Machine Tests

### 6.1 Loan Status Transition Tests

```typescript
// test/stateMachine/loanStateMachine.test.ts
describe('Loan State Machine', () => {
  it('should allow valid transitions', () => {
    const stateMachine = new LoanStateMachine('Draft');
    
    expect(stateMachine.canTransition('Sanctioned')).toBe(true);
    expect(stateMachine.canTransition('Closed')).toBe(false);
  });
  
  it('should execute transition actions', async () => {
    const loan = await createTestLoan({ status: 'Draft' });
    const stateMachine = new LoanStateMachine(loan.status);
    
    await stateMachine.transition('Sanctioned', {
      loanId: loan.id,
      userId: 'USER-001'
    });
    
    const updatedLoan = await loanRepository.findById(loan.id);
    expect(updatedLoan.status).toBe('Sanctioned');
  });
  
  it('should reject invalid transitions', () => {
    const stateMachine = new LoanStateMachine('Draft');
    
    expect(() => {
      stateMachine.transition('Closed', { loanId: 'LOAN-001' });
    }).toThrow('Invalid transition from Draft to Closed');
  });
  
  it('should handle all valid state transitions', () => {
    const validTransitions = [
      ['Draft', 'Sanctioned'],
      ['Sanctioned', 'Partially Disbursed'],
      ['Partially Disbursed', 'Disbursed'],
      ['Disbursed', 'Active'],
      ['Active', 'Loan Closure Requested'],
      ['Loan Closure Requested', 'Closed']
    ];
    
    validTransitions.forEach(([from, to]) => {
      const stateMachine = new LoanStateMachine(from as LoanStatus);
      expect(stateMachine.canTransition(to as LoanStatus)).toBe(true);
    });
  });
});
```

---

## 7. API Tests

### 7.1 REST API Tests

```typescript
// test/api/loans.test.ts
import request from 'supertest';
import app from '../../../src/app';

describe('Loan API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Authenticate and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test' });
    authToken = response.body.token;
  });
  
  it('should create loan via API', async () => {
    const loanData = createTestLoan();
    
    const response = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send(loanData)
      .expect(201);
    
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('Draft');
  });
  
  it('should get loan via API', async () => {
    const loan = await createTestLoanInDB();
    
    const response = await request(app)
      .get(`/api/loans/${loan.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.id).toBe(loan.id);
    expect(response.body.loanAmount).toBe(loan.loanAmount);
  });
  
  it('should process repayment via API', async () => {
    const loan = await createAndDisburseLoanInDB();
    
    const response = await request(app)
      .post(`/api/loans/${loan.id}/repayments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 10000,
        postingDate: '2024-02-15'
      })
      .expect(201);
    
    expect(response.body.amountPaid).toBe(10000);
  });
  
  it('should return 404 for non-existent loan', async () => {
    await request(app)
      .get('/api/loans/NON-EXISTENT')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
  
  it('should validate loan data', async () => {
    const invalidLoanData = {
      loanAmount: -1000 // Invalid: negative amount
    };
    
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidLoanData)
      .expect(400);
  });
});
```

---

## 8. Batch Job Tests

### 8.1 Interest Accrual Job Tests

```typescript
// test/batchJobs/interestAccrual.test.ts
describe('Interest Accrual Batch Job', () => {
  it('should accrue interest for all active loans', async () => {
    // Create multiple active loans
    const loan1 = await createAndDisburseLoan(100000);
    const loan2 = await createAndDisburseLoan(200000);
    const loan3 = await createAndDisburseLoan(300000);
    
    // Run accrual job
    const postingDate = new Date('2024-02-01');
    await interestAccrualJob.execute(postingDate);
    
    // Verify accruals created
    const accruals1 = await accrualRepository.findByLoanId(loan1.id);
    const accruals2 = await accrualRepository.findByLoanId(loan2.id);
    const accruals3 = await accrualRepository.findByLoanId(loan3.id);
    
    expect(accruals1.length).toBeGreaterThan(0);
    expect(accruals2.length).toBeGreaterThan(0);
    expect(accruals3.length).toBeGreaterThan(0);
  });
  
  it('should not accrue for closed loans', async () => {
    const closedLoan = await createClosedLoan();
    
    await interestAccrualJob.execute(new Date('2024-02-01'));
    
    const accruals = await accrualRepository.findByLoanId(closedLoan.id);
    expect(accruals.length).toBe(0);
  });
  
  it('should handle errors gracefully', async () => {
    // Create loan with invalid data that will cause error
    const invalidLoan = await createInvalidLoan();
    
    // Job should continue processing other loans
    await expect(
      interestAccrualJob.execute(new Date('2024-02-01'))
    ).resolves.not.toThrow();
  });
});
```

### 8.2 Demand Generation Job Tests

```typescript
// test/batchJobs/demandGeneration.test.ts
describe('Demand Generation Batch Job', () => {
  it('should generate demands from repayment schedules', async () => {
    const loan = await createAndDisburseTermLoan({
      loanAmount: 100000,
      repaymentPeriods: 12,
      repaymentStartDate: new Date('2024-01-15')
    });
    
    // Run demand generation job
    await demandGenerationJob.execute(new Date('2024-01-15'));
    
    // Verify demands created
    const demands = await demandRepository.findByLoanId(loan.id);
    expect(demands.length).toBeGreaterThan(0);
    
    // Verify first demand
    const firstDemand = demands[0];
    expect(firstDemand.demandDate).toEqual(new Date('2024-01-15'));
    expect(firstDemand.totalAmount).toBeGreaterThan(0);
  });
});
```

---

## 9. Performance Tests

### 9.1 Load Tests

```typescript
// test/performance/load.test.ts
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should handle 1000 concurrent loan creations', async () => {
    const startTime = performance.now();
    
    const promises = Array.from({ length: 1000 }, (_, i) =>
      loanService.createLoan(createTestLoan({ loanNumber: `LOAN-${i}` }))
    );
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete in less than 30 seconds
    expect(duration).toBeLessThan(30000);
  });
  
  it('should calculate outstanding amounts quickly', async () => {
    const loan = await createLoanWithManyTransactions();
    
    const startTime = performance.now();
    const outstanding = await loanService.getOutstanding(loan.id);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // Should complete in less than 500ms
    expect(duration).toBeLessThan(500);
  });
});
```

### 9.2 Database Query Performance Tests

```typescript
// test/performance/database.test.ts
describe('Database Performance', () => {
  it('should query loans efficiently with indexes', async () => {
    // Create 10000 loans
    await createManyLoans(10000);
    
    const startTime = performance.now();
    const loans = await loanRepository.find({
      status: 'Active',
      companyId: 'TEST-COMPANY'
    });
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // Should complete in less than 1 second
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## 10. Test Automation

### 10.1 Test Runner Configuration

#### Jest (TypeScript/JavaScript)

```json
// jest.config.json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src", "<rootDir>/test"],
  "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "setupFilesAfterEnv": ["<rootDir>/test/setup/jest.setup.ts"]
}
```

#### pytest (Python)

```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=src
    --cov-report=html
    --cov-report=term
    --cov-fail-under=80
    -v
```

### 10.2 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_lending
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 11. Test Data Scenarios

### 11.1 Common Test Scenarios

```typescript
// test/scenarios/loanScenarios.ts
export const testScenarios = {
  // Standard term loan
  standardTermLoan: {
    loanAmount: 100000,
    rateOfInterest: 12,
    repaymentPeriods: 12,
    expectedEMI: 8885,
    expectedTotalInterest: 6620
  },
  
  // Zero interest loan
  zeroInterestLoan: {
    loanAmount: 100000,
    rateOfInterest: 0,
    repaymentPeriods: 12,
    expectedEMI: 8334,
    expectedTotalInterest: 0
  },
  
  // High interest loan
  highInterestLoan: {
    loanAmount: 100000,
    rateOfInterest: 24,
    repaymentPeriods: 12,
    expectedEMI: 9456,
    expectedTotalInterest: 13472
  },
  
  // Long tenure loan
  longTenureLoan: {
    loanAmount: 1000000,
    rateOfInterest: 10,
    repaymentPeriods: 60,
    expectedEMI: 21248,
    expectedTotalInterest: 274880
  },
  
  // Secured loan
  securedLoan: {
    loanAmount: 500000,
    securityValue: 600000,
    haircut: 20,
    maximumLoanAmount: 480000
  }
};
```

---

## 12. Test Coverage Goals

### 12.1 Coverage Targets

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **Calculation Functions**: 100% coverage
- **State Machines**: 100% transition coverage
- **API Endpoints**: 100% endpoint coverage

### 12.2 Critical Areas for Testing

1. **Financial Calculations** - Must be 100% accurate
2. **State Transitions** - All valid transitions tested
3. **Data Integrity** - All validations tested
4. **Business Rules** - All rules enforced
5. **Error Handling** - All error paths tested

---

## Conclusion

This testing guide provides comprehensive strategies and examples for testing the Frappe Lending platform. Key points:

1. **Test at multiple levels** - Unit, integration, and E2E
2. **Focus on calculations** - Financial accuracy is critical
3. **Test state machines** - Ensure valid transitions
4. **Automate everything** - Use CI/CD for continuous testing
5. **Maintain test data** - Use fixtures and factories
6. **Monitor performance** - Test system performance regularly

Following this guide will ensure a robust, reliable lending platform.

