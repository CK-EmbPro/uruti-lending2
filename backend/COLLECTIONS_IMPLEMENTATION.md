# Collections & Delinquency Management Implementation

## Overview

This document describes the implementation of the Delinquency & Collections use cases (UC-024 through UC-031) for the Uruti Lending Platform.

## Use Cases Implemented

### UC-024: Delinquency Detection & Classification ✅

**Actor:** System

**Flow:**
1. System detects missed payment (payment date passed, status not completed)
2. Calculates days past due (DPD)
3. Determines collection stage based on DPD
4. Assesses late fee (configurable: percentage-based with min/max)
5. Updates credit bureau status
6. Triggers automated collection workflow

**Entities:**
- `DelinquencyRecord` - Tracks delinquency status per loan per date
- `LateFee` - Records late fees assessed
- `CreditBureauUpdate` - Tracks credit bureau reporting

**Key Features:**
- Grace period support (configurable per loan product)
- Automatic late fee calculation
- Credit bureau status code mapping (Current, 30, 60, 90, 120, Charge-Off)
- Collection stage classification (Early, Moderate, Serious, Severe, Charge-Off Eligible)

**API Endpoint:**
- `POST /collections/detect-delinquency?loanId={id}&postingDate={date}`

---

### UC-025: Automated Collection Workflow ✅

**Actor:** System

**Flow:**
1. Account becomes delinquent
2. System creates collection workflow
3. Sends first notice (email)
4. Schedules follow-up communications based on stage
5. Escalates channel (email → SMS → letter)
6. Assigns to collector if needed

**Entities:**
- `CollectionWorkflow` - Tracks collection workflow state
- `CollectionNotice` - Records all notices sent

**Key Features:**
- Automatic workflow creation on delinquency detection
- Stage-based notice scheduling
- Channel escalation (Email → SMS → Letter)
- Skip days support for scheduling
- Notice tracking (sent, delivered, opened)

**API Endpoints:**
- `POST /collections/notices` - Send collection notice
- `GET /collections/loans/:loanId/workflow` - Get workflow status

---

### UC-026: Manual Collection Activity ✅

**Actor:** Collector

**Flow:**
1. Collector calls borrower
2. Documents conversation notes
3. Records outcome (Promise to Pay, Payment Arrangement, etc.)
4. Updates promise-to-pay if applicable
5. Schedules follow-up
6. Monitors compliance

**Entities:**
- `CollectionActivity` - Records all collection activities
- `PromiseToPay` - Tracks borrower promises

**Key Features:**
- Multiple activity types (Phone Call, Email, SMS, Letter, In Person Visit)
- Conversation notes tracking
- Right party contact verification
- Cease and desist handling
- Callback scheduling
- Outcome tracking

**API Endpoints:**
- `POST /collections/activities` - Create collection activity
- `GET /collections/loans/:loanId/activities` - Get activities for loan
- `POST /collections/promise-to-pay` - Create promise to pay

---

### UC-027: Payment Arrangement Creation ✅

**Actor:** Collector, Borrower

**Flow:**
1. Borrower proposes payment plan
2. Collector evaluates and approves
3. System documents terms
4. Generates compliance schedule
5. Tracks payment compliance
6. Removes from active collection when compliant

**Entities:**
- `PaymentArrangement` - Payment plan details
- `ArrangementCompliance` - Tracks each payment in arrangement

**Key Features:**
- Short-term (< 6 months) and long-term (6+ months) arrangements
- Multiple payment frequencies (Weekly, Bi-weekly, Monthly)
- Automatic compliance schedule generation
- Payment tracking (paid, late, missed)
- Compliance monitoring

**API Endpoints:**
- `POST /collections/payment-arrangements` - Create payment arrangement
- `GET /collections/loans/:loanId/payment-arrangements` - Get arrangements for loan

---

### UC-028: Skip Tracing ✅

**Actor:** Collector

**Flow:**
1. Borrower unreachable
2. System initiates skip trace
3. Searches databases for new contact info
4. Updates account with new information
5. Attempts new contact
6. Documents results

**Entities:**
- `SkipTrace` - Skip trace records

**Key Features:**
- Multiple search methods (Database, Third-Party Service, Social Media, Public Records)
- Contact information updates
- Cost tracking
- Verification status
- New contact attempt tracking

**API Endpoint:**
- `POST /collections/skip-traces` - Create skip trace

---

### UC-029: Legal Action Initiation ✅

**Actor:** Collections Manager

**Flow:**
1. Account meets lawsuit criteria (typically 90+ days DPD)
2. Manager reviews and approves
3. Forwards to attorney
4. Tracks lawsuit progress
5. Records judgment

**Entities:**
- `LegalAction` - Legal action records
- `Lawsuit` - Lawsuit details
- `Judgment` - Judgment records

**Key Features:**
- Multiple action types (Small Claims, Circuit Court, Bankruptcy Filing, Foreclosure, Repossession, Garnishment)
- Approval workflow
- Attorney assignment
- Case tracking
- Judgment recording and satisfaction

**API Endpoints:**
- `POST /collections/legal-actions` - Create legal action
- `POST /collections/legal-actions/:id/approve` - Approve legal action

---

### UC-030: Third-Party Collection Placement ✅

**Actor:** Collections Manager

**Flow:**
1. Internal collection efforts exhausted
2. Manager selects agency
3. Transmits account data
4. Agency works account
5. Receives payments
6. Recalls or charges off

**Entities:**
- `CollectionAgency` - Collection agency master data
- `ThirdPartyPlacement` - Account placements

**Key Features:**
- Multiple agency types (Contingency, Flat Fee, Hybrid)
- Placement tracking
- Collection and fee tracking
- Recall conditions
- Charge-off support

**API Endpoints:**
- `POST /collections/third-party-placements` - Create placement
- `GET /collections/agencies` - Get collection agencies

---

### UC-031: Charge-Off Processing ✅

**Actor:** System, Credit Risk

**Flow:**
1. Account reaches charge-off criteria (typically 120-180 days DPD)
2. System moves to charge-off status
3. Updates general ledger (via accounting integration)
4. Reports to credit bureaus
5. Continues collection efforts

**Key Features:**
- Automatic charge-off at threshold (120 days default)
- Loan status update to WRITTEN_OFF
- Credit bureau update
- Accounting integration ready

**API Endpoint:**
- `POST /collections/charge-off` - Process charge-off

---

## Data Model

### Core Entities

1. **DelinquencyRecord** - Daily delinquency snapshots
2. **LateFee** - Late fee assessments
3. **CreditBureauUpdate** - Credit reporting records
4. **CollectionWorkflow** - Active collection workflows
5. **CollectionNotice** - All notices sent
6. **CollectionActivity** - Manual collection activities
7. **PromiseToPay** - Borrower promises
8. **PaymentArrangement** - Payment plans
9. **ArrangementCompliance** - Payment compliance tracking
10. **SkipTrace** - Skip trace records
11. **LegalAction** - Legal actions
12. **Lawsuit** - Lawsuit details
13. **Judgment** - Judgment records
14. **CollectionAgency** - Agency master data
15. **ThirdPartyPlacement** - Third-party placements

### Enums

- `CollectionStage` - Early, Moderate, Serious, Severe, Charge-Off Eligible
- `CollectionNoticeType` - First, Second, Final, Pre-Legal, Demand Letter
- `CollectionChannel` - Email, SMS, Phone, Letter, In Person
- `CollectionActivityType` - Various activity types
- `PaymentArrangementStatus` - Pending, Active, Compliant, Defaulted, Completed, Cancelled
- `LegalActionStatus` - Pending Approval, Approved, Filed, etc.
- `LegalActionType` - Small Claims, Circuit Court, etc.
- `ThirdPartyPlacementStatus` - Pending, Placed, Active, Recalled, etc.
- `CollectionAgencyType` - Contingency, Flat Fee, Hybrid

---

## Integration Points

### With Loan Service
- Uses `updateDaysPastDue()` method
- Reads loan status and DPD
- Updates loan status on charge-off

### With Accounting Module
- Charge-off creates accounting entries (ready for integration)
- Late fees can be posted to GL

### With Credit Bureau
- Status updates prepared (ready for API integration)
- Status code mapping implemented

### With Communication Services
- Notice sending (ready for email/SMS integration)
- Template support

---

## Scheduled Jobs

The delinquency detection should be run daily via scheduler:

```typescript
@Cron('0 0 * * *') // Daily at midnight
async detectDelinquency() {
  await this.collectionsService.detectAndClassifyDelinquency();
}
```

---

## Configuration

### Late Fee Calculation
Currently uses simple percentage-based calculation:
- 5% of outstanding balance
- Maximum $50
- Minimum $10

**TODO:** Make this configurable per loan product.

### Charge-Off Threshold
Default: 120 days past due

**TODO:** Make this configurable per company/loan product.

### Grace Period
Reads from loan product `gracePeriodInDays`

---

## Future Enhancements

1. **Configurable Late Fee Rules** - Per loan product
2. **Credit Bureau API Integration** - Real-time updates
3. **Email/SMS Service Integration** - Automated notices
4. **Collection Dashboard** - UI for collectors
5. **Automated Workflow Rules** - Configurable escalation
6. **Skip Trace Service Integration** - Third-party APIs
7. **Legal Document Generation** - Automated legal docs
8. **Collection Analytics** - Reporting and metrics

---

## API Documentation

All endpoints are protected with JWT authentication.

Base URL: `/collections`

See `collections.controller.ts` for full API documentation.

