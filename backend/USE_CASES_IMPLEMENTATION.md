# Application & Origination Use Cases Implementation

## Overview
This document tracks the implementation of the 5 use cases for Application & Origination.

## Use Cases Status

### ✅ UC-001: New Loan Application Submission
**Status:** Partially Implemented - Needs Enhancement

**Current Implementation:**
- ✅ Multi-step form with save/resume (localStorage draft)
- ✅ Document upload
- ✅ Form validation
- ✅ Application submission

**Enhancements Needed:**
- [ ] Server-side draft persistence (database)
- [ ] Co-borrower addition feature
- [ ] Pre-filled data from existing customer records
- [ ] Application confirmation email/SMS

---

### ❌ UC-002: Pre-Qualification Check
**Status:** Not Implemented

**Requirements:**
- [ ] Pre-qualification endpoint
- [ ] Soft credit check simulation
- [ ] Estimated loan terms calculation
- [ ] Anonymous pre-qual option
- [ ] Pre-qual offer storage
- [ ] Frontend pre-qual form

---

### ⚠️ UC-003: Document Collection & Verification
**Status:** Partially Implemented - Needs Enhancement

**Current Implementation:**
- ✅ Document upload
- ✅ Document verification workflow
- ✅ Required documents check
- ✅ Document status tracking

**Enhancements Needed:**
- [ ] OCR data extraction (simulated or integrated)
- [ ] Automated discrepancy detection
- [ ] Third-party verification integration
- [ ] Document auto-verification for certain types

---

### ⚠️ UC-004: Application Status Inquiry
**Status:** Partially Implemented - Needs Enhancement

**Current Implementation:**
- ✅ Application status display
- ✅ Status tracking in detail page
- ✅ Basic status badges

**Enhancements Needed:**
- [ ] Status notifications (email/SMS)
- [ ] Milestone tracking
- [ ] Next steps guidance
- [ ] Status change history
- [ ] Real-time status updates

---

### ❌ UC-005: Incomplete Application Recovery
**Status:** Not Implemented

**Requirements:**
- [ ] Abandoned application detection
- [ ] Reminder email/SMS system
- [ ] Recovery workflow
- [ ] Application completion tracking
- [ ] Marketing follow-up integration

---

## Implementation Priority

1. **High Priority:**
   - UC-002: Pre-Qualification Check (new feature, high business value)
   - UC-005: Incomplete Application Recovery (new feature, conversion optimization)

2. **Medium Priority:**
   - UC-001: Enhancements (co-borrower, pre-fill data)
   - UC-004: Status notifications and milestone tracking

3. **Low Priority:**
   - UC-003: OCR and automated verification (requires external services)

---

## Technical Architecture

### Pre-Qualification Service
- **Backend:** `PreQualificationService`
- **Entity:** `PreQualification` (optional, for storing offers)
- **Endpoints:**
  - `POST /pre-qualification/check` - Anonymous pre-qual
  - `GET /pre-qualification/offers/:token` - Retrieve saved offer
  - `POST /pre-qualification/convert` - Convert to application

### Incomplete Application Recovery Service
- **Backend:** `ApplicationRecoveryService`
- **Scheduled Job:** Daily check for abandoned applications
- **Endpoints:**
  - `GET /loan-applications/abandoned` - List abandoned apps
  - `POST /loan-applications/:id/send-reminder` - Manual reminder
  - `POST /loan-applications/:id/recover` - Recovery action

### Notification Service
- **Backend:** `NotificationService`
- **Channels:** Email, SMS
- **Templates:** Status updates, reminders, confirmations

