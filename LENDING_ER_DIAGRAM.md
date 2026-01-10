# Frappe Lending - Entity Relationship Diagram

## Visual Data Model Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MASTER DATA ENTITIES                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Loan Product │         │ Loan Category │         │ Loan Partner  │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ product_code │         │ category_name│         │ partner_name  │
│ product_name │         │ description   │         │ share_percent │
│ rate_of_int  │         └──────────────┘         │ interest_rate │
│ is_term_loan │                 │                  └──────────────┘
│ max_amount   │                 │                        │
│ accounts...  │                 │                        │
└──────────────┘                 │                        │
       │                          │                        │
       │ 1                        │ 1                      │ 1
       │                          │                        │
       │                          ▼                        │
       │                  ┌──────────────┐                │
       │                  │ Loan Product │                │
       │                  │  (via field) │                │
       │                  └──────────────┘                │
       │                          │                        │
       │                          │                        │
       │                          │                        │
       └──────────────────────────┼────────────────────────┘
                                  │
                                  │ N
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TRANSACTION ENTITIES                               │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ Loan         │ ◄─── Core Entity
                          ├──────────────┤
                          │ applicant    │
                          │ loan_amount  │
                          │ status       │
                          │ disbursed_amt│
                          │ totals...    │
                          └──────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │ 1                       │ 1                       │ 1
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│Loan          │         │Loan           │         │Loan           │
│Application   │         │Disbursement   │         │Repayment      │
├──────────────┤         ├──────────────┤         ├──────────────┤
│applicant     │         │disbursed_amt │         │amount_paid   │
│loan_amount   │         │disbursement_ │         │principal_paid │
│status        │         │date           │         │interest_paid │
│proposed_     │         │charges        │         │repayment_type│
│pledges       │         └──────────────┘         │details        │
└──────────────┘                 │                  └──────────────┘
        │                         │                         │
        │                         │ N                       │ N
        │                         │                         │
        │                         ▼                         ▼
        │                 ┌──────────────┐         ┌──────────────┐
        │                 │Loan           │         │Loan          │
        │                 │Disbursement   │         │Repayment     │
        │                 │Charge         │         │Detail        │
        │                 └──────────────┘         └──────────────┘
        │
        │ 1 (when approved)
        │
        └─────────────────┐
                          │
                          ▼
                  ┌──────────────┐
                  │ Loan          │
                  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │ N               │ N               │ N
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Loan          │  │Loan          │  │Loan          │
│Repayment     │  │Interest      │  │Demand        │
│Schedule      │  │Accrual       │  ├──────────────┤
├──────────────┤  ├──────────────┤  │demand_date   │
│payment_date  │  │posting_date  │  │due_date      │
│principal_amt │  │interest_amt  │  │principal_amt │
│interest_amt  │  │penalty_amt   │  │interest_amt  │
│status        │  │accrual_type  │  │status        │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          │ N
                          ▼
                  ┌──────────────┐
                  │Process Loan  │
                  │Interest      │
                  │Accrual       │
                  └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ENTITIES                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│Loan Security │         │Loan Security │         │Loan Security │
│Type          │         │              │         │Assignment    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│type_name     │         │security_code │         │loan          │
│haircut       │         │security_name │         │pledge_time   │
│uom           │         │security_type │         │release_time  │
└──────────────┘         │haircut       │         │status        │
       │                  │prices        │         │securities    │
       │ 1                └──────────────┘         └──────────────┘
       │                          │                       │
       │                          │ 1                     │ N
       │                          │                       │
       │                          ▼                       ▼
       │                  ┌──────────────┐      ┌──────────────┐
       │                  │Loan Security  │      │Pledge         │
       │                  │Price          │      ├──────────────┤
       │                  ├──────────────┤      │security       │
       │                  │price          │      │qty            │
       │                  │valid_from     │      │pledge_value   │
       │                  │valid_to       │      └──────────────┘
       │                  └──────────────┘
       │
       └──────────────────┐
                          │
                          ▼
                  ┌──────────────┐
                  │Loan Security │
                  │Shortfall     │
                  ├──────────────┤
                  │shortfall_amt │
                  │status        │
                  └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    RESTRUCTURE & ADJUSTMENT ENTITIES                    │
└─────────────────────────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │ Loan         │
                  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │ N               │ N               │ N
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Loan          │  │Loan          │  │Loan          │
│Restructure   │  │Adjustment    │  │Balance       │
├──────────────┤  ├──────────────┤  │Adjustment    │
│restructure_  │  │adjustment_   │  ├──────────────┤
│type          │  │type          │  │adjustment_   │
│restructure_  │  │adjustment_   │  │amount        │
│date          │  │amount        │  └──────────────┘
│overdue_amts  │  └──────────────┘
└──────────────┘
        │
        │ 1
        │
        ▼
┌──────────────┐
│Loan          │
│Repayment     │
│Schedule      │
│(new schedule)│
└──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      CLOSURE ENTITIES                                   │
└─────────────────────────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │ Loan         │
                  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │ 1               │ 1               │ 1
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Loan Write    │  │Loan Refund   │  │Loan Transfer │
│Off           │  ├──────────────┤  ├──────────────┤
├──────────────┤  │refund_amount │  │transfer_to   │
│write_off_amt │  │refund_date   │  │transfer_date │
│posting_date  │  └──────────────┘  │details        │
│is_settlement │                    └──────────────┘
└──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING ENTITIES (Batch Jobs)                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ Process Loan         │
│ Interest Accrual     │───► Creates: Loan Interest Accrual entries
├──────────────────────┤
│ posting_date         │
│ accrual_type         │
└──────────────────────┘

┌──────────────────────┐
│ Process Loan Demand  │───► Creates: Loan Demand entries
├──────────────────────┤
│ posting_date         │
└──────────────────────┘

┌──────────────────────┐
│ Process Loan         │───► Updates: Loan.classification_code
│ Classification       │
├──────────────────────┤
│ posting_date         │
└──────────────────────┘

┌──────────────────────┐
│ Process Loan Security│───► Creates: Loan Security Shortfall
│ Shortfall            │
├──────────────────────┤
│ posting_date         │
└──────────────────────┘

┌──────────────────────┐
│ Process Loan         │───► Updates: Loan credit limits
│ Restructure Limit    │
├──────────────────────┤
│ (monthly)            │
└──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      LOG/HISTORY ENTITIES                               │
└─────────────────────────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │ Loan         │
                  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │ N               │ N               │ N
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Days Past Due │  │Loan NPA Log  │  │Loan Freeze   │
│Log           │  ├──────────────┤  │Log           │
├──────────────┤  │npa_status    │  ├──────────────┤
│days_past_due │  │status_date   │  │freeze_status │
│status_date   │  └──────────────┘  │freeze_date   │
└──────────────┘                    └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      KEY RELATIONSHIPS                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. Loan Product (1) ──→ (N) Loan Application
2. Loan Application (1) ──→ (1) Loan (when approved)
3. Loan Product (1) ──→ (N) Loan
4. Loan (1) ──→ (N) Loan Disbursement
5. Loan (1) ──→ (N) Loan Repayment
6. Loan (1) ──→ (1) Loan Repayment Schedule (for term loans)
7. Loan (1) ──→ (N) Loan Interest Accrual
8. Loan (1) ──→ (N) Loan Demand
9. Loan (1) ──→ (N) Loan Security Assignment
10. Loan Security (1) ──→ (N) Pledge ──→ (N) Loan Security Assignment
11. Loan (1) ──→ (N) Loan Restructure
12. Loan Restructure (1) ──→ (1) Loan Repayment Schedule (new)
13. Loan Partner (1) ──→ (N) Loan
14. Loan Category (1) ──→ (N) Loan Product
15. Loan Classification (1) ──→ (N) Loan

## Status Workflows

### Loan Lifecycle:
```
Loan Application (Open)
    ↓ [Approved]
Loan (Draft)
    ↓ [Submit]
Loan (Sanctioned)
    ↓ [Disburse]
Loan Disbursement
    ↓ [Update]
Loan (Disbursed/Active)
    ↓ [Repayments]
Loan Repayment (multiple)
    ↓ [Closure]
Loan (Closed/Written Off/Settled)
```

### Security Lifecycle:
```
Loan Security Assignment (Pledge Requested)
    ↓ [Submit]
Loan Security Assignment (Pledged)
    ↓ [Release]
Loan Security Assignment (Release Requested)
    ↓ [Submit]
Loan Security Assignment (Released)
```

