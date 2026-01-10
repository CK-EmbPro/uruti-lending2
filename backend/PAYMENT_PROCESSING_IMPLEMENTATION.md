# Payment Processing Use Cases Implementation

## Overview
This document outlines the implementation of the Payment Processing use cases (UC-014 to UC-018) for the Uruti Lending Platform.

## Implemented Use Cases

### UC-014: Regular Payment Processing ✅
**Actor:** Borrower, System  
**Status:** Complete

**Implementation:**
- **Service:** `PaymentReminderService`
- **Entity:** `PaymentReminder`
- **Features:**
  - Create payment reminders
  - Send reminders via multiple channels (Email, SMS, Push, In-App)
  - Scheduled job for automatic reminder sending
  - Reminder acknowledgment
  - Days-before-due-date configuration
  - Reminder status tracking

**API Endpoints:**
- `POST /payment-processing/reminders` - Create reminder
- `POST /payment-processing/reminders/:id/send` - Send reminder
- `POST /payment-processing/reminders/:id/acknowledge` - Acknowledge reminder
- `GET /payment-processing/loans/:loanId/reminders` - Get reminders for loan

**Scheduled Job:**
- `@Cron(CronExpression.EVERY_DAY_AT_9AM)` - Processes reminders daily

---

### UC-015: Autopay Enrollment & Processing ✅
**Actor:** Borrower  
**Status:** Complete

**Implementation:**
- **Service:** `AutopayService`
- **Entity:** `AutopayEnrollment`
- **Features:**
  - Enroll in autopay
  - Bank account linking and verification
  - Multiple payment amount types:
    - Fixed Amount
    - Minimum Payment
    - Full Balance
  - Automatic payment processing on due date
  - Payment success/failure tracking
  - Autopay cancellation
  - Scheduled job for automatic processing

**API Endpoints:**
- `POST /payment-processing/autopay/enroll` - Enroll in autopay
- `POST /payment-processing/autopay/:id/verify` - Verify bank account
- `POST /payment-processing/autopay/:id/process` - Process payment
- `POST /payment-processing/autopay/:id/cancel` - Cancel autopay
- `GET /payment-processing/loans/:loanId/autopay` - Get enrollment

**Scheduled Job:**
- `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` - Processes autopay payments daily

---

### UC-016: Early/Extra Payment ✅
**Actor:** Borrower  
**Status:** Complete

**Implementation:**
- **Service:** `PaymentAllocationService`
- **Entity:** `PaymentAllocation`
- **Features:**
  - Payment allocation with preferences:
    - Principal First
    - Interest First
    - Proportional
    - Principal Only
  - Early payment detection
  - Extra payment handling
  - Prepayment penalty calculation
  - Interest recalculation trigger
  - Payoff date updates

**API Endpoints:**
- `POST /payment-processing/allocations` - Allocate payment
- `GET /payment-processing/repayments/:repaymentId/allocation` - Get allocation

**Allocation Preferences:**
- Principal First: Pays principal, then interest, then penalties
- Interest First: Pays interest, then principal, then penalties
- Proportional: Allocates proportionally based on outstanding amounts
- Principal Only: Applies entire payment to principal

---

### UC-017: Payment Reversal ✅
**Actor:** Operations Team  
**Status:** Complete

**Implementation:**
- **Service:** `PaymentReversalService`
- **Entity:** `PaymentReversal`
- **Features:**
  - Create payment reversal
  - Multiple reversal reasons:
    - NSF (Non-Sufficient Funds)
    - Bank Error
    - Fraud
    - Borrower Request
    - Duplicate Payment
    - Unauthorized Transaction
  - NSF fee assessment
  - Automatic balance reversal
  - Borrower notification
  - Collection initiation
  - Reversal status tracking

**API Endpoints:**
- `POST /payment-processing/reversals` - Create reversal
- `POST /payment-processing/reversals/:id/process` - Process reversal
- `GET /payment-processing/reversals/:id` - Get reversal
- `GET /payment-processing/loans/:loanId/reversals` - Get reversals for loan

**Reversal Process:**
1. Reverse payment allocation (principal, interest, penalty)
2. Update loan balances
3. Assess NSF fee if applicable
4. Notify borrower
5. Initiate collection if needed

---

### UC-018: Partial Payment Handling ✅
**Actor:** System, Loan Servicing  
**Status:** Complete

**Implementation:**
- **Service:** `PartialPaymentService`
- **Entity:** `PartialPayment`
- **Features:**
  - Create partial payment (hold in suspense)
  - Accumulate partial payments
  - Auto-apply when sufficient amount accumulated
  - Manual application with late fee option
  - Late fee calculation
  - Delinquency status updates
  - Suspense account tracking

**API Endpoints:**
- `POST /payment-processing/partial-payments` - Create partial payment
- `POST /payment-processing/partial-payments/:id/apply` - Apply partial payment
- `GET /payment-processing/loans/:loanId/partial-payments` - Get partial payments
- `GET /payment-processing/loans/:loanId/partial-payments/suspense` - Get suspense payments

**Partial Payment Flow:**
1. Borrower makes partial payment
2. Payment held in suspense account
3. Accumulate with other partial payments
4. When sufficient, auto-apply or manual apply
5. Late fee assessed if applicable
6. Update loan balances and delinquency status

---

## Database Schema

### PaymentReminder
- Tracks payment reminders sent to borrowers
- Supports multiple channels (Email, SMS, Push, In-App)
- Configurable days-before-due-date
- Status tracking (Pending, Sent, Acknowledged, Failed)

### AutopayEnrollment
- Stores autopay enrollment details
- Bank account information (last 4 digits for security)
- Payment amount type and configuration
- Success/failure tracking
- Next payment date calculation

### PaymentReversal
- Records payment reversals
- Links to original repayment
- Reversal reason and status
- NSF fee tracking
- Notification and collection flags

### PartialPayment
- Tracks partial payments in suspense
- Accumulated amount tracking
- Application date and status
- Late fee assessment

### PaymentAllocation
- Stores payment allocation details
- Allocation preference and amounts
- Early/extra payment flags
- Prepayment penalty tracking

---

## Integration Points

### With Loan Module
- Loan balance updates on payment allocation
- Interest recalculation on early payments
- Delinquency status updates on partial payments

### With Loan Repayment Module
- Payment allocation linked to repayments
- Reversal linked to repayments
- Partial payments create repayments when applied

### With Accounting Module
- Payment entries for autopay
- Reversal entries for payment reversals
- Suspense account entries for partial payments

### With Notification Service
- Payment reminder notifications
- Autopay confirmation notifications
- Reversal notification to borrowers

---

## Scheduled Jobs

1. **Payment Reminders** (`EVERY_DAY_AT_9AM`)
   - Checks for upcoming payments
   - Sends reminders based on days-before-due-date
   - Updates reminder status

2. **Autopay Processing** (`EVERY_DAY_AT_MIDNIGHT`)
   - Processes autopay payments for due dates
   - Updates enrollment status
   - Handles payment failures

---

## Files Created

### Backend
- ✅ `backend/src/modules/payment-processing/entities/payment-reminder.entity.ts`
- ✅ `backend/src/modules/payment-processing/entities/autopay-enrollment.entity.ts`
- ✅ `backend/src/modules/payment-processing/entities/payment-reversal.entity.ts`
- ✅ `backend/src/modules/payment-processing/entities/partial-payment.entity.ts`
- ✅ `backend/src/modules/payment-processing/entities/payment-allocation.entity.ts`
- ✅ `backend/src/modules/payment-processing/dto/payment-reminder.dto.ts`
- ✅ `backend/src/modules/payment-processing/dto/autopay.dto.ts`
- ✅ `backend/src/modules/payment-processing/dto/payment-reversal.dto.ts`
- ✅ `backend/src/modules/payment-processing/dto/partial-payment.dto.ts`
- ✅ `backend/src/modules/payment-processing/dto/payment-allocation.dto.ts`
- ✅ `backend/src/modules/payment-processing/services/payment-reminder.service.ts`
- ✅ `backend/src/modules/payment-processing/services/autopay.service.ts`
- ✅ `backend/src/modules/payment-processing/services/payment-reversal.service.ts`
- ✅ `backend/src/modules/payment-processing/services/partial-payment.service.ts`
- ✅ `backend/src/modules/payment-processing/services/payment-allocation.service.ts`
- ✅ `backend/src/modules/payment-processing/payment-processing.controller.ts`
- ✅ `backend/src/modules/payment-processing/payment-processing.module.ts`
- ✅ `backend/src/app.module.ts` - Registered PaymentProcessingModule

---

## Summary

All 5 Payment Processing use cases have been successfully implemented:
- ✅ UC-014: Regular Payment Processing - Complete with reminders and scheduling
- ✅ UC-015: Autopay Enrollment & Processing - Complete with bank account verification
- ✅ UC-016: Early/Extra Payment - Complete with allocation preferences
- ✅ UC-017: Payment Reversal - Complete with NSF handling and collection
- ✅ UC-018: Partial Payment Handling - Complete with suspense account management

The backend is production-ready and provides comprehensive APIs for all payment processing workflows.

