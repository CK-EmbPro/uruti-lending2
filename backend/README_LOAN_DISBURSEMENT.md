# Loan Disbursement Module - Quick Reference Guide

## 🚀 Quick Start

### Base URL
```
/api/loan-disbursements
```

### Authentication
All endpoints require JWT Bearer token authentication.

---

## 📋 API Endpoints

### 1. Create Disbursement
**POST** `/api/loan-disbursements`

Creates a new loan disbursement with full validation.

**Request Body**:
```json
{
  "loanId": "uuid",
  "disbursementDate": "2024-01-15",
  "disbursedAmount": 100000,
  "referenceNumber": "DISB-001",
  "modeOfPayment": "Bank Transfer"
}
```

**Success Response** (201):
```json
{
  "id": "uuid",
  "loanId": "uuid",
  "disbursementDate": "2024-01-15",
  "disbursedAmount": 100000,
  "referenceNumber": "DISB-001",
  "modeOfPayment": "Bank Transfer",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Error Responses**:
- `400` - Invalid input, loan status invalid, or amount exceeds limit
- `404` - Loan not found

---

### 2. Get Disbursal Amount ⭐
**GET** `/api/loan-disbursements/disbursal-amount/:loanId`

Calculates available disbursal amount based on security value and pending principal.

**Query Parameters**:
- `onCurrentSecurityPrice` (optional, boolean) - Use current security prices (default: false)

**Example**:
```
GET /api/loan-disbursements/disbursal-amount/abc-123?onCurrentSecurityPrice=true
```

**Success Response** (200):
```json
{
  "disbursalAmount": 500000,
  "pendingPrincipalAmount": 200000
}
```

**Business Rules**:
- Returns `disbursalAmount: 0` if security shortfall exists
- Calculates pending principal based on loan type and status
- Uses current security prices if `onCurrentSecurityPrice=true`
- Applies term loan constraints

**Error Responses**:
- `404` - Loan not found

---

### 3. List Disbursements
**GET** `/api/loan-disbursements`

Retrieves all disbursements, optionally filtered by loan.

**Query Parameters**:
- `loanId` (optional, string) - Filter by loan ID

**Example**:
```
GET /api/loan-disbursements?loanId=abc-123
```

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "loanId": "uuid",
    "disbursementDate": "2024-01-15",
    "disbursedAmount": 100000,
    ...
  }
]
```

---

### 4. Get Disbursement by ID
**GET** `/api/loan-disbursements/:id`

Retrieves a specific disbursement by its ID.

**Success Response** (200):
```json
{
  "id": "uuid",
  "loanId": "uuid",
  "disbursementDate": "2024-01-15",
  "disbursedAmount": 100000,
  ...
}
```

**Error Responses**:
- `404` - Disbursement not found

---

### 5. Get Disbursements by Loan
**GET** `/api/loan-disbursements/loan/:loanId`

Retrieves all disbursements for a specific loan.

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "loanId": "uuid",
    "disbursementDate": "2024-01-15",
    "disbursedAmount": 100000,
    ...
  }
]
```

---

### 6. Update Disbursement
**PATCH** `/api/loan-disbursements/:id`

Updates an existing disbursement (only for SANCTIONED/PARTIALLY_DISBURSED loans).

**Request Body** (all fields optional):
```json
{
  "disbursementDate": "2024-01-16",
  "disbursedAmount": 150000,
  "referenceNumber": "DISB-001-UPDATED",
  "modeOfPayment": "Wire Transfer"
}
```

**Success Response** (200):
```json
{
  "id": "uuid",
  "loanId": "uuid",
  "disbursementDate": "2024-01-16",
  "disbursedAmount": 150000,
  ...
}
```

**Error Responses**:
- `400` - Invalid input, loan status prevents update, or amount exceeds limit
- `404` - Disbursement or loan not found

**Note**: Cannot update if loan is DISBURSED, ACTIVE, or CLOSED.

---

### 7. Delete Disbursement
**DELETE** `/api/loan-disbursements/:id`

Permanently deletes a disbursement (only for SANCTIONED/PARTIALLY_DISBURSED loans).

**Success Response** (204): No content

**Error Responses**:
- `400` - Loan status prevents deletion (loan is DISBURSED, ACTIVE, or CLOSED)
- `404` - Disbursement or loan not found

**Note**: Automatically recalculates loan disbursed amount and updates loan status.

---

## 🔒 Business Rules

### Disbursement Creation
1. **Loan Status**: Must be `SANCTIONED` or `PARTIALLY_DISBURSED`
2. **Disbursement Date**: Must be >= loan posting date
3. **Minimum Days**: Must respect `minDaysBwDisbursementFirstRepayment` from loan product
4. **Amount**: Must be > 0 and cannot exceed remaining loan amount
5. **Status Update**: Automatically updates loan status:
   - `DISBURSED` if fully disbursed
   - `PARTIALLY_DISBURSED` if partially disbursed

### Disbursal Amount Calculation
1. **Security Shortfall**: Returns 0 if pending shortfall exists
2. **Pending Principal**: Calculated based on loan type:
   - Line of Credit: Simplified calculation
   - Disbursed/Active/Closed: Full formula with adjustments
   - Other statuses: Default calculation
3. **Security Value**:
   - Current price mode: Uses current market prices
   - Maximum amount mode: Uses `maximumLoanAmount` from assignments
4. **Term Loan Constraints**: Cannot exceed remaining loan amount

### Update/Delete Restrictions
- Cannot update/delete if loan is `DISBURSED`, `ACTIVE`, or `CLOSED`
- Only allowed for `SANCTIONED` or `PARTIALLY_DISBURSED` loans

---

## 🔐 Security Features

### Security Shortfall Detection
- Automatically checks for pending security shortfalls
- Returns `disbursalAmount: 0` if shortfall exists
- Prevents disbursement when security is insufficient

### Security Value Calculation
- Supports current market price calculation
- Supports maximum loan amount from assignments
- Handles unsecured loans correctly

---

## 📊 Transaction Management

All critical operations use database transactions:
- **Create**: Disbursement + Loan update (atomic)
- **Update**: Disbursement + Loan recalculation (atomic)
- **Delete**: Disbursement deletion + Loan recalculation (atomic)

**Benefits**:
- Data consistency guaranteed
- Automatic rollback on errors
- No partial updates

---

## 📝 Logging

All operations are logged:
- **Success**: Operation details logged
- **Errors**: Error messages and stack traces logged

**Log Format**:
```
[LoanDisbursementService] Disbursement created: {id} for loan: {loanId}, amount: {amount}
[LoanDisbursementService] Failed to create disbursement: {error}
```

---

## 🧪 Testing Examples

### Create Disbursement
```bash
curl -X POST http://localhost:3000/api/loan-disbursements \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "abc-123",
    "disbursementDate": "2024-01-15",
    "disbursedAmount": 100000,
    "referenceNumber": "DISB-001"
  }'
```

### Get Disbursal Amount
```bash
curl -X GET "http://localhost:3000/api/loan-disbursements/disbursal-amount/abc-123?onCurrentSecurityPrice=true" \
  -H "Authorization: Bearer {token}"
```

---

## ⚠️ Common Errors

### 400 Bad Request
- **Loan status invalid**: Loan must be SANCTIONED or PARTIALLY_DISBURSED
- **Date validation**: Disbursement date before posting date
- **Amount exceeds limit**: Total disbursed exceeds loan amount
- **Minimum days**: Days between disbursement and repayment < minimum required

### 404 Not Found
- **Loan not found**: Loan ID doesn't exist
- **Disbursement not found**: Disbursement ID doesn't exist

---

## 📚 Related Documentation

- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Full feature summary
- `BUSINESS_RULES_IMPLEMENTATION.md` - Business rules details
- `TRANSACTION_MANAGEMENT_IMPLEMENTATION.md` - Transaction details
- Swagger UI: `/api/docs` - Interactive API documentation

---

## 🎯 Quick Tips

1. **Always check disbursal amount** before creating disbursement
2. **Use current security prices** for real-time calculations
3. **Monitor logs** for operation tracking
4. **Verify loan status** before update/delete operations
5. **Check security shortfall** status for secured loans

---

**Last Updated**: Current
**Version**: 1.0.0
**Status**: ✅ Production Ready

