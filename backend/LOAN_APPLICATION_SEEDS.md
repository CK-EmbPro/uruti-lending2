# Loan Application Seed Data

This document describes the seed data service for loan applications and related entities.

## Overview

The `LoanApplicationSeedService` creates comprehensive seed data including:
- **Loan Products**: Personal Loan and Secured Loan products
- **Loan Applications**: 8 applications with various statuses (Approved, Under Review, Submitted, Rejected)
- **Loans**: Created from approved applications
- **Disbursements**: Created for 70% of approved loans
- **Repayments**: Created for 50% of disbursed loans

## Usage

### Via API Endpoint

```bash
POST /api/loan-applications/seed
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/loan-applications/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Via Service (Programmatic)

```typescript
import { LoanApplicationSeedService } from './modules/loan-application/loan-application-seed.service';

// In your service or controller
await loanApplicationSeedService.seedLoanApplications();
```

## Seed Data Details

### Loan Products

1. **Personal Loan (PL-001)**
   - Interest Rate: 8.5%
   - Penalty Rate: 2.0%
   - Maximum Amount: $500,000
   - Term Loan: Yes
   - Repayment Schedule: Monthly as per repayment start date

2. **Secured Loan (SL-001)**
   - Interest Rate: 7.0%
   - Penalty Rate: 1.5%
   - Maximum Amount: $1,000,000
   - Term Loan: Yes
   - Repayment Schedule: Monthly as per repayment start date

### Loan Applications

The seed creates 8 loan applications with the following distribution:

- **3 Approved Applications**: Will create loans
  - $50,000 Personal Loan (24 months)
  - $95,000 Secured Loan (36 months)
  - $75,000 Personal Loan (18 months)

- **2 Under Review Applications**
  - $120,000 Secured Loan (48 months)
  - $60,000 Personal Loan (24 months)

- **2 Submitted Applications**
  - $45,000 Personal Loan (12 months)
  - $150,000 Secured Loan (60 months)

- **1 Rejected Application**
  - $200,000 Personal Loan (36 months) - Rejected due to insufficient credit score

### Loans

Loans are automatically created from approved applications with:
- Unique loan numbers (LOAN-YYYY-#####)
- Status: SANCTIONED (updated to DISBURSED when disbursed)
- Linked to original application

### Disbursements

- 70% of approved loans get disbursements
- Disbursement date: 30 days before repayment start date
- Full loan amount disbursed

### Repayments

- 50% of disbursed loans get sample repayments
- 1-6 repayments created (or up to repayment periods)
- Monthly repayments with 85% principal, 15% interest split

## Customers

The seed uses mock customer IDs:
- customer-001: John Doe
- customer-002: Jane Smith
- customer-003: Robert Johnson
- customer-004: Emily Davis
- customer-005: Michael Brown
- customer-006: Sarah Wilson
- customer-007: David Miller
- customer-008: Lisa Anderson

**Note**: In production, these would be real customer entities from your customer management system.

## Company

A default company is created if it doesn't exist:
- **Name**: Uruti Lending Company
- **Code**: URUTI
- **Email**: info@urutilending.com

## Safety Features

- **Idempotent**: Won't create duplicate data if seed already ran
- **Checks existing data**: Skips seed if applications already exist
- **Error handling**: Comprehensive error logging

## Development Notes

- Seed data uses realistic dates and amounts
- Application numbers follow format: `LOAP-YYYY-#####`
- Loan numbers follow format: `LOAN-YYYY-#####`
- All dates are relative to current date for realistic timelines

## Force Seed (Development Only)

For development, you can force seed even if data exists:

```typescript
await loanApplicationSeedService.seedLoanApplicationsForce();
```

**Warning**: This may create duplicate data. Use with caution.

## Related Entities

The seed service also ensures these related entities exist:
- Companies
- Loan Products
- Loans (from approved applications)
- Loan Disbursements
- Loan Repayments

## Next Steps

After seeding:
1. Review applications in the dashboard
2. Test approval/rejection workflows
3. Verify loan creation from approved applications
4. Check disbursement and repayment records
5. Test reporting with the seed data

