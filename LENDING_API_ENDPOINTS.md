# Frappe Lending - API Endpoints Reference

## Overview
This document provides a comprehensive reference for all API endpoints (whitelist methods) available in the Frappe Lending system. These endpoints can be called from the frontend, external systems, or via REST API.

---

## API Access Methods

### 1. Frontend JavaScript
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.request_loan_closure',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        posting_date: '2024-12-01'
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

### 2. REST API
```bash
POST /api/method/lending.loan_management.doctype.loan.loan.request_loan_closure
Content-Type: application/json

{
    "loan": "ACC-LOAN-2024-00001",
    "posting_date": "2024-12-01"
}
```

### 3. Python (Server-side)
```python
from lending.loan_management.doctype.loan.loan import request_loan_closure

result = request_loan_closure(
    loan='ACC-LOAN-2024-00001',
    posting_date='2024-12-01'
)
```

---

## Loan API Endpoints

### 1. `request_loan_closure`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Request loan closure or auto-close loan

**Method**: `@frappe.whitelist()`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `posting_date` | Date | No | Posting date (default: today) |
| `auto_close` | Integer | No | Auto close flag (0 or 1, default: 0) |

**Returns**:
```json
{
    "message": "Loan Closure Requested Successfully" | "Loan Closed Successfully"
}
```

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.request_loan_closure',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        posting_date: '2024-12-01',
        auto_close: 0
    }
});
```

---

### 2. `get_loan_application`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Get loan application details

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_application` | String | Yes | Loan Application name |

**Returns**: Loan Application document as dictionary

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.get_loan_application',
    args: {
        loan_application: 'ACC-LOAP-2024-00001'
    }
});
```

---

### 3. `close_unsecured_term_loan`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Close unsecured term loan

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |

**Returns**: None (throws error if cannot close)

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.close_unsecured_term_loan',
    args: {
        loan: 'ACC-LOAN-2024-00001'
    }
});
```

---

### 4. `make_loan_disbursement`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Create loan disbursement entry

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `disbursement_amount` | Float | No | Disbursement amount (default: 0) |
| `as_dict` | Integer | No | Return as dict (0 or 1, default: 0) |
| `submit` | Integer | No | Auto submit (0 or 1, default: 0) |
| `repayment_start_date` | Date | No | Repayment start date |
| `repayment_frequency` | String | No | Repayment frequency |
| `posting_date` | Date | No | Posting date |
| `disbursement_date` | Date | No | Disbursement date |
| `bank_account` | String | No | Bank account |
| `is_term_loan` | Integer | No | Is term loan flag |

**Returns**: Loan Disbursement document or dictionary

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.make_loan_disbursement',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        disbursement_amount: 1000000,
        disbursement_date: '2024-01-15',
        submit: 1
    }
});
```

---

### 5. `make_repayment_entry`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Create loan repayment entry

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `applicant_type` | String | Yes | Applicant type |
| `applicant` | String | Yes | Applicant name |
| `loan_product` | String | Yes | Loan product |
| `company` | String | Yes | Company |
| `loan_disbursement` | String | No | Loan disbursement (optional) |
| `as_dict` | Integer | No | Return as dict (default: 0) |

**Returns**: Loan Repayment document or dictionary

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.make_repayment_entry',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        applicant_type: 'Customer',
        applicant: 'CUST-001',
        loan_product: 'HOME-LOAN-001',
        company: 'ABC Bank'
    }
});
```

---

### 6. `make_loan_write_off`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Create loan write-off entry

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `company` | String | No | Company (fetched if not provided) |
| `posting_date` | Date | No | Posting date (default: today) |
| `amount` | Float | No | Write-off amount (default: 0, auto-calculated) |
| `as_dict` | Integer | No | Return as dict (default: 0) |

**Returns**: Loan Write Off document or dictionary

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.make_loan_write_off',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        posting_date: '2024-12-01'
    }
});
```

---

### 7. `unpledge_security`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Unpledge security from loan

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | No | Loan name (if not using loan_security_assignment) |
| `loan_security_assignment` | String | No | Security assignment name |
| `security_map` | Dict/JSON | No | Security mapping |
| `as_dict` | Integer | No | Return as dict (default: 0) |

**Returns**: Unpledge document or dictionary

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.unpledge_security',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        security_map: {
            'SEC-001': 100
        }
    }
});
```

---

### 8. `get_shortfall_applicants`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Get count of applicants with security shortfall

**Parameters**: None

**Returns**:
```json
{
    "value": 5,
    "fieldtype": "Int"
}
```

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.get_shortfall_applicants'
});
```

---

### 9. `make_refund_jv`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Create refund journal entry

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `amount` | Float | No | Refund amount (default: 0) |
| `reference_number` | String | No | Reference number |
| `reference_date` | Date | No | Reference date |
| `submit` | Integer | No | Auto submit (default: 0) |

**Returns**: Journal Entry document

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.make_refund_jv',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        amount: 50000,
        reference_number: 'REF-001',
        submit: 1
    }
});
```

---

### 10. `update_days_past_due_in_loans`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Update days past due for loans

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_name` | String | No | Specific loan (optional) |
| `posting_date` | Date | No | Posting date (default: today) |
| `loan_product` | String | No | Loan product filter |
| `process_loan_classification` | String | No | Process classification name |

**Returns**: None

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.update_days_past_due_in_loans',
    args: {
        posting_date: '2024-12-01'
    }
});
```

---

### 11. `get_cyclic_date`
**Module**: `lending.loan_management.doctype.loan.loan`

**Purpose**: Get cyclic date for loan product

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_product` | String | Yes | Loan product name |
| `posting_date` | Date | Yes | Posting date |
| `ignore_bpi` | Integer | No | Ignore BPI flag (default: 0) |

**Returns**: Date string

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan.loan.get_cyclic_date',
    args: {
        loan_product: 'HOME-LOAN-001',
        posting_date: '2024-01-15'
    }
});
```

---

## Loan Application API Endpoints

### 1. `create_loan`
**Module**: `lending.loan_management.doctype.loan_application.loan_application`

**Purpose**: Create loan from approved loan application

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_name` | String | Yes | Loan Application name |
| `target_doc` | Dict | No | Target document (optional) |
| `submit` | Integer | No | Auto submit (default: 0) |

**Returns**: Loan document

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_application.loan_application.create_loan',
    args: {
        source_name: 'ACC-LOAP-2024-00001',
        submit: 0
    }
});
```

---

### 2. `create_loan_security_assignment`
**Module**: `lending.loan_management.doctype.loan_application.loan_application`

**Purpose**: Create security assignment from loan application

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_application` | String | Yes | Loan Application name |
| `loan` | String | No | Loan name (optional) |

**Returns**: Security Assignment name

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_application.loan_application.create_loan_security_assignment',
    args: {
        loan_application: 'ACC-LOAP-2024-00001',
        loan: 'ACC-LOAN-2024-00001'
    }
});
```

---

### 3. `get_proposed_pledge`
**Module**: `lending.loan_management.doctype.loan_application.loan_application`

**Purpose**: Calculate proposed pledge details

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `securities` | Array/JSON | Yes | Array of security objects |

**Security Object Structure**:
```json
{
    "loan_security": "SEC-001",
    "qty": 100,
    "amount": 1000000,
    "haircut": 20
}
```

**Returns**:
```json
{
    "securities": [...],
    "maximum_loan_amount": 800000
}
```

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_application.loan_application.get_proposed_pledge',
    args: {
        securities: [
            {
                loan_security: 'SEC-001',
                qty: 100,
                haircut: 20
            }
        ]
    }
});
```

---

### 4. `check_duplicate_customers`
**Module**: `lending.loan_management.doctype.loan_application.loan_application`

**Purpose**: Check for duplicate customers by phone/email

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `applicant_phone_number` | String | No | Phone number |
| `applicant_email_address` | String | No | Email address |

**Returns**: Array of matching customer names

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_application.loan_application.check_duplicate_customers',
    args: {
        applicant_phone_number: '+1234567890',
        applicant_email_address: 'john@example.com'
    }
});
```

---

## Loan Repayment API Endpoints

### 1. `calculate_amounts`
**Module**: `lending.loan_management.doctype.loan_repayment.loan_repayment`

**Purpose**: Calculate repayment amounts for a loan

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `against_loan` | String | Yes | Loan name |
| `posting_date` | Date | Yes | Posting date |
| `payment_type` | String | No | Repayment type |
| `with_loan_details` | Integer | No | Include loan details (default: 0) |
| `charges` | Array | No | Charge codes |
| `loan_disbursement` | String | No | Specific disbursement |
| `for_update` | Integer | No | For update flag (default: 0) |

**Returns**:
```json
{
    "penalty_amount": 0.0,
    "interest_amount": 5000.0,
    "pending_principal_amount": 950000.0,
    "payable_principal_amount": 950000.0,
    "payable_amount": 955000.0,
    "unaccrued_interest": 0.0,
    "unbooked_interest": 0.0,
    "unbooked_penalty": 0.0,
    "due_date": "2024-02-15",
    "total_charges_payable": 0.0,
    "available_security_deposit": 0.0
}
```

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_repayment.loan_repayment.calculate_amounts',
    args: {
        against_loan: 'ACC-LOAN-2024-00001',
        posting_date: '2024-02-15',
        payment_type: 'Normal Repayment',
        with_loan_details: 1
    }
});
```

---

### 2. `get_bulk_due_details`
**Module**: `lending.loan_management.doctype.loan_repayment.loan_repayment`

**Purpose**: Get due details for multiple loans

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loans` | Array | Yes | Array of loan names |
| `posting_date` | Date | Yes | Posting date |
| `consolidated` | Integer | No | Consolidated view (default: 0) |

**Returns**: Array of loan due details

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_repayment.loan_repayment.get_bulk_due_details',
    args: {
        loans: ['ACC-LOAN-2024-00001', 'ACC-LOAN-2024-00002'],
        posting_date: '2024-12-01',
        consolidated: 0
    }
});
```

---

### 3. `post_bulk_payments`
**Module**: `lending.loan_management.doctype.loan_repayment.loan_repayment`

**Purpose**: Process bulk repayments (POST method)

**Method**: `@frappe.whitelist(methods=["POST"])`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | Array | Yes | Array of repayment objects |

**Repayment Object Structure**:
```json
{
    "against_loan": "ACC-LOAN-2024-00001",
    "value_date": "2024-12-01",
    "amount_paid": 50000,
    "mode_of_payment": "Bank Transfer",
    "reference_number": "REF-001"
}
```

**Returns**: Processing results

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_repayment.loan_repayment.post_bulk_payments',
    type: 'POST',
    args: {
        data: [
            {
                against_loan: 'ACC-LOAN-2024-00001',
                value_date: '2024-12-01',
                amount_paid: 50000
            }
        ]
    }
});
```

---

## Loan Disbursement API Endpoints

### 1. `get_disbursal_amount`
**Module**: `lending.loan_management.doctype.loan_disbursement.loan_disbursement`

**Purpose**: Get available disbursal amount for loan

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |
| `on_current_security_price` | Integer | No | Use current security price (default: 0) |

**Returns**: Disbursal amount details

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_disbursement.loan_disbursement.get_disbursal_amount',
    args: {
        loan: 'ACC-LOAN-2024-00001',
        on_current_security_price: 0
    }
});
```

---

## Loan Product API Endpoints

### 1. `get_default_charge_accounts`
**Module**: `lending.loan_management.doctype.loan_product.loan_product`

**Purpose**: Get default charge accounts

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `charge_type` | String | Yes | Charge type/item |
| `company` | String | Yes | Company |

**Returns**: Account name

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_product.loan_product.get_default_charge_accounts',
    args: {
        charge_type: 'Processing Fee',
        company: 'ABC Bank'
    }
});
```

---

## Loan Partner API Endpoints

### 1. `get_colender_payout_details`
**Module**: `lending.loan_management.doctype.loan_partner.loan_partner`

**Purpose**: Get co-lender payout details

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `posting_date` | Date | Yes | Posting date |

**Returns**: Payout details for all partners

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_partner.loan_partner.get_colender_payout_details',
    args: {
        posting_date: '2024-12-01'
    }
});
```

---

## Loan Security API Endpoints

### 1. `get_loan_security_price_or_value`
**Module**: `lending.loan_management.doctype.loan_security.loan_security`

**Purpose**: Get security price or value

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_security` | String | Yes | Loan Security name |

**Returns**:
```json
{
    "qty": null,
    "value": 1000000
}
```

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_security.loan_security.get_loan_security_price_or_value',
    args: {
        loan_security: 'SEC-001'
    }
});
```

---

### 2. `get_loan_security_price`
**Module**: `lending.loan_management.doctype.loan_security_price.loan_security_price`

**Purpose**: Get security price at specific time

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_security` | String | Yes | Loan Security name |
| `valid_time` | Datetime | No | Valid time (default: now) |

**Returns**: Price value

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_security_price.loan_security_price.get_loan_security_price',
    args: {
        loan_security: 'SEC-001',
        valid_time: '2024-12-01 10:00:00'
    }
});
```

---

### 3. `get_pledged_security_qty`
**Module**: `lending.loan_management.doctype.loan_security_release.loan_security_release`

**Purpose**: Get pledged security quantity for loan

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |

**Returns**: Dictionary of security quantities

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_security_release.loan_security_release.get_pledged_security_qty',
    args: {
        loan: 'ACC-LOAN-2024-00001'
    }
});
```

---

### 4. `release_loan_security_assignment`
**Module**: `lending.loan_management.doctype.loan_security_assignment.loan_security_assignment`

**Purpose**: Release security assignment

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan_security_assignment` | String | Yes | Security Assignment name |

**Returns**: None

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_security_assignment.loan_security_assignment.release_loan_security_assignment',
    args: {
        loan_security_assignment: 'LSA-001'
    }
});
```

---

## Loan Security Shortfall API Endpoints

### 1. `add_security`
**Module**: `lending.loan_management.doctype.loan_security_shortfall.loan_security_shortfall`

**Purpose**: Add security to resolve shortfall

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loan` | String | Yes | Loan name |

**Returns**: Security Assignment name

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_security_shortfall.loan_security_shortfall.add_security',
    args: {
        loan: 'ACC-LOAN-2024-00001'
    }
});
```

---

## Loan Restructure API Endpoints

### 1. `set_completed_tenure`
**Module**: `lending.loan_management.doctype.loan_restructure.loan_restructure`

**Purpose**: Set completed tenure for restructure

**Parameters**: None (uses self.loan and self.loan_disbursement)

**Returns**: Completed tenure value

**Note**: This is a method on the Loan Restructure class, called internally

---

## Loan Transfer API Endpoints

### 1. `get_loans`
**Module**: `lending.loan_management.doctype.loan_transfer.loan_transfer`

**Purpose**: Get loans for transfer by branch/applicant

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branch` | String | Yes | Branch name |
| `applicant` | String | No | Applicant filter (optional) |

**Returns**: Array of loan names

**Example**:
```javascript
frappe.call({
    method: 'lending.loan_management.doctype.loan_transfer.loan_transfer.get_loans',
    args: {
        branch: 'Branch A',
        applicant: 'CUST-001'
    }
});
```

---

## Dashboard Chart API Endpoints

### 1. `get_data` (Top 10 Pledged Loan Securities)
**Module**: `lending.loan_management.dashboard_chart_source.top_10_pledged_loan_securities.top_10_pledged_loan_securities`

**Purpose**: Get chart data for top 10 pledged securities

**Parameters**: Standard Frappe chart parameters

**Returns**: Chart data

---

## Standard Frappe API Endpoints

All doctypes also support standard Frappe API endpoints:

### Document Operations
- `GET /api/resource/{doctype}/{name}` - Get document
- `POST /api/resource/{doctype}` - Create document
- `PUT /api/resource/{doctype}/{name}` - Update document
- `DELETE /api/resource/{doctype}/{name}` - Delete document

### List Operations
- `GET /api/resource/{doctype}` - List documents with filters

### Submit/Cancel
- `POST /api/resource/{doctype}/{name}/submit` - Submit document
- `POST /api/resource/{doctype}/{name}/cancel` - Cancel document

**Example**:
```bash
# Get loan
GET /api/resource/Loan/ACC-LOAN-2024-00001

# Create loan application
POST /api/resource/Loan%20Application
{
    "applicant_type": "Customer",
    "loan_product": "HOME-LOAN-001",
    "loan_amount": 1000000,
    "company": "ABC Bank"
}

# Submit loan
POST /api/resource/Loan/ACC-LOAN-2024-00001/submit
```

---

## Authentication

All API endpoints require authentication:

### 1. Session-based (Browser)
- Uses existing Frappe session
- Cookies automatically sent

### 2. API Key/Token
```bash
Authorization: token api_key:api_secret
```

### 3. Login Token
```bash
# First login
POST /api/method/login
{
    "usr": "administrator",
    "pwd": "password"
}

# Use session cookie or token in subsequent requests
```

---

## Error Handling

All endpoints return standard Frappe error format:

**Success Response**:
```json
{
    "message": "Success message",
    "data": {...}
}
```

**Error Response**:
```json
{
    "exc_type": "ValidationError",
    "exc": "Error message",
    "traceback": "..."
}
```

---

## Rate Limiting

- Standard Frappe rate limiting applies
- Configurable per user/role
- Default: 300 requests per minute

---

## Best Practices

1. **Always validate input**: Check parameters before calling
2. **Handle errors**: Implement proper error handling
3. **Use transactions**: For bulk operations, use transactions
4. **Cache results**: Cache frequently accessed data
5. **Batch operations**: Use bulk endpoints when available
6. **Date formats**: Use ISO format (YYYY-MM-DD) for dates
7. **Currency precision**: Respect currency precision settings

---

## API Versioning

- Current version: Uses Frappe Framework API
- No version prefix required
- Backward compatibility maintained within major versions

---

This document covers all major API endpoints. For additional endpoints or detailed implementation, refer to the source code in the respective doctype Python files.

