# Swagger/OpenAPI Documentation Guide

## ✅ Complete Swagger Documentation

All API endpoints are now fully documented with Swagger/OpenAPI.

---

## Access Swagger UI

**Development:**
```
http://localhost:3000/api-docs
```

**Production:**
```
https://api.urutilending.com/api-docs
```

---

## API Documentation Structure

### Authentication
- **Tag**: `auth`
- **Endpoints**: Register, Login, User Management, Role Management

### Core Loan Management
- **Tag**: `loans`
- **Endpoints**: 
  - CRUD operations
  - Loan closure
  - NPA operations
  - Loan transfer
  - FLDG trigger
  - Workflow actions
  - Available actions
  - Workflow history

### Loan Application
- **Tag**: `loan-applications`
- **Endpoints**: 
  - CRUD operations
  - Approval/Rejection
  - Workflow actions
  - Create loan from application

### Loan Application Documents
- **Tag**: `loan-application-documents`
- **Endpoints**: 
  - Upload document
  - Verify/Reject document
  - Check required documents
  - Check expired documents

### Document Types
- **Tag**: `document-types`
- **Endpoints**: 
  - CRUD operations
  - Filter by category
  - Filter by active status

### Loan Disbursement
- **Tag**: `loan-disbursements`
- **Endpoints**: 
  - Create disbursement
  - Partial disbursement
  - Auto schedule generation

### Loan Repayment
- **Tag**: `loan-repayments`
- **Endpoints**: 
  - Create repayment (17 types)
  - Bulk repayment
  - Prepayment charges

### Loan Write-Off
- **Tag**: `loan-write-offs`
- **Endpoints**: 
  - Create write-off
  - Settlement write-off
  - NPA write-off

### Loan Refund
- **Tag**: `loan-refunds`
- **Endpoints**: 
  - Create refund
  - Excess amount refund
  - Security deposit refund

### Loan Balance Adjustment
- **Tag**: `loan-balance-adjustments`
- **Endpoints**: 
  - Credit adjustment
  - Debit adjustment

### Loan Restructure
- **Tag**: `loan-restructures`
- **Endpoints**: 
  - Create restructure
  - Approve/Reject restructure
  - Restructure workflow

### Loan Transfer
- **Tag**: `loan-transfers`
- **Endpoints**: 
  - Transfer loan
  - Get transfer history
  - Get customer transfers

### Security Management
- **Tag**: `loan-securities` - Security master
- **Tag**: `loan-security-assignments` - Assignment and pledging
- **Tag**: `loan-security-prices` - Price management
- **Tag**: `loan-security-shortfalls` - Shortfall detection
- **Tag**: `loan-security-deposit` - Deposit usage tracking

### Co-Lending
- **Tag**: `loan-partners`
- **Endpoints**: 
  - CRUD operations
  - FLDG configuration
  - Shareable types

### Accounting
- **Tag**: `accounting`
- **Endpoints**: 
  - Create journal entry
  - Submit/Cancel journal entry
  - Get entries by reference

### Reporting
- **Tag**: `reporting`
- **Endpoints**: 
  - Portfolio report
  - NPA report
  - Collection report
  - Disbursement report
  - Overdue report
  - CSV export for all reports

### Workflow
- **Tag**: `workflows`
- **Endpoints**: 
  - Create workflow
  - Get workflows
  - Get available actions
  - Perform workflow action
  - Get workflow history
  - Seed default workflows

### Calculations
- **Tag**: `calculations`
- **Endpoints**: 
  - Calculate EMI
  - Calculate interest
  - Calculate penalty

---

## Swagger Features

### 1. Complete Endpoint Coverage
✅ All 120+ endpoints documented

### 2. Request/Response Schemas
✅ All DTOs properly documented with:
- Field descriptions
- Validation rules
- Example values
- Required/Optional indicators

### 3. Authentication
✅ JWT Bearer token authentication configured
✅ All protected endpoints marked with `@ApiBearerAuth('JWT-auth')`

### 4. Tags Organization
✅ 25+ tags for organized navigation

### 5. Examples
✅ Request/response examples provided

### 6. Error Responses
✅ All error responses documented (400, 401, 404, etc.)

---

## Swagger Configuration

### Location
`backend/src/main.ts`

### Features Enabled
- ✅ Persistent authorization (token saved in browser)
- ✅ Alpha-sorted tags and operations
- ✅ Filter/search functionality
- ✅ Request duration display
- ✅ Try it out enabled
- ✅ Request snippets enabled
- ✅ Deep route scanning
- ✅ Operation ID factory

### Customization
- Custom site title
- Custom CSS (topbar hidden)
- Global prefix support

---

## API Documentation Standards

### All Controllers Include:
- ✅ `@ApiTags()` - Tag for grouping
- ✅ `@ApiBearerAuth('JWT-auth')` - Authentication requirement
- ✅ `@ApiOperation()` - Operation description
- ✅ `@ApiResponse()` - Response documentation
- ✅ `@ApiParam()` - Path parameter documentation
- ✅ `@ApiBody()` - Request body documentation

### All DTOs Include:
- ✅ `@ApiProperty()` - Property description
- ✅ `@ApiPropertyOptional()` - Optional property
- ✅ Validation decorators (`@IsString()`, `@IsNumber()`, etc.)
- ✅ Example values

---

## Testing with Swagger UI

### 1. Authenticate
1. Go to `/api-docs`
2. Click "Authorize" button
3. Enter JWT token
4. Click "Authorize"

### 2. Test Endpoints
1. Expand any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. View response

### 3. Export OpenAPI Spec
The OpenAPI JSON spec is available at:
```
http://localhost:3000/api-docs-json
```

---

## Endpoint Categories

### Public Endpoints (No Auth)
- `POST /api/auth/register`
- `POST /api/auth/login`

### Protected Endpoints (Require Auth)
All other endpoints require JWT Bearer token.

---

## Complete Endpoint List

### Authentication (2 endpoints)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/users
- GET /api/auth/users/:id
- PATCH /api/auth/users/:id/roles

### Companies (5 endpoints)
- POST /api/companies
- GET /api/companies
- GET /api/companies/:id
- PATCH /api/companies/:id
- DELETE /api/companies/:id

### Loan Products (8+ endpoints)
- POST /api/loan-products
- GET /api/loan-products
- GET /api/loan-products/:id
- PATCH /api/loan-products/:id
- DELETE /api/loan-products/:id
- POST /api/loan-products/:id/charges
- GET /api/loan-products/:id/charges
- DELETE /api/loan-products/:id/charges/:chargeId

### Loan Applications (10+ endpoints)
- POST /api/loan-applications
- GET /api/loan-applications
- GET /api/loan-applications/:id
- PATCH /api/loan-applications/:id
- DELETE /api/loan-applications/:id
- POST /api/loan-applications/:id/approve
- POST /api/loan-applications/:id/reject
- POST /api/loan-applications/:id/workflow-action
- GET /api/loan-applications/:id/available-actions
- GET /api/loan-applications/:id/workflow-history
- POST /api/loan-applications/:id/create-loan

### Loan Application Documents (10 endpoints)
- POST /api/loan-application-documents
- GET /api/loan-application-documents
- GET /api/loan-application-documents/application/:applicationId
- GET /api/loan-application-documents/:id
- PATCH /api/loan-application-documents/:id
- DELETE /api/loan-application-documents/:id
- POST /api/loan-application-documents/:id/verify
- POST /api/loan-application-documents/:id/reject
- GET /api/loan-application-documents/application/:applicationId/check-required
- GET /api/loan-application-documents/application/:applicationId/check-expired

### Document Types (6 endpoints)
- POST /api/document-types
- GET /api/document-types
- GET /api/document-types/:id
- GET /api/document-types/code/:code
- PATCH /api/document-types/:id
- DELETE /api/document-types/:id

### Loans (25+ endpoints)
- POST /api/loans
- GET /api/loans
- GET /api/loans/:id
- GET /api/loans/number/:loanNumber
- PATCH /api/loans/:id
- DELETE /api/loans/:id
- POST /api/loans/:id/submit
- POST /api/loans/:id/cancel
- POST /api/loans/:id/request-closure
- POST /api/loans/:id/close-unsecured
- POST /api/loans/:id/generate-schedule
- POST /api/loans/update-dpd
- POST /api/loans/:id/mark-npa
- POST /api/loans/:id/unmark-npa
- POST /api/loans/:id/make-write-off
- POST /api/loans/:id/make-refund-jv
- GET /api/loans/:id/available-limit
- POST /api/loans/:id/update-maximum-limit
- POST /api/loans/:id/update-available-limit
- POST /api/loans/:id/transfer
- POST /api/loans/:id/workflow-action
- GET /api/loans/:id/available-actions
- GET /api/loans/:id/workflow-history
- POST /api/loans/:id/trigger-fldg
- POST /api/loans/:id/check-fldg

### Loan Disbursements (5 endpoints)
- POST /api/loan-disbursements
- GET /api/loan-disbursements
- GET /api/loan-disbursements/:id
- GET /api/loan-disbursements/loan/:loanId
- PATCH /api/loan-disbursements/:id

### Loan Repayments (7+ endpoints)
- POST /api/loan-repayments
- GET /api/loan-repayments
- GET /api/loan-repayments/:id
- GET /api/loan-repayments/loan/:loanId
- PATCH /api/loan-repayments/:id
- DELETE /api/loan-repayments/:id
- POST /api/loan-repayments/bulk

### Loan Write-Offs (6 endpoints)
- POST /api/loan-write-offs
- GET /api/loan-write-offs
- GET /api/loan-write-offs/:id
- GET /api/loan-write-offs/loan/:loanId
- PATCH /api/loan-write-offs/:id
- POST /api/loan-write-offs/make-write-off

### Loan Refunds (6 endpoints)
- POST /api/loan-refunds
- GET /api/loan-refunds
- GET /api/loan-refunds/:id
- GET /api/loan-refunds/loan/:loanId
- PATCH /api/loan-refunds/:id
- POST /api/loan-refunds/make-refund-jv

### Loan Balance Adjustments (5 endpoints)
- POST /api/loan-balance-adjustments
- GET /api/loan-balance-adjustments
- GET /api/loan-balance-adjustments/:id
- GET /api/loan-balance-adjustments/loan/:loanId
- PATCH /api/loan-balance-adjustments/:id

### Loan Restructures (7 endpoints)
- POST /api/loan-restructures
- GET /api/loan-restructures
- GET /api/loan-restructures/:id
- GET /api/loan-restructures/loan/:loanId
- PATCH /api/loan-restructures/:id
- POST /api/loan-restructures/:id/approve
- POST /api/loan-restructures/:id/reject

### Loan Transfers (4 endpoints)
- GET /api/loan-transfers
- GET /api/loan-transfers/:id
- GET /api/loan-transfers/loan/:loanId
- GET /api/loan-transfers/customer/:customerId

### Loan Partners (6 endpoints)
- POST /api/loan-partners
- GET /api/loan-partners
- GET /api/loan-partners/:id
- GET /api/loan-partners/code/:code
- PATCH /api/loan-partners/:id
- DELETE /api/loan-partners/:id

### Security Management (20+ endpoints)
- Loan Securities: CRUD
- Security Assignments: CRUD, submit, unpledge, release
- Security Prices: CRUD, current price, historical price
- Security Shortfalls: Check, resolve, get by loan
- Security Deposit: Add, use, refund, history, summary

### Accounting (5+ endpoints)
- POST /api/accounting/journal-entries
- GET /api/accounting/journal-entries
- GET /api/accounting/journal-entries/:id
- POST /api/accounting/journal-entries/:id/submit
- POST /api/accounting/journal-entries/:id/cancel
- GET /api/accounting/journal-entries/reference/:referenceType/:referenceId

### Reporting (10 endpoints)
- GET /api/reporting/portfolio
- GET /api/reporting/portfolio/export
- GET /api/reporting/npa
- GET /api/reporting/npa/export
- GET /api/reporting/collection
- GET /api/reporting/collection/export
- GET /api/reporting/disbursement
- GET /api/reporting/disbursement/export
- GET /api/reporting/overdue
- GET /api/reporting/overdue/export

### Workflows (7 endpoints)
- POST /api/workflows
- GET /api/workflows
- GET /api/workflows/:id
- GET /api/workflows/active/:documentType
- GET /api/workflows/actions/available
- POST /api/workflows/actions/perform
- GET /api/workflows/history/:documentType/:documentId
- POST /api/workflows/seed

### Calculations (3 endpoints)
- POST /api/calculations/emi
- POST /api/calculations/interest
- POST /api/calculations/penalty

---

## Total Endpoint Count

**Approximately 150+ endpoints** across all modules.

---

## Swagger UI Features

### 1. Interactive Testing
- Try out any endpoint directly from the UI
- See request/response examples
- Test with real data

### 2. Schema Documentation
- Complete request/response schemas
- Validation rules
- Data types
- Required fields

### 3. Authentication
- JWT token input
- Persistent authorization
- Test authenticated endpoints

### 4. Filtering
- Filter by tag
- Search endpoints
- Sort operations

### 5. Export
- Export OpenAPI JSON spec
- Use with Postman, Insomnia, etc.

---

## Best Practices

### 1. Always Use Swagger Decorators
- `@ApiTags()` - Group related endpoints
- `@ApiOperation()` - Describe what the endpoint does
- `@ApiResponse()` - Document all possible responses
- `@ApiParam()` - Document path parameters
- `@ApiBody()` - Document request body

### 2. Provide Examples
- Include example values in DTOs
- Show sample requests/responses
- Document error scenarios

### 3. Document Validation
- Use validation decorators
- Document required fields
- Show validation rules

### 4. Keep Documentation Updated
- Update when adding new endpoints
- Update when changing request/response
- Keep examples current

---

## Status

✅ **COMPLETE** - All endpoints are fully documented with Swagger/OpenAPI.

**Access**: `http://localhost:3000/api-docs`

---

**Last Updated**: Current Session

