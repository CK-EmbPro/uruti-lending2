# Uruti Lending API Client

This directory contains a reference implementation of the Uruti Lending API client that external platforms (like urutiX) can use to integrate with the Uruti Lending Platform.

## Usage

### Installation

External platforms should copy this client implementation to their codebase and install the required dependencies:

```bash
npm install axios
# crypto is built-in to Node.js, no installation needed
```

### Basic Setup

```typescript
import { UrutiLendingClientService } from './uruti-lending-client.service';

// Create client instance
const client = UrutiLendingClientService.create({
  apiUrl: process.env.URUTI_LENDING_API_URL || 'https://api.urutilending.com/api/integration',
  apiKey: process.env.URUTI_LENDING_API_KEY!,
  webhookSecret: process.env.URUTI_LENDING_WEBHOOK_SECRET!,
  timeout: 30000, // optional, defaults to 30000ms
});
```

### Create Loan Application

```typescript
const application = await client.createApplication({
  externalReferenceId: 'TRIP-2024-001',
  loanProductCode: 'TRIP-FINANCING-001',
  companyId: 'your-company-uuid',
  requestedAmount: 50000,
  applicationType: 'Trip Financing',
  customer: {
    externalCustomerId: 'CUST-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    kycStatus: 'Verified',
    creditScore: 750,
  },
  tripId: 'TRIP-2024-001',
  tripRevenue: 60000,
  advanceAmount: 50000,
  tripStartDate: '2024-01-15',
  tripEndDate: '2024-01-20',
  expectedRevenueDate: '2024-01-25',
});

console.log('Application created:', application.loanApplicationId);
```

### Get Application Status

```typescript
const status = await client.getApplicationStatus('TRIP-2024-001');
console.log('Application status:', status.status);
console.log('Loan application ID:', status.loanApplicationId);
```

### Get Loan Status

```typescript
const loanStatus = await client.getLoanStatus('LN-2024-001');
// Or use external reference
const loanStatus2 = await client.getLoanStatus('TRIP-2024-001');
console.log('Loan status:', loanStatus.status);
console.log('Current balance:', loanStatus.currentBalance);
```

### Post Repayment

```typescript
const repayment = await client.postRepayment({
  externalReferenceId: 'PAY-2024-001',
  loanReference: 'LN-2024-001',
  amount: 10000,
  paymentDate: '2024-01-25',
  tripId: 'TRIP-2024-001',
  revenueTransactionId: 'REV-001',
  totalTripRevenue: 60000,
  repaymentPercentage: 16.67,
  processingNotes: 'Automatic repayment from trip revenue',
});

console.log('Repayment posted:', repayment.id);
```

### Verify Webhook Signature

```typescript
// In your webhook handler
app.post('/webhooks/lending', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body.toString();
  
  if (!client.verifyWebhookSignature(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const webhook = JSON.parse(payload);
  // Process webhook...
  
  res.status(200).json({ received: true });
});
```

## Error Handling

All methods throw errors that should be caught:

```typescript
try {
  const application = await client.createApplication(request);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Handle error appropriately
  }
}
```

## Configuration

The client requires the following environment variables:

- `URUTI_LENDING_API_URL` - Base URL of the Uruti Lending API
- `URUTI_LENDING_API_KEY` - Your platform's API key
- `URUTI_LENDING_WEBHOOK_SECRET` - Your platform's webhook secret

## Notes

- This is a reference implementation. External platforms should adapt it to their specific needs.
- The client includes request/response logging for debugging.
- All API calls include proper error handling and timeout configuration.
- Webhook signature verification uses timing-safe comparison to prevent timing attacks.

## See Also

- [External Platform Integration Guide](../../../../EXTERNAL_PLATFORM_INTEGRATION_GUIDE.md)
- [urutiX Quick Start Guide](../../../../URUTIX_QUICK_START_GUIDE.md)
- [urutiX Integration Example](../../../../URUTIX_INTEGRATION_EXAMPLE.md)

