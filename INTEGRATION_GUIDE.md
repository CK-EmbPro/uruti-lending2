# Third-Party Integration Guide

## Overview

This guide provides comprehensive instructions for integrating third-party platforms (like UrutiX for trip financing) with the Uruti Lending Platform.

## Quick Start

### 1. Platform Registration

Contact the Uruti Lending team to register your platform. You will receive:
- **API Key**: Used for authenticating API requests
- **API Secret**: Used for HMAC signing (if required)
- **Webhook Secret**: Used for verifying webhook signatures

### 2. Base URL

All API endpoints are available at:
```
https://api.urutilending.com/api/integration
```

For local development:
```
http://localhost:3000/api/integration
```

### 3. Authentication

All API requests require an API key in the `X-API-Key` header:

```http
X-API-Key: your-api-key-here
```

## API Endpoints

### Create Loan Application

**Endpoint:** `POST /integration/applications`

**Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**
```json
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
  "tripRevenue": 60000,
  "advanceAmount": 50000,
  "tripStartDate": "2024-01-15",
  "tripEndDate": "2024-01-20",
  "expectedRevenueDate": "2024-01-25"
}
```

**Response (201 Created):**
```json
{
  "id": "application-uuid",
  "externalReferenceId": "TRIP-12345",
  "status": "Pending",
  "loanApplicationId": "loan-app-uuid",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or duplicate external reference
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: Platform not authorized to create applications
- `404 Not Found`: Loan product not found

### Post Repayment

**Endpoint:** `POST /integration/repayments`

**Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "externalReferenceId": "PAYMENT-12345",
  "loanReference": "LOAN-001",
  "amount": 55000,
  "paymentDate": "2024-01-25",
  "tripId": "TRIP-12345",
  "revenueTransactionId": "REV-001",
  "totalTripRevenue": 60000,
  "repaymentPercentage": 91.67,
  "processingNotes": "Automatic repayment from trip revenue"
}
```

**Response (201 Created):**
```json
{
  "id": "repayment-uuid",
  "externalReferenceId": "PAYMENT-12345",
  "status": "Processed",
  "amount": 55000,
  "createdAt": "2024-01-25T10:30:00Z"
}
```

### Get Loan Status

**Endpoint:** `GET /integration/loans/:loanReference/status`

**Headers:**
```
X-API-Key: your-api-key
```

**Response (200 OK):**
```json
{
  "loanReference": "LOAN-001",
  "loanId": "loan-uuid",
  "status": "Disbursed",
  "loanAmount": 50000,
  "outstandingBalance": 45000,
  "nextPaymentDate": "2024-02-01",
  "nextPaymentAmount": 5000
}
```

### Get Application Status

**Endpoint:** `GET /integration/applications/:externalReferenceId`

**Headers:**
```
X-API-Key: your-api-key
```

**Response (200 OK):**
```json
{
  "externalReferenceId": "TRIP-12345",
  "status": "Approved",
  "loanApplicationId": "loan-app-uuid",
  "loanId": "loan-uuid",
  "requestedAmount": 50000,
  "approvedAmount": 50000,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

## Webhook Notifications

### Webhook Configuration

Configure your webhook URL in the platform settings. Webhooks are sent with HMAC-SHA256 signatures for security.

### Webhook Headers

```
X-Webhook-Signature: <hmac-signature>
X-Platform-Code: <platform-code>
X-Webhook-Event: <event-type>
Content-Type: application/json
```

### Webhook Payload Format

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

### Webhook Events

1. **loan.status.updated**
   - Triggered when loan status changes
   - Data includes: `externalReferenceId`, `loanId`, `status`

2. **application.approved**
   - Triggered when application is approved
   - Data includes: `externalReferenceId`, `loanApplicationId`, `approvedAmount`

3. **application.rejected**
   - Triggered when application is rejected
   - Data includes: `externalReferenceId`, `loanApplicationId`, `rejectionReason`

4. **repayment.posted**
   - Triggered when repayment is processed
   - Data includes: `externalReferenceId`, `loanReference`, `amount`, `paymentDate`

5. **customer.created**
   - Triggered when customer is created
   - Data includes: `externalCustomerId`, `customerId`, `email`

### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(payload).digest('hex');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

// In your webhook handler
const signature = req.headers['x-webhook-signature'];
const isValid = verifyWebhook(JSON.stringify(req.body), signature, webhookSecret);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input data or business rule violation
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: Platform not authorized for the requested operation
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate external reference
- `500 Internal Server Error`: Server error

### Best Practices

1. **Idempotency**: Use unique `externalReferenceId` for each request
2. **Retry Logic**: Implement exponential backoff for failed requests
3. **Error Logging**: Log all errors for debugging
4. **Webhook Verification**: Always verify webhook signatures
5. **Rate Limiting**: Respect rate limits (default: 1000 requests/minute)

## Integration Flow Example: Trip Financing

### Step 1: Create Application

```javascript
const response = await fetch('https://api.urutilending.com/api/integration/applications', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    externalReferenceId: 'TRIP-12345',
    loanProductCode: 'TRIP-FINANCING-001',
    companyId: 'company-uuid',
    requestedAmount: 50000,
    applicationType: 'Trip Financing',
    customer: {
      externalCustomerId: 'CUST-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    tripId: 'TRIP-12345',
    tripRevenue: 60000,
    advanceAmount: 50000,
  }),
});

const application = await response.json();
```

### Step 2: Handle Webhook Notification

```javascript
// Application approved webhook
app.post('/webhooks/lending', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  if (!verifyWebhook(JSON.stringify(req.body), signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  if (event === 'application.approved') {
    // Disburse funds to transporter
    disburseFunds(data.externalReferenceId, data.approvedAmount);
  }
  
  res.status(200).send('OK');
});
```

### Step 3: Post Repayment

```javascript
// After trip completion and revenue collection
const response = await fetch('https://api.urutilending.com/api/integration/repayments', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    externalReferenceId: 'PAYMENT-12345',
    loanReference: 'LOAN-001',
    amount: 55000,
    paymentDate: '2024-01-25',
    tripId: 'TRIP-12345',
    totalTripRevenue: 60000,
  }),
});
```

## Testing

### Test Webhook Endpoint

Use the admin panel to test webhooks:
1. Navigate to `/integrations/platforms`
2. Select your platform
3. Click "Test Webhook"
4. Choose event type and send test webhook

### Sandbox Environment

For testing, use the sandbox environment:
```
https://sandbox.urutilending.com/api/integration
```

## Support

For integration support:
- Email: integrations@urutilending.com
- Documentation: https://docs.urutilending.com/integrations
- Status Page: https://status.urutilending.com

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Rotate API keys** regularly
3. **Use HTTPS** for all API calls
4. **Verify webhook signatures** always
5. **Implement rate limiting** on your side
6. **Log all API interactions** for audit
7. **Use environment variables** for credentials

## Rate Limits

Default rate limit: **1000 requests per minute per platform**

If you exceed the limit, you'll receive a `429 Too Many Requests` response. Implement exponential backoff when this occurs.

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- Support for trip financing
- Webhook notifications
- Application and repayment APIs

