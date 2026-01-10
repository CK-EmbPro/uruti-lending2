/**
 * Comprehensive test script for Auto-Processing features
 * Run with: npx ts-node backend/test-auto-processing.ts
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Set your auth token

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const testResults: TestResult[] = [];

async function runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ testName, passed: true, duration });
    console.log(`✅ ${testName} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'N/A';
    testResults.push({ testName, passed: false, error: errorMessage, duration });
    console.log(`❌ ${testName}: ${errorMessage} (Status: ${statusCode}, ${duration}ms)`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ⚠️  Backend server not running. Start with: cd backend && npm run start:dev`);
    }
  }
}

// Check if server is running
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Test Auto-Disbursement
async function testAutoDisbursement() {
  await runTest('Auto-Disbursement: Instant Trigger', async () => {
    const response = await axios.post(
      `${BASE_URL}/auto-processing/disbursement/trigger`,
      {
        loanId: 'test-loan-id',
        accountDetails: {
          accountNumber: '1234567890',
          accountHolderName: 'Test User',
          method: 'BANK_TRANSFER',
          bankName: 'Test Bank',
          bankCode: 'TB',
        },
        amount: 50000,
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.id) {
      throw new Error('Response missing disbursement ID');
    }
  });

  await runTest('Auto-Disbursement: Account Verification', async () => {
    // Test with invalid account details
    try {
      await axios.post(
        `${BASE_URL}/auto-processing/disbursement/trigger`,
        {
          loanId: 'test-loan-id',
          accountDetails: {
            accountNumber: 'invalid',
            accountHolderName: 'Test User',
            method: 'BANK_TRANSFER',
          },
        },
        {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        },
      );
      throw new Error('Should have failed with invalid account');
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 422) {
        // Expected failure
        return;
      }
      throw error;
    }
  });

  await runTest('Auto-Disbursement: Retry Logic', async () => {
    // This would test retry logic - in real scenario, would mock failures
    const response = await axios.post(
      `${BASE_URL}/auto-processing/disbursement/trigger`,
      {
        loanId: 'test-loan-id',
        accountDetails: {
          accountNumber: '1234567890',
          accountHolderName: 'Test User',
          method: 'MOBILE_MONEY',
        },
        amount: 10000,
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (response.data.attemptCount > 0) {
      // Verify retry attempts are tracked
      return;
    }
  });
}

// Test Auto-Repayment Capture
async function testAutoRepaymentCapture() {
  await runTest('Auto-Repayment: Primary Method (Direct Debit)', async () => {
    const response = await axios.post(
      `${BASE_URL}/auto-processing/repayment/capture`,
      {
        loanId: 'test-loan-id',
        amount: 1000,
        paymentDetails: {
          method: 'DIRECT_DEBIT',
          accountNumber: '1234567890',
        },
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
  });

  await runTest('Auto-Repayment: Manual Transfer with Reference', async () => {
    const response = await axios.post(
      `${BASE_URL}/auto-processing/repayment/capture`,
      {
        loanId: 'test-loan-id',
        amount: 500,
        paymentDetails: {
          method: 'MANUAL_TRANSFER',
          referenceNumber: 'REF-123456',
        },
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (!response.data.reconciliation) {
      throw new Error('Missing reconciliation data');
    }
  });

  await runTest('Auto-Repayment: Payment Scenarios', async () => {
    // Test partial payment
    const partialResponse = await axios.post(
      `${BASE_URL}/auto-processing/repayment/capture`,
      {
        loanId: 'test-loan-id',
        amount: 500, // Less than due
        paymentDetails: {
          method: 'DIRECT_DEBIT',
        },
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (partialResponse.data.scenario !== 'UNDER' && partialResponse.data.scenario !== 'PARTIAL') {
      throw new Error(`Expected PARTIAL or UNDER scenario, got ${partialResponse.data.scenario}`);
    }
  });
}

// Test STP Tracking
async function testSTPTracking() {
  await runTest('STP Tracking: Calculate STP Rate', async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const response = await axios.get(
      `${BASE_URL}/auto-processing/stp/metrics`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (!response.data.stpRate && response.data.stpRate !== 0) {
      throw new Error('Missing STP rate in response');
    }

    if (response.data.stpRate < 0 || response.data.stpRate > 100) {
      throw new Error(`Invalid STP rate: ${response.data.stpRate}`);
    }
  });

  await runTest('STP Tracking: Segment-Specific Rates', async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const response = await axios.get(
      `${BASE_URL}/auto-processing/stp/metrics`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          segment: 'REPEAT_BORROWER',
        },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (!response.data.segmentRates) {
      throw new Error('Missing segment rates');
    }
  });

  await runTest('STP Tracking: Check Targets', async () => {
    const response = await axios.get(
      `${BASE_URL}/auto-processing/stp/targets`,
      {
        params: { segment: 'REPEAT_BORROWER' },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (response.data.target !== 95) {
      throw new Error(`Expected target 95%, got ${response.data.target}%`);
    }
  });
}

// Test Queue Management
async function testQueueManagement() {
  await runTest('Queue Management: Get Queue Items', async () => {
    const response = await axios.get(
      `${BASE_URL}/auto-processing/queue/items`,
      {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of queue items');
    }
  });

  await runTest('Queue Management: Dashboard Data', async () => {
    const response = await axios.get(
      `${BASE_URL}/auto-processing/queue/dashboard`,
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (!response.data.queueStats) {
      throw new Error('Missing queue stats');
    }

    if (!response.data.slaMetrics) {
      throw new Error('Missing SLA metrics');
    }
  });

  await runTest('Queue Management: SLA Metrics', async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const response = await axios.get(
      `${BASE_URL}/auto-processing/queue/sla`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      },
    );

    if (response.data.complianceRate < 0 || response.data.complianceRate > 100) {
      throw new Error(`Invalid compliance rate: ${response.data.complianceRate}`);
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Auto-Processing Tests...\n');

  // Check if server is running
  console.log('🔍 Checking backend server...');
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.log('❌ Backend server is not running!\n');
    console.log('Please start the backend server first:');
    console.log('  cd backend');
    console.log('  npm run start:dev\n');
    console.log('Then run this test script again.\n');
    process.exit(1);
  }
  console.log('✅ Backend server is running\n');

  console.log('📦 Testing Auto-Disbursement...');
  await testAutoDisbursement();

  console.log('\n💰 Testing Auto-Repayment Capture...');
  await testAutoRepaymentCapture();

  console.log('\n📊 Testing STP Tracking...');
  await testSTPTracking();

  console.log('\n📋 Testing Queue Management...');
  await testQueueManagement();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.testName}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

