# Trip Financing & Third-Party Platform Integration

## Overview

This document describes the implementation of Trip Financing and third-party platform integration for the Uruti Lending Platform. This enables external platforms like UrutiX to create loan applications, post repayments, and receive webhook notifications.

## Architecture

### Components

1. **Third-Party Platform Management**
   - Platform registration and authentication
   - API key management
   - Webhook configuration
   - Permission management

2. **External Loan Application**
   - Create loan applications from external platforms
   - Link external references (trip IDs, order IDs, etc.)
   - Track application status across systems

3. **External Repayment Processing**
   - Post repayments from external platforms
   - Automatic repayment from trip revenue
   - Repayment tracking and reconciliation

4. **Webhook System**
   - Loan status change notifications
   - Application approval/rejection notifications
   - Secure webhook signature verification

## Use Case: Trip Financing

### Actors
- **Transporter**: Truck owner who needs advance payment
- **UrutiX Platform**: Cargo and truck matching platform
- **Uruti Lending**: Lending platform
- **Payment Provider**: Payment service provider

### Flow

1. **Trip Finance Request**
   - Transporter submits trip finance request on UrutiX
   - UrutiX validates KYC, transporter eligibility, and credit score

2. **Application Creation**
   - UrutiX creates customer (if new) and loan application in Uruti Lending
   - Loan status is set to PENDING
   - External reference (trip ID) is linked

3. **Loan Approval**
   - Lender reviews application or auto-approval is triggered based on score
   - Uruti Lending sends loan approval/rejection via webhook to UrutiX

4. **Disbursement**
   - Upon approval, UrutiX triggers disbursement to transporter via wallet or PSP
   - Loan status updated to DISBURSED

5. **Trip Completion & Repayment**
   - Transporter completes the trip; trip revenue is collected
   - UrutiX automatically deducts repayment from trip revenue
   - UrutiX posts repayment to Uruti Lending
   - Loan status updated to REPAID or PARTIAL if applicable

## API Endpoints

### Create External Loan Application

```http
POST /integration/applications
Headers:
  X-API-Key: <platform-api-key>
Content-Type: application/json

{
  "externalReferenceId": "TRIP-12345",
  "loanProductCode": "TRIP-FINANCING-001",
  "companyId": "company-uuid",
  "requestedAmount": 50000,
  "applicationType": "Trip Financing",
  "customer": {
    "externalCustomerId": "CUST-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "kycStatus": "Verified",
    "creditScore": 750
  },
  "tripId": "TRIP-12345",
  "cargoOwnerId": "CARGO-001",
  "transporterId": "TRANS-001",
  "tripRevenue": 60000,
  "advanceAmount": 50000,
  "tripStartDate": "2024-01-15",
  "tripEndDate": "2024-01-20",
  "expectedRevenueDate": "2024-01-25"
}
```

### Post External Repayment

```http
POST /integration/repayments
Headers:
  X-API-Key: <platform-api-key>
Content-Type: application/json

{
  "externalReferenceId": "PAYMENT-12345",
  "loanReference": "LOAN-001", // or externalReferenceId
  "amount": 55000,
  "paymentDate": "2024-01-25",
  "tripId": "TRIP-12345",
  "revenueTransactionId": "REV-001",
  "totalTripRevenue": 60000,
  "repaymentPercentage": 91.67,
  "processingNotes": "Automatic repayment from trip revenue"
}
```

### Get Loan Status

```http
GET /integration/loans/:loanReference/status
Headers:
  X-API-Key: <platform-api-key>
```

### Get External Application Status

```http
GET /integration/applications/:externalReferenceId
Headers:
  X-API-Key: <platform-api-key>
```

## Webhook Notifications

### Webhook Events

1. **loan.status.updated**
   - Triggered when loan status changes
   - Payload:
     ```json
     {
       "event": "loan.status.updated",
       "timestamp": "2024-01-15T10:30:00Z",
       "data": {
         "externalReferenceId": "TRIP-12345",
         "loanId": "loan-uuid",
         "status": "Disbursed"
       }
     }
     ```

2. **application.approved**
   - Triggered when application is approved
   - Payload:
     ```json
     {
       "event": "application.approved",
       "timestamp": "2024-01-15T10:30:00Z",
       "data": {
         "externalReferenceId": "TRIP-12345",
         "loanApplicationId": "app-uuid",
         "approvedAmount": 50000
       }
     }
     ```

3. **application.rejected**
   - Triggered when application is rejected
   - Payload:
     ```json
     {
       "event": "application.rejected",
       "timestamp": "2024-01-15T10:30:00Z",
       "data": {
         "externalReferenceId": "TRIP-12345",
         "loanApplicationId": "app-uuid",
         "rejectionReason": "Insufficient credit score"
       }
     }
     ```

### Webhook Security

Webhooks are signed using HMAC-SHA256. The signature is sent in the `X-Webhook-Signature` header.

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}
```

## Database Schema

### third_party_platforms
- Platform registration and configuration
- API keys and secrets
- Webhook URLs and permissions

### external_loan_applications
- Links external references to internal loan applications
- Trip financing specific fields
- Status tracking

### external_repayments
- Tracks repayments from external platforms
- Trip revenue information
- Reconciliation data

## Configuration

### Platform Registration

1. Create platform record:
   ```typescript
   {
     platformCode: 'URUTIX',
     platformName: 'UrutiX Platform',
     apiKey: 'generated-api-key',
     apiSecret: 'generated-secret',
     webhookUrl: 'https://urutix.com/webhooks/lending',
     webhookSecret: 'webhook-secret',
     canCreateCustomers: true,
     canCreateApplications: true,
     canPostRepayments: true,
     canQueryLoanStatus: true
   }
   ```

2. Generate API key:
   ```typescript
   const apiKey = crypto.randomBytes(32).toString('hex');
   ```

## Integration Steps for UrutiX

1. **Register Platform**
   - Contact Uruti Lending to register UrutiX as a third-party platform
   - Receive API key and webhook secret

2. **Configure Webhook**
   - Set up webhook endpoint to receive notifications
   - Implement signature verification

3. **Create Loan Product**
   - Configure "Trip Financing" loan product in Uruti Lending
   - Set appropriate interest rates and terms

4. **Implement Integration**
   - Create loan applications when trip finance is requested
   - Post repayments when trip revenue is collected
   - Handle webhook notifications for status updates

## Security Considerations

1. **API Key Authentication**
   - All API requests require valid API key
   - API keys are platform-specific
   - Rate limiting per platform

2. **Webhook Signature Verification**
   - All webhooks are signed with HMAC-SHA256
   - Recipients must verify signatures

3. **Data Validation**
   - All input data is validated
   - External references are unique per platform
   - Amount validations and business rules apply

## Error Handling

### Common Errors

1. **401 Unauthorized**
   - Invalid or missing API key
   - Platform is inactive

2. **400 Bad Request**
   - Invalid input data
   - Duplicate external reference
   - Business rule violation

3. **404 Not Found**
   - Loan or application not found
   - Platform not found

## Future Enhancements

1. **Auto-Approval Rules**
   - Configurable auto-approval based on credit score
   - Risk-based pricing

2. **Real-time Status Updates**
   - WebSocket support for real-time updates
   - Push notifications

3. **Bulk Operations**
   - Bulk application creation
   - Bulk repayment posting

4. **Advanced Reconciliation**
   - Automatic reconciliation reports
   - Discrepancy detection

5. **Multi-Currency Support**
   - Support for different currencies
   - Exchange rate handling

