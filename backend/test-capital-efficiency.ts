import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
    'Content-Type': 'application/json',
  },
});

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string = '') {
  results.push({ test, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}${message ? `: ${message}` : ''}`);
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function testCalculatePricing() {
  try {
    const response = await api.post('/risk-pricing/calculate', {
      loanApplicationId: 'test-app-123',
      loanAmount: 50000,
      loanTerm: 12,
      creditScore: 750,
    });
    if (response.status === 200 && response.data) {
      const quote = response.data;
      logTest(
        'Calculate Pricing',
        true,
        `Rate: ${quote.pricingComponents?.finalRate}%, Tier: ${quote.riskTier}`,
      );
      return quote;
    } else {
      logTest('Calculate Pricing', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Calculate Pricing', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetDynamicLimit(customerId: string) {
  try {
    const response = await api.get(`/risk-pricing/dynamic-limit/${customerId}`);
    if (response.status === 200 && response.data) {
      const limit = response.data;
      logTest(
        'Get Dynamic Limit',
        true,
        `Current: ${limit.currentLimit}, Eligible: ${limit.eligibleForIncrease}`,
      );
      return limit;
    } else {
      logTest('Get Dynamic Limit', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Get Dynamic Limit', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPortfolioOptimization() {
  try {
    const response = await api.get('/risk-pricing/portfolio-optimization');
    if (response.status === 200 && response.data) {
      const optimization = response.data;
      logTest(
        'Portfolio Optimization',
        true,
        `Yield: ${optimization.currentYield}%, Target: ${optimization.targetYield}%`,
      );
      return optimization;
    } else {
      logTest('Portfolio Optimization', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Portfolio Optimization', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testStressTest() {
  try {
    const response = await api.post('/risk-pricing/stress-test', {
      scenarioName: '15% Unemployment',
      unemploymentRate: 15.0,
    });
    if (response.status === 200 && response.data) {
      const scenario = response.data;
      logTest(
        'Stress Test',
        true,
        `NPL Increase: ${scenario.expectedNPLIncrease}%, Yield Impact: ${scenario.expectedYieldImpact}%`,
      );
      return scenario;
    } else {
      logTest('Stress Test', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Stress Test', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testCreateLedgerEntry() {
  try {
    const response = await api.post('/accounting/ledger-entry', {
      transactionType: 'DISBURSEMENT',
      debitAccount: 'LOAN_ASSETS',
      creditAccount: 'CASH',
      amount: 50000,
      currency: 'USD',
      referenceNumber: 'TEST-REF-001',
      loanId: 'test-loan-123',
      customerId: 'test-customer-123',
      description: 'Test loan disbursement',
      source: 'TEST_SYSTEM',
    });
    if (response.status === 200 && response.data) {
      const entry = response.data;
      logTest(
        'Create Ledger Entry',
        true,
        `Entry ID: ${entry.id}, Status: ${entry.status}`,
      );
      return entry;
    } else {
      logTest('Create Ledger Entry', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Create Ledger Entry', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testProcessPayment() {
  try {
    const response = await api.post('/accounting/process-payment', {
      referenceNumber: 'TEST-PAY-001',
      amount: 5000,
      customerId: 'test-customer-123',
      loanId: 'test-loan-123',
      paymentDate: new Date().toISOString().split('T')[0],
    });
    if (response.status === 200) {
      if (response.data) {
        // Mismatch detected
        logTest(
          'Process Payment (Mismatch)',
          true,
          `Mismatch Type: ${response.data.mismatchType}`,
        );
      } else {
        // Payment processed successfully
        logTest('Process Payment', true, 'Payment processed successfully');
      }
      return response.data;
    } else {
      logTest('Process Payment', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Process Payment', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetPaymentMismatches() {
  try {
    const response = await api.get('/accounting/payment-mismatches?resolved=false');
    if (response.status === 200 && Array.isArray(response.data)) {
      logTest('Get Payment Mismatches', true, `Found ${response.data.length} mismatches`);
      return response.data;
    } else {
      logTest('Get Payment Mismatches', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Get Payment Mismatches', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testRunReconciliation() {
  try {
    const response = await api.post('/accounting/reconciliation/run', {
      date: new Date().toISOString().split('T')[0],
    });
    if (response.status === 200 && response.data) {
      const report = response.data;
      logTest(
        'Run Reconciliation',
        true,
        `Matched: ${report.matchedEntries}/${report.totalLedgerEntries}`,
      );
      return report;
    } else {
      logTest('Run Reconciliation', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Run Reconciliation', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('\n🚀 Capital Efficiency & Profitability Test Suite');
  console.log('================================================\n');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided' : 'Not provided'}\n`);

  // Check server health
  console.log('Checking server health...');
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    console.log('❌ Server is not responding. Please ensure the backend is running.');
    console.log('   Start the server with: cd backend && npm run start:dev\n');
    process.exit(1);
  }
  console.log('✅ Server is healthy\n');

  console.log('Running tests...\n');

  // Risk-Based Pricing Tests
  console.log('--- Risk-Based Pricing Tests ---\n');
  await testCalculatePricing();
  await testGetDynamicLimit('test-customer-123');
  await testPortfolioOptimization();
  await testStressTest();

  // Accounting & Reconciliation Tests
  console.log('\n--- Accounting & Reconciliation Tests ---\n');
  await testCreateLedgerEntry();
  await testProcessPayment();
  await testGetPaymentMismatches();
  await testRunReconciliation();

  // Summary
  console.log('\n================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\nTest Results: ${passed}/${total} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test execution error:', error);
  process.exit(1);
});

