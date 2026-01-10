# Additional Features Implementation

## ✅ Implementation Complete

Three additional features have been implemented:

1. ✅ **Loan Application Documents** - Document attachment and document type management
2. ✅ **Broken Period Interest (BPI)** - Specialized calculation
3. ✅ **Security Deposit Usage** - Advanced usage tracking

---

## 1. Loan Application Documents

### Entities Created

#### Loan Application Document (`loan_application_documents`)

**Fields:**
- `loanApplicationId` - Link to Loan Application
- `documentType` - Document type code
- `documentName` - Display name
- `documentNumber` - Document number (e.g., PAN, Aadhaar)
- `filePath` - Path to uploaded file
- `fileUrl` - URL to access document
- `fileType` - MIME type
- `fileSize` - File size in bytes
- `status` - Pending, Verified, Rejected, Expired
- `issueDate` - Document issue date
- `expiryDate` - Document expiry date
- `verificationDate` - Date when verified
- `verifiedBy` - User ID who verified
- `remarks` - Verification remarks
- `rejectionReason` - Reason for rejection
- `isRequired` - Whether document is required
- `version` - Document version (for updates)

#### Document Type (`document_types`)

**Fields:**
- `code` - Unique code (e.g., PAN, AADHAAR)
- `name` - Display name
- `category` - Identity, Address, Income, Employment, Bank, Property, Other
- `description` - Description
- `isRequired` - Whether mandatory
- `hasExpiry` - Whether has expiry date
- `validityPeriodMonths` - Validity period
- `requiresVerification` - Whether requires verification
- `allowedFileTypes` - Comma-separated MIME types
- `maxFileSize` - Maximum file size in bytes
- `maxDocuments` - Maximum documents of this type
- `isActive` - Active status

### Services

#### Loan Application Document Service

**Methods:**
- `create()` - Upload document with validation
- `findAll()` - Get all documents
- `findByApplicationId()` - Get documents for application
- `findOne()` - Get document by ID
- `update()` - Update document (cannot update verified)
- `remove()` - Delete document (cannot delete verified)
- `verify()` - Verify document
- `reject()` - Reject document
- `checkRequiredDocuments()` - Check if all required documents uploaded
- `checkExpiredDocuments()` - Check and mark expired documents

#### Document Type Service

**Methods:**
- `create()` - Create document type
- `findAll()` - Get all document types
- `findActive()` - Get active document types
- `findByCategory()` - Get by category
- `findOne()` - Get by ID
- `findByCode()` - Get by code
- `update()` - Update document type
- `remove()` - Delete document type

### API Endpoints

**Document Types:**
- `POST /document-types` - Create document type
- `GET /document-types` - Get all (with filters: active, category)
- `GET /document-types/:id` - Get by ID
- `GET /document-types/code/:code` - Get by code
- `PATCH /document-types/:id` - Update
- `DELETE /document-types/:id` - Delete

**Loan Application Documents:**
- `POST /loan-application-documents` - Upload document
- `GET /loan-application-documents` - Get all
- `GET /loan-application-documents/application/:applicationId` - Get by application
- `GET /loan-application-documents/:id` - Get by ID
- `PATCH /loan-application-documents/:id` - Update
- `DELETE /loan-application-documents/:id` - Delete
- `POST /loan-application-documents/:id/verify` - Verify document
- `POST /loan-application-documents/:id/reject` - Reject document
- `GET /loan-application-documents/application/:applicationId/check-required` - Check required
- `GET /loan-application-documents/application/:applicationId/check-expired` - Check expired

### Usage Example

```bash
# Create document type
POST /document-types
{
  "code": "PAN",
  "name": "PAN Card",
  "category": "Identity",
  "isRequired": true,
  "hasExpiry": false,
  "allowedFileTypes": "application/pdf,image/jpeg,image/png",
  "maxFileSize": 5242880
}

# Upload document
POST /loan-application-documents
{
  "loanApplicationId": "app-uuid",
  "documentType": "PAN",
  "documentName": "PAN Card",
  "documentNumber": "ABCDE1234F",
  "fileUrl": "https://example.com/documents/pan.pdf",
  "fileType": "application/pdf",
  "fileSize": 102400
}

# Verify document
POST /loan-application-documents/{id}/verify
{
  "verifiedBy": "user-uuid",
  "remarks": "Document verified"
}
```

---

## 2. Broken Period Interest (BPI)

### Overview

BPI is interest calculated for the period between disbursement date and first repayment date when the first repayment date differs from the expected date.

### Formula

```
BPI = (Principal × Rate × Days) / (365 × 100)
```

### BPI Recovery Methods

1. **Amortized Over Tenure**: BPI is divided equally across all repayment periods
2. **Add to First EMI**: Full BPI is added to the first EMI interest
3. **Upfront Deduction**: BPI is deducted upfront from disbursement amount

### Implementation

#### Loan Product Entity Updates

**Added Field:**
- `bpiRecoveryMethod` - Enum: 'Amortized Over Tenure', 'Add to First EMI', 'Upfront Deduction'

#### Loan Entity Updates

**Added Fields:**
- `brokenPeriodInterest` - Total BPI amount
- `brokenPeriodDays` - Number of broken period days

#### Loan Repayment Schedule Entity Updates

**Added Fields:**
- `brokenPeriodInterest` - BPI amount for this schedule entry
- `brokenPeriodDays` - Number of broken period days

#### BPI Calculation Service

**Methods:**
- `calculateBrokenPeriodInterest()` - Calculate BPI amount
- `calculateBrokenPeriodDays()` - Calculate broken period days
- `applyBpiToSchedule()` - Apply BPI based on recovery method
- `calculateLoanBpi()` - Complete BPI calculation for a loan

### Usage Example

```typescript
// Calculate BPI for a loan
const bpiResult = await bpiCalculationService.calculateLoanBpi(
  loan,
  loanProduct,
  repaymentStartDate,
);

// Result:
{
  brokenPeriodDays: 2,
  brokenPeriodInterest: 79.45,
  bpiApplication: {
    firstEmiAdjustment: 79.45, // If "Add to First EMI"
    amortizedBpi: 6.62, // If "Amortized Over Tenure" (79.45 / 12)
    upfrontDeduction: 0
  }
}
```

### Integration

BPI calculation is integrated into:
- Loan repayment schedule generation
- Interest calculation for first EMI
- Disbursement amount adjustment (for upfront deduction)

---

## 3. Security Deposit Usage

### Overview

Advanced tracking of security deposit collection, usage, and refunds.

### Entities Created

#### Loan Security Deposit Usage (`loan_security_deposit_usages`)

**Fields:**
- `loanId` - Link to Loan
- `usageType` - Interest Payment, Penalty Payment, Principal Payment, Charges Payment, Loan Closure, Other
- `amount` - Amount used (negative for refunds)
- `usageDate` - Date when used
- `referenceDocumentType` - Type of reference document
- `referenceDocumentId` - ID of reference document
- `referenceNumber` - Reference number
- `remarks` - Usage remarks
- `usedBy` - User ID who used
- `balanceBefore` - Balance before usage
- `balanceAfter` - Balance after usage

### Loan Entity Updates

**Added Fields:**
- `securityDepositAmount` - Total security deposit collected
- `securityDepositUsed` - Amount of security deposit used
- `securityDepositAvailable` - Available security deposit

### Security Deposit Service

**Methods:**
- `addSecurityDeposit()` - Add security deposit to loan
- `useSecurityDeposit()` - Use security deposit for payment
- `refundSecurityDeposit()` - Refund used security deposit
- `getUsageHistory()` - Get usage history
- `getSecurityDepositSummary()` - Get summary
- `autoUseForOverdue()` - Auto-use for overdue payments

### API Endpoints

- `POST /loan-security-deposit/:loanId/add` - Add security deposit
- `POST /loan-security-deposit/:loanId/use` - Use security deposit
- `POST /loan-security-deposit/:loanId/refund` - Refund security deposit
- `GET /loan-security-deposit/:loanId/history` - Get usage history
- `GET /loan-security-deposit/:loanId/summary` - Get summary

### Usage Example

```bash
# Add security deposit
POST /loan-security-deposit/{loanId}/add
{
  "amount": 10000
}

# Use security deposit for interest payment
POST /loan-security-deposit/{loanId}/use
{
  "loanId": "loan-uuid",
  "usageType": "Interest Payment",
  "amount": 5000,
  "usageDate": "2024-01-15",
  "referenceDocumentType": "Loan Repayment",
  "referenceDocumentId": "repayment-uuid",
  "remarks": "Used for overdue interest"
}

# Get summary
GET /loan-security-deposit/{loanId}/summary

# Response:
{
  "totalDeposit": 10000,
  "usedDeposit": 5000,
  "availableDeposit": 5000,
  "usageCount": 1,
  "lastUsageDate": "2024-01-15T00:00:00Z"
}
```

### Features

1. **Complete Audit Trail**: Every usage is recorded with before/after balances
2. **Multiple Usage Types**: Support for different payment types
3. **Auto-Use for Overdue**: Automatic usage for overdue payments
4. **Refund Support**: Track refunds separately
5. **Reference Tracking**: Link usage to source documents

---

## Database Schema Updates

### New Tables

1. `loan_application_documents` - Document attachments
2. `document_types` - Document type master
3. `loan_security_deposit_usages` - Security deposit usage history

### Updated Tables

1. `loan_products` - Added `bpi_recovery_method`
2. `loans` - Added BPI and security deposit fields
3. `loan_repayment_schedules` - Added BPI fields

---

## Integration Points

### 1. Loan Application Documents

- Integrated with Loan Application workflow
- Required documents check before approval
- Expiry date validation
- Document verification workflow

### 2. BPI Calculation

- Integrated into repayment schedule generation
- Applied based on product configuration
- Handles all three recovery methods
- Updates loan totals

### 3. Security Deposit Usage

- Integrated with loan repayment
- Auto-use for overdue payments
- Refund tracking
- Accounting integration ready

---

## Status

✅ **COMPLETE** - All three features implemented and ready for use.

---

**Last Updated**: Current Session

