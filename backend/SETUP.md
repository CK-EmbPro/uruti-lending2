# Uruti Lending Backend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Database (Docker)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings (defaults should work for local dev)
```

### 4. Run Application

```bash
# Development mode
npm run start:dev

# The API will be available at http://localhost:3000/api
```

## Database Setup

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE lending_db;

# Exit
\q
```

### Run Migrations (when available)

```bash
npm run migration:run
```

## Testing the API

### Create a Loan Product

```bash
curl -X POST http://localhost:3000/api/loan-products \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "PL-001",
    "productName": "Personal Loan",
    "companyId": "company-1",
    "rateOfInterest": 12.5,
    "penaltyInterestRate": 2.0,
    "maximumLoanAmount": 1000000,
    "isTermLoan": true,
    "repaymentScheduleType": "Monthly as per repayment start date",
    "disbursementAccount": "Disbursement Account",
    "paymentAccount": "Payment Account",
    "loanAccount": "Loan Account",
    "interestIncomeAccount": "Interest Income Account",
    "penaltyIncomeAccount": "Penalty Income Account",
    "interestAccruedAccount": "Interest Accrued Account",
    "interestReceivableAccount": "Interest Receivable Account",
    "penaltyAccruedAccount": "Penalty Accrued Account",
    "penaltyReceivableAccount": "Penalty Receivable Account",
    "securityDepositAccount": "Security Deposit Account",
    "customerRefundAccount": "Customer Refund Account",
    "writeOffAccount": "Write Off Account",
    "writeOffRecoveryAccount": "Write Off Recovery Account",
    "interestWaiverAccount": "Interest Waiver Account",
    "penaltyWaiverAccount": "Penalty Waiver Account"
  }'
```

### Create a Loan

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "loanNumber": "LOAN-001",
    "companyId": "company-1",
    "applicantType": "Customer",
    "applicantId": "customer-1",
    "loanProductId": "<product-id-from-above>",
    "loanAmount": 100000,
    "repaymentPeriods": 12,
    "repaymentFrequency": "Monthly",
    "repaymentMethod": "Repay Over Number of Periods",
    "repaymentStartDate": "2024-02-15",
    "postingDate": "2024-01-15",
    "isTermLoan": true
  }'
```

## Project Status

### ✅ Completed
- Project structure and configuration
- PostgreSQL database setup
- Core entities (Loan, LoanProduct, LoanRepaymentSchedule)
- Calculation engine (EMI, Interest, Penalty)
- Loan module (CRUD operations, status transitions)
- Loan Product module (CRUD operations)
- Basic module structure for all features
- Scheduled jobs framework

### 🚧 In Progress / TODO
- Complete remaining entity definitions
- Implement repayment processing logic
- Implement disbursement logic
- Implement interest accrual logic
- Implement demand generation logic
- Implement security management
- Add authentication and authorization
- Add validation and error handling
- Add unit and integration tests
- Add API documentation (Swagger)

## Next Steps

1. **Complete Entity Definitions**
   - Loan Application entity
   - Loan Demand entity
   - Loan Interest Accrual entity
   - Loan Security entities

2. **Implement Business Logic**
   - Repayment schedule generation
   - Repayment allocation algorithm
   - Interest accrual for term loans and LOC
   - Demand generation from schedules
   - Security valuation and shortfall calculation

3. **Add State Machine**
   - Implement loan status state machine
   - Add validation for state transitions
   - Add automatic status updates

4. **Add Authentication**
   - JWT authentication
   - Role-based access control
   - Permission guards

5. **Add Tests**
   - Unit tests for calculation engine
   - Integration tests for API endpoints
   - E2E tests for workflows

## Documentation References

All implementation follows the Uruti Lending Platform documentation:
- `LENDING_TECHNICAL_SPECIFICATION.md` - Architecture and algorithms
- `LENDING_IMPLEMENTATION_GUIDE.md` - Code examples
- `LENDING_DATA_MODEL.md` - Entity definitions
- `LENDING_BUSINESS_RULES.md` - Business logic
- `LENDING_API_ENDPOINTS.md` - API specifications

**Note**: The documentation was created by analyzing the Frappe Lending system to understand the business requirements, but this is a completely independent implementation built in NestJS for the Uruti Lending Platform.

