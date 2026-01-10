# Loan Applicant KYC Backend Implementation Review

## Overview

The KYC (Know Your Customer) implementation for loan applicants is integrated into the loan application workflow system. KYC verification is a critical step in the loan application process, ensuring that all required documents are uploaded, verified, and meet compliance requirements before loan approval.

---

## 1. KYC Workflow Integration

### 1.1 Workflow States

The loan application workflow includes dedicated KYC states:

**States in Loan Application Workflow:**
- `Draft` - Initial state, application can be edited
- `Initiated` - Application submitted for review
- **`KYC Pending`** - KYC verification is pending ⭐
- **`KYC Complete`** - KYC verification completed ⭐
- `Approved` - Application approved (can only happen after KYC Complete)
- `Rejected` - Application rejected

**Location:** `backend/src/modules/workflow/workflow-seed.service.ts`

### 1.2 Workflow Transitions

**KYC-Related Transitions:**

```
Initiated → KYC Pending
  Action: "Review"
  Allowed Role: "Loan Processor"
  Description: Loan Processor reviews the application and moves it to KYC verification

KYC Pending → KYC Complete
  Action: "Complete KYC"
  Allowed Role: "Loan Appraiser"
  Description: Loan Appraiser completes KYC verification after verifying all documents

KYC Pending → Rejected
  Action: "Reject"
  Allowed Role: "Loan Appraiser"
  Description: Application can be rejected during KYC if documents don't meet requirements

KYC Complete → Approved
  Action: "Approve"
  Allowed Role: "Loan Underwriter"
  Description: Only after KYC is complete can the application be approved
```

**Key Point:** Applications **cannot be approved** until KYC is marked as complete.

---

## 2. Document Management System

### 2.1 Document Type Entity

**Location:** `backend/src/modules/document-type/entities/document-type.entity.ts`

**Key Features:**
- **Categories:** Identity, Address, Income, Employment, Bank, Property, Other
- **Required Documents:** `isRequired` flag marks mandatory documents
- **File Validation:**
  - `allowedFileTypes`: Comma-separated MIME types (e.g., "application/pdf,image/jpeg")
  - `maxFileSize`: Maximum file size in bytes
  - `maxDocuments`: Maximum number of documents of this type allowed
- **Expiry Management:**
  - `hasExpiry`: Whether document has expiry date
  - `validityPeriodMonths`: Validity period in months
- **Verification:**
  - `requiresVerification`: Whether document requires manual verification

**Example Document Types:**
- PAN Card (Identity, Required)
- Aadhaar Card (Identity, Required)
- Salary Slip (Income, Required)
- Bank Statement (Bank, Required)
- Address Proof (Address, Required)

### 2.2 Loan Application Document Entity

**Location:** `backend/src/modules/loan-application-document/entities/loan-application-document.entity.ts`

**Key Fields:**
```typescript
{
  id: string;
  loanApplicationId: string;
  documentType: string; // Link to Document Type
  documentName: string;
  documentNumber?: string; // e.g., PAN number, Aadhaar number
  filePath?: string;
  fileUrl?: string;
  fileType?: string; // MIME type
  fileSize?: number; // bytes
  status: DocumentStatus; // Pending, Verified, Rejected, Expired
  issueDate?: Date;
  expiryDate?: Date;
  verificationDate?: Date;
  verifiedBy?: string; // User ID
  remarks?: string; // Verification remarks
  rejectionReason?: string;
  isRequired: boolean;
  version: number; // For document updates
}
```

**Document Status Flow:**
```
Pending → Verified (via verify endpoint)
Pending → Rejected (via reject endpoint)
Any → Expired (automatic check)
```

---

## 3. KYC Service Implementation

### 3.1 Document Upload & Validation

**Service:** `LoanApplicationDocumentService`
**Location:** `backend/src/modules/loan-application-document/loan-application-document.service.ts`

**Key Methods:**

#### `create()` - Upload Document
- ✅ Validates document type exists and is active
- ✅ Checks maximum documents limit per type
- ✅ Validates file type against allowed types
- ✅ Validates file size against maximum
- ✅ Sets default status to `PENDING`
- ✅ Inherits `isRequired` from document type

#### `verify()` - Verify Document
- ✅ Changes status from `PENDING` to `VERIFIED`
- ✅ Records `verificationDate` and `verifiedBy`
- ✅ Stores verification `remarks`
- ✅ Prevents re-verification of already verified documents

#### `reject()` - Reject Document
- ✅ Changes status to `REJECTED`
- ✅ Records `rejectionReason` (required)
- ✅ Records who rejected it
- ✅ Prevents rejection of verified documents

### 3.2 KYC Compliance Checks

#### `checkRequiredDocuments()` - Check Required Documents
**Endpoint:** `GET /loan-application-documents/application/:applicationId/check-required`

**Returns:**
```typescript
{
  allRequiredUploaded: boolean;
  missingDocuments: string[]; // Document type names that are missing
  pendingVerification: string[]; // Document type names pending verification
}
```

**Logic:**
1. Finds all required document types (where `isRequired = true`)
2. Checks which documents are uploaded for the application
3. Verifies that uploaded documents have status `VERIFIED`
4. Returns missing documents and pending verifications

**Use Case:** Before completing KYC, check if all required documents are uploaded and verified.

#### `checkExpiredDocuments()` - Check Expired Documents
**Endpoint:** `GET /loan-application-documents/application/:applicationId/check-expired`

**Logic:**
1. Finds all documents for the application
2. Checks `expiryDate` against current date
3. Automatically marks expired documents as `EXPIRED`
4. Returns list of expired documents

**Use Case:** Periodic check to ensure documents are still valid.

---

## 4. API Endpoints

### 4.1 Document Management Endpoints

**Base Path:** `/api/loan-application-documents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Upload a new document |
| `GET` | `/` | Get all documents |
| `GET` | `/application/:applicationId` | Get documents for an application |
| `GET` | `/:id` | Get document by ID |
| `PATCH` | `/:id` | Update document (cannot update verified) |
| `DELETE` | `/:id` | Delete document (cannot delete verified) |
| `POST` | `/:id/verify` | Verify a document |
| `POST` | `/:id/reject` | Reject a document |
| `GET` | `/application/:applicationId/check-required` | Check required documents |
| `GET` | `/application/:applicationId/check-expired` | Check expired documents |

### 4.2 Workflow Action Endpoint

**Endpoint:** `POST /api/loan-applications/:id/workflow-action`

**Action:** `"Complete KYC"`

**Request Body:**
```json
{
  "action": "Complete KYC",
  "userId": "user-uuid",
  "userRoles": ["Loan Appraiser"],
  "comments": "All documents verified and KYC completed"
}
```

**Validation:**
- ✅ User must have "Loan Appraiser" role
- ✅ Application must be in "KYC Pending" state
- ✅ Transitions to "KYC Complete" state
- ✅ Creates workflow action history record

---

## 5. Business Rules & Validation

### 5.1 Document Upload Rules

1. **Document Type Validation:**
   - Document type must exist and be active
   - Cannot exceed `maxDocuments` limit per type

2. **File Validation:**
   - File type must be in `allowedFileTypes` list
   - File size must not exceed `maxFileSize`

3. **Status Protection:**
   - Verified documents cannot be updated or deleted
   - Only pending documents can be modified

### 5.2 KYC Completion Rules

1. **Required Documents:**
   - All required document types must be uploaded
   - All required documents must be verified (status = `VERIFIED`)

2. **Workflow State:**
   - Application must be in "KYC Pending" state
   - Only "Loan Appraiser" role can complete KYC

3. **Document Expiry:**
   - Documents with expiry dates must be valid (not expired)

### 5.3 Approval Dependency

**Critical Rule:** Applications can only be approved after KYC is complete.

```typescript
// In loan-application.service.ts
if (application.status !== ApplicationStatus.APPROVED) {
  // Cannot create loan
}
```

**Workflow ensures:**
- `KYC Complete` → `Approved` (only transition allowed)
- `Approved` → Loan can be created

---

## 6. Integration Points

### 6.1 Loan Application Service

**Location:** `backend/src/modules/loan-application/loan-application.service.ts`

The loan application service integrates with the workflow system to:
- Track application status through KYC states
- Validate state transitions
- Ensure KYC completion before approval

### 6.2 Workflow Service

**Location:** `backend/src/modules/workflow/workflow.service.ts`

The workflow service:
- Manages state transitions
- Validates role-based permissions
- Tracks workflow history
- Enforces business rules

---

## 7. Data Flow

### 7.1 KYC Verification Flow

```
1. Application Created (Draft)
   ↓
2. Application Initiated (Initiated)
   ↓
3. Loan Processor Reviews → Moves to KYC Pending
   ↓
4. Documents Uploaded (via POST /loan-application-documents)
   ↓
5. Loan Appraiser Verifies Documents (via POST /loan-application-documents/:id/verify)
   ↓
6. Check Required Documents (via GET /loan-application-documents/application/:id/check-required)
   ↓
7. If all required documents verified → Complete KYC (via POST /loan-applications/:id/workflow-action)
   ↓
8. Application Status: KYC Complete
   ↓
9. Loan Underwriter can now Approve
```

### 7.2 Document Verification Flow

```
Document Uploaded
  ↓
Status: PENDING
  ↓
Loan Appraiser Reviews
  ↓
  ├─→ Verify (POST /:id/verify)
  │     ↓
  │   Status: VERIFIED
  │     ↓
  │   Can be used for KYC completion
  │
  └─→ Reject (POST /:id/reject)
        ↓
      Status: REJECTED
        ↓
      Application may be rejected
```

---

## 8. Security & Compliance

### 8.1 Role-Based Access Control

- **Loan Processor:** Can move application to KYC Pending
- **Loan Appraiser:** Can verify/reject documents and complete KYC
- **Loan Underwriter:** Can approve only after KYC Complete

### 8.2 Audit Trail

- All workflow actions are logged in `workflow_actions` table
- Document verification records:
  - `verifiedBy`: User ID
  - `verificationDate`: Timestamp
  - `remarks`: Verification notes

### 8.3 Data Protection

- Verified documents cannot be modified or deleted
- Document versioning for updates
- Expiry date tracking for compliance

---

## 9. Current Implementation Status

### ✅ Implemented Features

1. ✅ Document Type Management
2. ✅ Document Upload with Validation
3. ✅ Document Verification/Rejection
4. ✅ Required Documents Check
5. ✅ Expired Documents Check
6. ✅ Workflow Integration (KYC Pending → KYC Complete)
7. ✅ Role-Based Access Control
8. ✅ Audit Trail (Workflow Actions)

### ⚠️ Potential Enhancements

1. **Automated KYC Checks:**
   - Integration with external KYC services
   - OCR for document data extraction
   - Automated document validation

2. **Document Categories:**
   - Better categorization and grouping
   - Category-specific validation rules

3. **Bulk Operations:**
   - Bulk document verification
   - Bulk document upload

4. **Notifications:**
   - Email notifications for document status changes
   - Alerts for expired documents

5. **Document Templates:**
   - Pre-defined document templates
   - Document checklist per loan product

---

## 10. Testing Recommendations

### 10.1 Unit Tests

- Document upload validation
- Document verification logic
- Required documents check
- Expired documents check

### 10.2 Integration Tests

- Workflow state transitions
- KYC completion flow
- Document verification → KYC Complete → Approval flow

### 10.3 E2E Tests

- Complete KYC verification process
- Document rejection flow
- Expired document handling

---

## 11. Summary

The KYC implementation is **well-structured** and follows a **workflow-based approach**:

✅ **Strengths:**
- Clear separation of concerns (Document Management vs Workflow)
- Comprehensive document validation
- Role-based access control
- Audit trail for compliance
- Flexible document type system

✅ **Key Components:**
1. **Workflow System:** Manages KYC states and transitions
2. **Document Management:** Handles document upload, verification, and validation
3. **Compliance Checks:** Required documents and expiry validation
4. **Integration:** Seamless integration with loan application approval process

The implementation provides a **solid foundation** for KYC verification with room for future enhancements like automated validation and external KYC service integration.

