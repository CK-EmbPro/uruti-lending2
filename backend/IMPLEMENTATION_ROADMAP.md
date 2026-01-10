# Implementation Roadmap - Business Rules & Missing Features

## Current Status

### ✅ What Was Implemented
1. **Basic `get_disbursal_amount` endpoint** - Core endpoint structure
2. **Basic business rules**:
   - Loan status validation (SANCTIONED only)
   - Disbursement amount validation (cannot exceed loan amount)
   - Partial disbursement support
   - Term loan constraints
   - Basic pending principal calculation

### ⚠️ What's Incomplete (Business Rules Missing)

#### 1. Security Shortfall Check (CRITICAL)
**Current State**: Commented out in code
```typescript
// if (loan.isSecuredLoan) {
//   const shortfall = await this.checkSecurityShortfall(loanId);
//   if (shortfall) {
//     return { disbursalAmount: 0, pendingPrincipalAmount: 0 };
//   }
// }
```

**Business Rule from Frappe**:
- If secured loan has pending security shortfall → disbursal amount = 0
- Must check `LoanSecurityShortfall` entity with status = "Pending"

**Required**:
- ❌ `LoanSecurityShortfall` entity
- ❌ `LoanSecurityShortfallService` 
- ❌ Shortfall check method

---

#### 2. Security Value Calculation (HIGH PRIORITY)
**Current State**: Using fallback (loan amount)
```typescript
// Use current security price (would need LoanSecurityPrice entity)
// For now, use loan amount as fallback
securityValue = Number(loan.loanAmount);
```

**Business Rules from Frappe**:

**A. Current Security Price** (`onCurrentSecurityPrice = true`):
- Calculate: `sum(pledged_qty * current_security_price * (1 - haircut/100))`
- Requires:
  - ❌ `LoanSecurityPrice` entity (with valid_from, valid_upto)
  - ❌ `LoanSecurityAssignment` entity (with pledged securities)
  - ❌ `get_pledged_security_qty()` method
  - ❌ `get_loan_security_price()` method

**B. Maximum Amount as per Pledged Security** (`onCurrentSecurityPrice = false`):
- Use: `loan.maximum_loan_amount` (set during security assignment)
- Requires:
  - ❌ `maximumLoanAmount` field on `Loan` entity
  - ❌ `LoanSecurityAssignment` entity/service
  - ❌ Security assignment workflow

---

#### 3. Pending Principal Calculation (MEDIUM PRIORITY)
**Current State**: Simplified calculation
```typescript
const pendingPrincipalAmount = Math.max(
  0,
  Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
);
```

**Business Rules from Frappe**:

**For Term Loans** (Current implementation is OK):
- `pending = disbursed_amount - total_principal_paid`

**For Line of Credit** (MISSING):
- Per-disbursement tracking required
- Formula: `sum(disbursed_amount - principal_amount_paid)` for each disbursement
- Requires:
  - ❌ `principalAmountPaid` field on `LoanDisbursement` entity
  - ❌ Per-disbursement principal tracking

**For Disbursed/Closed/Active Loans**:
- Formula: `total_payment + debit_adjustment - credit_adjustment - total_principal_paid - total_interest_payable`
- Requires:
  - ❌ `totalPayment` field on `Loan` entity
  - ❌ `debitAdjustmentAmount` field
  - ❌ `creditAdjustmentAmount` field
  - ❌ `totalInterestPayable` field

---

#### 4. Additional Loan Fields (MEDIUM PRIORITY)
**Missing fields on `Loan` entity**:
- ❌ `maximumLoanAmount` - Maximum loan amount based on security
- ❌ `totalPayment` - Total payment amount
- ❌ `debitAdjustmentAmount` - Debit adjustments
- ❌ `creditAdjustmentAmount` - Credit adjustments
- ❌ `refundAmount` - Refund amount
- ❌ `totalInterestPayable` - Total interest payable

---

## Implementation Roadmap

### Phase 1: Core Security Infrastructure (HIGH PRIORITY)
**Goal**: Enable proper security-based disbursal calculation

#### Step 1.1: Add Missing Loan Fields
```typescript
// Add to Loan entity
@Column('decimal', { precision: 15, scale: 2, nullable: true })
maximumLoanAmount: number;

@Column('decimal', { precision: 15, scale: 2, default: 0 })
totalPayment: number;

@Column('decimal', { precision: 15, scale: 2, default: 0 })
debitAdjustmentAmount: number;

@Column('decimal', { precision: 15, scale: 2, default: 0 })
creditAdjustmentAmount: number;

@Column('decimal', { precision: 15, scale: 2, default: 0 })
refundAmount: number;

@Column('decimal', { precision: 15, scale: 2, default: 0 })
totalInterestPayable: number;
```

#### Step 1.2: Create Loan Security Assignment Entity
```typescript
@Entity('loan_security_assignments')
export class LoanSecurityAssignment {
  id: string;
  loanId: string;
  loanApplicationId?: string;
  status: 'Pledge Requested' | 'Pledged' | 'Released' | 'Cancelled';
  pledgeTime?: Date;
  releaseTime?: Date;
  totalSecurityValue: number;
  maximumLoanValue: number;
  // Relationship to Pledge table
  pledges: Pledge[];
}
```

#### Step 1.3: Create Loan Security Price Entity
```typescript
@Entity('loan_security_prices')
export class LoanSecurityPrice {
  id: string;
  loanSecurityId: string;
  price: number;
  validFrom: Date;
  validUpto: Date;
}
```

#### Step 1.4: Create Loan Security Shortfall Entity
```typescript
@Entity('loan_security_shortfalls')
export class LoanSecurityShortfall {
  id: string;
  loanId: string;
  status: 'Pending' | 'Resolved';
  shortfallAmount: number;
  shortfallRatio: number;
  securityValue: number;
  outstandingAmount: number;
}
```

---

### Phase 2: Implement Security Services (HIGH PRIORITY)

#### Step 2.1: LoanSecurityAssignmentService
- `create()` - Create security assignment
- `getPledgedSecurityQty(loanId)` - Get pledged quantities
- `getMaximumLoanAmount(loanId)` - Get max loan amount from securities
- `release()` - Release security

#### Step 2.2: LoanSecurityPriceService
- `getCurrentPrice(securityId, date?)` - Get current price
- `getPriceAtDate(securityId, date)` - Get historical price
- `create()` - Create price entry

#### Step 2.3: LoanSecurityShortfallService
- `checkShortfall(loanId)` - Check if shortfall exists
- `createShortfall()` - Create shortfall record
- `resolveShortfall()` - Mark as resolved

---

### Phase 3: Complete Business Rules (MEDIUM PRIORITY)

#### Step 3.1: Update `getDisbursalAmount()` Method
```typescript
async getDisbursalAmount(
  loanId: string,
  onCurrentSecurityPrice: boolean = false,
): Promise<{ disbursalAmount: number; pendingPrincipalAmount: number }> {
  // 1. Get loan with all required fields
  // 2. Check security shortfall (if secured)
  // 3. Calculate pending principal (with proper logic for term/line of credit)
  // 4. Calculate security value:
  //    - If onCurrentSecurityPrice: use current prices
  //    - Else: use maximumLoanAmount
  // 5. Calculate disbursal amount
  // 6. Apply term loan constraints
}
```

#### Step 3.2: Implement Proper Pending Principal Calculation
```typescript
private calculatePendingPrincipal(loan: Loan): number {
  if (loan.status === LoanStatus.CANCELLED) {
    return 0;
  }
  
  if (loan.repaymentScheduleType === RepaymentScheduleType.LINE_OF_CREDIT) {
    // Per-disbursement calculation
    return this.calculateLineOfCreditPendingPrincipal(loan.id);
  }
  
  if ([LoanStatus.DISBURSED, LoanStatus.CLOSED, LoanStatus.ACTIVE].includes(loan.status)) {
    return Number(loan.totalPayment) 
      + Number(loan.debitAdjustmentAmount)
      - Number(loan.creditAdjustmentAmount)
      - Number(loan.totalPrincipalPaid)
      - Number(loan.totalInterestPayable);
  }
  
  // Default: disbursed - principal paid
  return Number(loan.disbursedAmount) 
    + Number(loan.debitAdjustmentAmount)
    - Number(loan.creditAdjustmentAmount)
    - Number(loan.totalPrincipalPaid);
}
```

#### Step 3.3: Implement Security Value Calculation
```typescript
private async calculateSecurityValue(
  loan: Loan,
  onCurrentSecurityPrice: boolean,
): Promise<number> {
  if (!loan.isSecuredLoan) {
    return Number(loan.loanAmount);
  }
  
  if (onCurrentSecurityPrice) {
    return await this.getTotalPledgedSecurityValue(loan.id);
  } else {
    return Number(loan.maximumLoanAmount) || Number(loan.loanAmount);
  }
}

private async getTotalPledgedSecurityValue(loanId: string): Promise<number> {
  // Get pledged securities
  // Get current prices
  // Calculate: sum(qty * price * (1 - haircut/100))
}
```

---

### Phase 4: Enhance Disbursement Entity (LOW PRIORITY)

#### Step 4.1: Add Principal Tracking to Disbursement
```typescript
// Add to LoanDisbursement entity
@Column('decimal', { precision: 15, scale: 2, default: 0 })
principalAmountPaid: number;
```

This enables per-disbursement tracking for Line of Credit loans.

---

## Priority Matrix

| Feature | Priority | Impact | Effort | Status |
|---------|----------|--------|--------|--------|
| Security Shortfall Check | 🔴 CRITICAL | HIGH | MEDIUM | ❌ Not Started |
| Maximum Loan Amount Field | 🔴 CRITICAL | HIGH | LOW | ❌ Not Started |
| Security Assignment Entity | 🔴 CRITICAL | HIGH | HIGH | ❌ Not Started |
| Security Price Entity | 🟠 HIGH | MEDIUM | MEDIUM | ❌ Not Started |
| Security Value Calculation | 🟠 HIGH | MEDIUM | MEDIUM | ⚠️ Partial |
| Pending Principal (Line of Credit) | 🟡 MEDIUM | MEDIUM | MEDIUM | ❌ Not Started |
| Additional Loan Fields | 🟡 MEDIUM | LOW | LOW | ❌ Not Started |
| Principal Tracking per Disbursement | 🟢 LOW | LOW | LOW | ❌ Not Started |

---

## Next Steps (Recommended Order)

1. **Add `maximumLoanAmount` field to Loan entity** (Quick win)
2. **Create LoanSecurityShortfall entity** (Enable shortfall check)
3. **Create LoanSecurityAssignment entity** (Foundation for security)
4. **Implement shortfall check in `getDisbursalAmount()`**
5. **Create LoanSecurityPrice entity** (Enable current price calculation)
6. **Implement security value calculation methods**
7. **Add missing loan fields** (totalPayment, adjustments, etc.)
8. **Implement proper pending principal calculation**

---

## Testing Checklist

Once implemented, test:
- ✅ Disbursal amount = 0 when security shortfall exists
- ✅ Disbursal amount calculated correctly with current security prices
- ✅ Disbursal amount calculated correctly with maximum loan amount
- ✅ Pending principal calculated correctly for term loans
- ✅ Pending principal calculated correctly for line of credit
- ✅ Term loan constraints applied correctly
- ✅ Unsecured loans use loan amount as security value

---

## Notes

- Current implementation provides **basic functionality** but lacks **critical business rules**
- Security-related features are **blocking** proper disbursal calculation
- Most missing features are **data model** issues (entities/fields)
- Business logic is **partially implemented** but needs completion

