# Customer Service Use Cases Implementation

## Overview

This document describes the implementation of Customer Service use cases (UC-032 through UC-035) for the Uruti Lending Platform.

## Use Cases Implemented

### UC-032: Payment Extension Request ✅

**Actor:** Borrower, CSR

**Flow:**
1. Borrower requests extension
2. CSR evaluates account history
3. CSR approves/denies request
4. System extends due date in repayment schedule
5. Borrower notified

**Entities:**
- `PaymentExtension` - Extension request records

**Key Features:**
- Multiple extension types (One-Time Courtesy, Hardship-Based, Standard)
- Automatic due date calculation
- Repayment schedule update on approval
- Borrower notification tracking
- Approval/denial workflow

**API Endpoints:**
- `POST /customer-service/payment-extensions` - Create extension request
- `POST /customer-service/payment-extensions/:id/approve` - Approve extension
- `POST /customer-service/payment-extensions/:id/deny` - Deny extension
- `GET /customer-service/loans/:loanId/payment-extensions` - Get extensions for loan

---

### UC-033: Dispute Resolution ✅

**Actor:** Borrower, CSR

**Flow:**
1. Borrower disputes charge/reporting
2. CSR documents dispute
3. CSR investigates issue
4. CSR resolves or escalates
5. System communicates resolution
6. Account updated if needed

**Entities:**
- `Dispute` - Dispute records
- `DisputeResolution` - Resolution records

**Key Features:**
- Multiple dispute types (Payment, Credit Reporting, Fraud, Fee, Interest)
- Investigation tracking
- Resolution with adjustment amounts
- Escalation workflow
- Account update integration
- Borrower notification

**API Endpoints:**
- `POST /customer-service/disputes` - Create dispute
- `POST /customer-service/disputes/:id/resolve` - Resolve dispute
- `POST /customer-service/disputes/:id/escalate` - Escalate dispute
- `GET /customer-service/loans/:loanId/disputes` - Get disputes for loan

---

### UC-034: Account Update Request ✅

**Actor:** Borrower, CSR

**Flow:**
1. Borrower requests address/contact change
2. CSR verifies identity
3. CSR updates information
4. System validates
5. Borrower confirms

**Entities:**
- `AccountUpdate` - Account update records

**Key Features:**
- Multiple update types (Address, Phone, Email, Contact Info, Temporary Address)
- Identity verification tracking
- System validation
- Temporary address support
- Borrower confirmation
- Old/new value tracking

**API Endpoints:**
- `POST /customer-service/account-updates` - Create account update request
- `POST /customer-service/account-updates/:id/verify-and-process` - Verify and process update
- `GET /customer-service/loans/:loanId/account-updates` - Get updates for loan

---

### UC-035: Fee Waiver Request ✅

**Actor:** Borrower, CSR

**Flow:**
1. Borrower requests fee waiver
2. CSR reviews account history
3. CSR evaluates policy
4. CSR approves/denies waiver
5. System processes adjustment
6. Reason documented

**Entities:**
- `FeeWaiver` - Fee waiver records

**Key Features:**
- Multiple waiver types (One-Time Courtesy, Systematic, Hardship, Policy)
- Account history evaluation
- Multiple fee types (Late Fee, Penalty, Interest, Processing Fee)
- Approval/denial workflow
- Adjustment integration
- Policy compliance tracking

**API Endpoints:**
- `POST /customer-service/fee-waivers` - Create fee waiver request
- `POST /customer-service/fee-waivers/:id/approve` - Approve waiver
- `POST /customer-service/fee-waivers/:id/deny` - Deny waiver
- `GET /customer-service/loans/:loanId/fee-waivers` - Get waivers for loan

---

## Data Model

### Core Entities

1. **PaymentExtension** - Payment extension requests
2. **Dispute** - Dispute records
3. **DisputeResolution** - Dispute resolution records
4. **AccountUpdate** - Account information updates
5. **FeeWaiver** - Fee waiver requests

### Enums

- `ExtensionStatus` - Pending, Approved, Denied, Expired
- `ExtensionType` - One-Time Courtesy, Hardship-Based, Standard
- `DisputeStatus` - Open, Under Investigation, Resolved, Escalated, Closed
- `DisputeType` - Payment, Credit Reporting, Fraud, Fee, Interest, Other
- `WaiverStatus` - Pending, Approved, Denied, Processed
- `WaiverType` - One-Time Courtesy, Systematic, Hardship, Policy
- `AccountUpdateType` - Address Change, Phone Change, Email Change, Contact Info Change, Temporary Address, Bulk Update

---

## Integration Points

### With Loan Service
- Updates repayment schedule on extension approval
- Reads loan information for context

### With Loan Adjustment Service
- Creates adjustments for fee waivers (ready for integration)
- Creates adjustments for dispute resolutions (ready for integration)

### With Customer Service
- Updates customer contact information (ready for integration)
- Validates address/phone/email (ready for integration)

### With Notification Service
- Borrower notifications (ready for integration)
- CSR notifications (ready for integration)

---

## Frontend Implementation

### Components Created

1. **CustomerServiceSection** - Main customer service UI component
   - Quick action buttons
   - Extension history display
   - Dispute history display
   - Fee waiver history display
   - Account update history display

2. **Modal Components:**
   - PaymentExtensionModal - Request payment extension
   - DisputeModal - File dispute
   - AccountUpdateModal - Update account information
   - FeeWaiverModal - Request fee waiver

### Features

- Integrated into loan detail page
- Real-time data updates
- Approval workflows for CSR
- Status tracking
- History display

---

## Future Enhancements

1. **Automated Identity Verification** - Integration with verification services
2. **Address Validation** - Real-time address validation API
3. **Notification Integration** - Email/SMS notifications
4. **Policy Engine** - Configurable waiver/extension policies
5. **Account History Dashboard** - Comprehensive account history view
6. **Bulk Operations** - Bulk account updates
7. **Document Upload** - Support documents for disputes/extensions
8. **Workflow Automation** - Automated approval workflows based on rules

---

## API Documentation

All endpoints are protected with JWT authentication.

Base URL: `/customer-service`

See `customer-service.controller.ts` for full API documentation.

