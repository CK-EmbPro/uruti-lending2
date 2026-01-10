# Co-Lending Features Implementation

## ✅ Implementation Complete

All co-lending features have been implemented:

1. ✅ **Loan Partner Entity** - Complete with FLDG configuration
2. ✅ **Loan Partner Shareable** - Shareable types configuration
3. ✅ **Loan Product Loan Partner** - Many-to-many relationship
4. ✅ **Partner Share Calculation Service** - All calculation methods
5. ✅ **FLDG Trigger Service** - Automatic and manual trigger
6. ✅ **Co-lending fields in Loan entity** - All required fields
7. ✅ **API Endpoints** - Complete CRUD and FLDG endpoints

---

## Entities Created

### 1. Loan Partner (`loan_partners`)

**Fields:**
- `partnerCode` (unique)
- `partnerName`
- `partnerLoanSharePercentage` (1-99)
- `partnerBaseInterestRate`
- `effectiveDate`
- **FLDG Configuration:**
  - `fldgTriggerDpd` - DPD threshold to trigger FLDG
  - `fldgLimitCalculationComponent` - Disbursement, Outstanding Principal, or Outstanding Principal & Interest
  - `typeOfFldgApplicable` - Fixed Deposit Only, Corporate Guarantee Only, or Both
  - `fldgFixedDepositPercentage` (1-99)
  - `fldgCorporateGuaranteePercentage` (1-99)
- **Repayment Schedule Type:**
  - `repaymentScheduleType` - EMI (PMT) based, Collection at partner's percentage, POS reduction plus interest
- **Accounting Accounts:**
  - `payableAccount`
  - `receivableAccount`
  - `creditAccount`
  - `fldgAccount`
  - `partnerInterestShare`
- **Options:**
  - `enablePartnerAccounting`
  - `servicerFee`
  - `restructureOfLoansApplicable`
  - `waivingOfChargesApplicable`
- **Relationships:**
  - One-to-Many: `shareables` (LoanPartnerShareable)

### 2. Loan Partner Shareable (`loan_partner_shareables`)

**Fields:**
- `loanPartnerId`
- `shareableType` - Principal, Interest, Penalty, Processing Fee, Disbursement Fee, Other Charges
- `sharingParameter` - Collection Percentage or Loan Amount Percentage
- **For Collection Percentage:**
  - `partnerCollectionPercentage` (1-99)
  - `companyCollectionPercentage` (1-99)
- **For Loan Amount Percentage:**
  - `partnerLoanAmountPercentage` (1-99)
  - `minimumPartnerLoanAmountPercentage` (1-99)

### 3. Loan Product Loan Partner (`loan_product_loan_partners`)

**Fields:**
- `loanProductId`
- `loanPartnerId`
- `partnerLoanSharePercentage` (1-99)
- `partnerBaseInterestRate`
- `effectiveDate`
- `expiryDate`

### 4. Loan Entity Updates

**Co-lending fields added:**
- `loanPartnerId` - Link to Loan Partner
- `loanPartnerSharePercentage` - Partner's share percentage
- `loanPartnerInterestRate` - Partner's interest rate
- `loanPartnerPaymentRatio` - Payment ratio for partner
- `loanPartnerRepaymentScheduleType` - Partner's repayment schedule type
- `totalPartnerInterestShare` - Total partner interest share
- `totalPartnerPrincipalShare` - Total partner principal share
- `fldgTriggered` - Whether FLDG has been triggered
- `fldgTriggerDate` - Date when FLDG was triggered

---

## Services Created

### 1. Loan Partner Service

**Methods:**
- `create()` - Create loan partner
- `findAll()` - Get all partners
- `findOne()` - Get partner by ID
- `findByCode()` - Get partner by code
- `update()` - Update partner
- `remove()` - Delete partner
- `getPartnerSharePercentage()` - Get share percentage for a shareable type
- `shouldTriggerFldg()` - Check if FLDG should be triggered
- `calculateFldgLimit()` - Calculate FLDG limit amount

### 2. Partner Share Calculation Service

**Methods:**
- `calculateDisbursementShare()` - Calculate partner share for disbursement
- `calculateRepaymentShare()` - Calculate partner share for repayment
- `calculateInterestShare()` - Calculate partner share for interest
- `calculatePrincipalShare()` - Calculate partner share for principal
- `calculatePenaltyShare()` - Calculate partner share for penalty
- `calculateOverallPartnerShare()` - Calculate overall partner share

**Repayment Schedule Types Supported:**
1. **EMI (PMT) based**: Uses payment ratio
2. **Collection at partner's percentage**: Uses share percentage
3. **POS reduction plus interest at partner ROI**: Different logic for interest vs principal

### 3. FLDG Trigger Service

**Methods:**
- `checkAndTriggerFldg()` - Check and automatically trigger FLDG if conditions are met
- `manualTriggerFldg()` - Manually trigger FLDG
- `createFldgJournalEntry()` - Create accounting entries for FLDG

**FLDG Trigger Logic:**
- Checks if loan has a partner
- Checks if FLDG has already been triggered
- Compares loan's DPD with partner's `fldgTriggerDpd` threshold
- Calculates FLDG limit based on:
  - Disbursement amount, OR
  - Outstanding Principal, OR
  - Outstanding Principal & Interest Accrued
- Applies FLDG percentages (Fixed Deposit and/or Corporate Guarantee)
- Creates accounting entries if partner accounting is enabled

---

## API Endpoints

### Loan Partner Endpoints

**POST** `/loan-partners`
- Create a new loan partner

**GET** `/loan-partners`
- Get all loan partners

**GET** `/loan-partners/:id`
- Get loan partner by ID

**GET** `/loan-partners/code/:code`
- Get loan partner by code

**PATCH** `/loan-partners/:id`
- Update loan partner

**DELETE** `/loan-partners/:id`
- Delete loan partner

### FLDG Endpoints

**POST** `/loans/:id/trigger-fldg`
- Manually trigger FLDG for a loan

**POST** `/loans/:id/check-fldg`
- Check if FLDG should be triggered (and trigger if conditions are met)

---

## Usage Examples

### 1. Create Loan Partner

```bash
POST /loan-partners
{
  "partnerCode": "PARTNER001",
  "partnerName": "ABC Co-Lending Partner",
  "partnerLoanSharePercentage": 30,
  "partnerBaseInterestRate": 8.5,
  "effectiveDate": "2024-01-01",
  "fldgTriggerDpd": 90,
  "fldgLimitCalculationComponent": "Outstanding Principal",
  "typeOfFldgApplicable": "Both Fixed Deposit and Corporate Guarantee",
  "fldgFixedDepositPercentage": 10,
  "fldgCorporateGuaranteePercentage": 5,
  "repaymentScheduleType": "EMI (PMT) based",
  "payableAccount": "account-uuid",
  "fldgAccount": "fldg-account-uuid",
  "enablePartnerAccounting": true,
  "shareables": [
    {
      "shareableType": "Principal",
      "sharingParameter": "Loan Amount Percentage",
      "partnerLoanAmountPercentage": 30
    },
    {
      "shareableType": "Interest",
      "sharingParameter": "Collection Percentage",
      "partnerCollectionPercentage": 30,
      "companyCollectionPercentage": 70
    }
  ]
}
```

### 2. Assign Partner to Loan

```bash
PATCH /loans/{loanId}
{
  "loanPartnerId": "partner-uuid",
  "loanPartnerSharePercentage": 30,
  "loanPartnerInterestRate": 8.5,
  "loanPartnerRepaymentScheduleType": "EMI (PMT) based"
}
```

### 3. Trigger FLDG

```bash
POST /loans/{loanId}/trigger-fldg
```

**Response:**
```json
{
  "triggered": true,
  "fldgAmount": 50000,
  "message": "FLDG manually triggered. Amount: 50000"
}
```

### 4. Check FLDG

```bash
POST /loans/{loanId}/check-fldg
```

**Response:**
```json
{
  "triggered": true,
  "fldgAmount": 50000,
  "message": "FLDG triggered successfully. Amount: 50000"
}
```

---

## Integration Points

### 1. Loan Disbursement

When a loan is disbursed with a partner:
- Calculate partner share and company share
- Create separate accounting entries for partner and company
- Update `totalPartnerPrincipalShare` on loan

### 2. Loan Repayment

When a repayment is made:
- Calculate partner share based on repayment schedule type
- Allocate partner share to partner's accounts
- Update `totalPartnerInterestShare` and `totalPartnerPrincipalShare`

### 3. DPD Update

When DPD is updated:
- Automatically check FLDG trigger condition
- Trigger FLDG if DPD exceeds threshold

### 4. Accounting Entries

For partner accounting:
- Separate GL entries for partner share
- FLDG accounting entries when triggered
- Partner payable/receivable tracking

---

## Business Rules

### Partner Share Calculation

1. **Disbursement Share:**
   - Partner share = `disbursedAmount * partnerLoanSharePercentage / 100`
   - Company share = `disbursedAmount - partnerShare`

2. **Repayment Share (EMI PMT based):**
   - Partner share = `paidAmount * loanPartnerPaymentRatio / 100`

3. **Repayment Share (Collection at partner's percentage):**
   - Partner share = `paidAmount * loanPartnerSharePercentage / 100`

4. **Repayment Share (POS reduction plus interest):**
   - For Interest: `paidAmount * loanPartnerPaymentRatio / 100`
   - For Principal: `paidAmount * loanPartnerSharePercentage / 100`

### FLDG Calculation

1. **Base Amount:**
   - Disbursement: `loan.disbursedAmount`
   - Outstanding Principal: `loan.loanAmount - loan.totalPrincipalPaid`
   - Outstanding Principal & Interest: `loan.loanAmount - loan.totalPrincipalPaid + (loan.totalInterestPayable - loan.totalInterestPaid)`

2. **FLDG Amount:**
   - Fixed Deposit: `baseAmount * fldgFixedDepositPercentage / 100`
   - Corporate Guarantee: `baseAmount * fldgCorporateGuaranteePercentage / 100`
   - Both: Sum of both

3. **Trigger Condition:**
   - `loan.daysPastDue >= partner.fldgTriggerDpd`
   - `loan.fldgTriggered == false`
   - `loan.loanPartnerId != null`

---

## Database Schema

### Tables Created

1. `loan_partners` - Loan Partner master data
2. `loan_partner_shareables` - Shareable types configuration
3. `loan_product_loan_partners` - Many-to-many relationship

### Loan Table Updates

Added columns:
- `loan_partner_id`
- `loan_partner_share_percentage`
- `loan_partner_interest_rate`
- `loan_partner_payment_ratio`
- `loan_partner_repayment_schedule_type`
- `total_partner_interest_share`
- `total_partner_principal_share`
- `fldg_triggered`
- `fldg_trigger_date`

---

## Testing

### Test Scenarios

1. **Create Loan Partner**
   - Valid partner creation
   - Duplicate partner code validation
   - Percentage validation (1-99)

2. **Partner Share Calculation**
   - Disbursement share calculation
   - Repayment share calculation (all types)
   - Interest/Principal/Penalty share calculation

3. **FLDG Trigger**
   - Automatic trigger on DPD threshold
   - Manual trigger
   - FLDG amount calculation
   - Accounting entries creation

4. **Integration**
   - Loan disbursement with partner
   - Loan repayment with partner
   - DPD update with FLDG check

---

## Status

✅ **COMPLETE** - All co-lending features implemented and ready for use.

---

**Last Updated**: Current Session

