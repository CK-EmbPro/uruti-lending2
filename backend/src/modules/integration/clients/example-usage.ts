/**
 * Example Usage of Uruti Lending API Client
 * 
 * This file demonstrates how external platforms (like urutiX) should use
 * the Uruti Lending API client to integrate with the lending platform.
 * 
 * Copy this example and adapt it to your platform's needs.
 */

import { UrutiLendingClientService } from './uruti-lending-client.service';

// Example 1: Initialize the client
function initializeClient() {
  const client = UrutiLendingClientService.create({
    apiUrl: process.env.URUTI_LENDING_API_URL || 'https://api.urutilending.com/api/integration',
    apiKey: process.env.URUTI_LENDING_API_KEY!,
    webhookSecret: process.env.URUTI_LENDING_WEBHOOK_SECRET!,
    timeout: 30000,
  });

  return client;
}

// Example 2: Create a loan application for a trip
export async function createTripFinanceApplication(
  tripData: {
    tripNumber: string;
    transporterId: string;
    transporterName: string;
    transporterEmail: string;
    transporterPhone: string;
    advanceAmount: number;
    tripRevenue: number;
    startDate: string;
    endDate: string;
    expectedPaymentDate: string;
  },
) {
  const client = initializeClient();

  try {
    const application = await client.createApplication({
      externalReferenceId: tripData.tripNumber,
      loanProductCode: process.env.LOAN_PRODUCT_CODE || 'TRIP-FINANCING-001',
      companyId: process.env.COMPANY_ID!,
      requestedAmount: tripData.advanceAmount,
      applicationType: 'Trip Financing',
      customer: {
        externalCustomerId: tripData.transporterId,
        firstName: tripData.transporterName.split(' ')[0],
        lastName: tripData.transporterName.split(' ').slice(1).join(' ') || '',
        email: tripData.transporterEmail,
        phone: tripData.transporterPhone,
      },
      tripId: tripData.tripNumber,
      tripRevenue: tripData.tripRevenue,
      advanceAmount: tripData.advanceAmount,
      tripStartDate: tripData.startDate,
      tripEndDate: tripData.endDate,
      expectedRevenueDate: tripData.expectedPaymentDate,
    });

    console.log('Loan application created:', application);
    return application;
  } catch (error) {
    console.error('Failed to create loan application:', error);
    throw error;
  }
}

// Example 3: Check application status
export async function checkApplicationStatus(tripNumber: string) {
  const client = initializeClient();

  try {
    const status = await client.getApplicationStatus(tripNumber);
    console.log('Application status:', status.status);
    
    if (status.loanApplication) {
      console.log('Loan application status:', status.loanApplication.status);
      if (status.loanApplication.approvedAmount) {
        console.log('Approved amount:', status.loanApplication.approvedAmount);
      }
      if (status.loanApplication.rejectionReason) {
        console.log('Rejection reason:', status.loanApplication.rejectionReason);
      }
    }

    if (status.loan) {
      console.log('Loan number:', status.loan.loanNumber);
      console.log('Loan status:', status.loan.status);
    }

    return status;
  } catch (error) {
    console.error('Failed to get application status:', error);
    throw error;
  }
}

// Example 4: Post repayment from trip revenue
export async function postTripRepayment(
  tripNumber: string,
  loanNumber: string,
  repaymentAmount: number,
  revenueTransactionId: string,
  totalRevenue: number,
) {
  const client = initializeClient();

  try {
    const repayment = await client.postRepayment({
      externalReferenceId: `PAY-${tripNumber}-${Date.now()}`,
      loanReference: loanNumber,
      amount: repaymentAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      tripId: tripNumber,
      revenueTransactionId,
      totalTripRevenue: totalRevenue,
      repaymentPercentage: (repaymentAmount / totalRevenue) * 100,
      processingNotes: `Automatic repayment from trip ${tripNumber} revenue`,
    });

    console.log('Repayment posted:', repayment);
    return repayment;
  } catch (error) {
    console.error('Failed to post repayment:', error);
    throw error;
  }
}

// Example 5: Webhook handler with signature verification
export function createWebhookHandler(client: UrutiLendingClientService) {
  return async (req: any, res: any) => {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const payload = req.body.toString();

      // Verify signature
      if (!client.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const webhook = JSON.parse(payload);
      const { event, data } = webhook;

      console.log('Received webhook:', event, data);

      // Process webhook based on event type
      switch (event) {
        case 'application.approved':
          await handleApplicationApproved(data);
          break;
        case 'application.rejected':
          await handleApplicationRejected(data);
          break;
        case 'loan.status.updated':
          await handleLoanStatusUpdated(data);
          break;
        case 'repayment.posted':
          await handleRepaymentPosted(data);
          break;
        default:
          console.warn('Unknown webhook event:', event);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Webhook event handlers (implement these based on your platform's needs)
async function handleApplicationApproved(data: any) {
  console.log('Application approved:', data.externalReferenceId);
  // Update trip status in your system
  // Notify transporter
  // etc.
}

async function handleApplicationRejected(data: any) {
  console.log('Application rejected:', data.externalReferenceId);
  // Update trip status in your system
  // Notify transporter with rejection reason
  // etc.
}

async function handleLoanStatusUpdated(data: any) {
  console.log('Loan status updated:', data.loanNumber, data.status);
  // Update trip financing status
  // If disbursed, trigger disbursement to transporter
  // etc.
}

async function handleRepaymentPosted(data: any) {
  console.log('Repayment posted:', data.amount);
  // Update trip payment records
  // etc.
}

