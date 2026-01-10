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

async function testCalculateRiskScore(loanId: string) {
  try {
    const response = await api.post(`/default-monitoring/calculate-risk-score/${loanId}`);
    if (response.status === 200 && response.data) {
      const score = response.data;
      logTest(
        'Calculate Risk Score',
        true,
        `Score: ${score.riskScore}, Level: ${score.riskLevel}, Alert: ${score.alertTriggered}`,
      );
      return score;
    } else {
      logTest('Calculate Risk Score', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Calculate Risk Score', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetPredictiveDefaultCheck(loanId: string) {
  try {
    const response = await api.get(`/default-monitoring/check/${loanId}`);
    if (response.status === 200 && response.data) {
      const check = response.data;
      logTest(
        'Get Predictive Default Check',
        true,
        `Current Score: ${check.currentScore?.riskScore}, Actions: ${check.actionsTaken?.length || 0}`,
      );
      return check;
    } else {
      logTest('Get Predictive Default Check', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Get Predictive Default Check', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testCollectionsDashboard() {
  try {
    const response = await api.get('/default-monitoring/collections-dashboard');
    if (response.status === 200 && response.data) {
      const dashboard = response.data;
      logTest(
        'Collections Dashboard',
        true,
        `Total At Risk: ${dashboard.totalAtRisk}, Prioritized: ${dashboard.prioritizedAccounts?.length || 0}`,
      );
      return dashboard;
    } else {
      logTest('Collections Dashboard', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Collections Dashboard', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPrioritizedAccounts() {
  try {
    const response = await api.get('/default-monitoring/prioritized-accounts?limit=10');
    if (response.status === 200 && Array.isArray(response.data)) {
      logTest('Prioritized Accounts', true, `Found ${response.data.length} accounts`);
      return response.data;
    } else {
      logTest('Prioritized Accounts', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Prioritized Accounts', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPerformanceMetrics() {
  try {
    const response = await api.get('/default-monitoring/performance-metrics');
    if (response.status === 200 && response.data) {
      const metrics = response.data;
      logTest('Performance Metrics', true, 'Metrics retrieved');
      return metrics;
    } else {
      logTest('Performance Metrics', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Performance Metrics', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPredictionAccuracy() {
  try {
    const response = await api.get('/default-monitoring/prediction-accuracy');
    if (response.status === 200 && response.data) {
      const accuracy = response.data;
      logTest(
        'Prediction Accuracy',
        true,
        `Accuracy: ${accuracy.accuracy?.toFixed(2)}%, Target: ${accuracy.threshold}%`,
      );
      return accuracy;
    } else {
      logTest('Prediction Accuracy', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Prediction Accuracy', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testFalseAlarmRate() {
  try {
    const response = await api.get('/default-monitoring/false-alarm-rate');
    if (response.status === 200 && response.data) {
      const rate = response.data;
      logTest(
        'False Alarm Rate',
        true,
        `Rate: ${rate.falseAlarmRate?.toFixed(2)}%, Target: <${rate.threshold}%`,
      );
      return rate;
    } else {
      logTest('False Alarm Rate', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('False Alarm Rate', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testInterventionSuccessRate() {
  try {
    const response = await api.get('/default-monitoring/intervention-success-rate');
    if (response.status === 200 && response.data) {
      const rate = response.data;
      logTest(
        'Intervention Success Rate',
        true,
        `Rate: ${rate.successRate?.toFixed(2)}%, Target: ${rate.threshold}%+`,
      );
      return rate;
    } else {
      logTest('Intervention Success Rate', false, 'Invalid response');
      return null;
    }
  } catch (error: any) {
    logTest('Intervention Success Rate', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('\n🚀 Predictive Default Monitoring Test Suite');
  console.log('=====================================\n');
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

  // Test with a sample loan ID (you may need to adjust this)
  const testLoanId = process.env.TEST_LOAN_ID || 'test-loan-id';

  console.log('Running tests...\n');

  // Test risk score calculation
  await testCalculateRiskScore(testLoanId);

  // Test predictive default check
  await testGetPredictiveDefaultCheck(testLoanId);

  // Test collections dashboard
  await testCollectionsDashboard();

  // Test prioritized accounts
  await testPrioritizedAccounts();

  // Test performance metrics
  await testPerformanceMetrics();

  // Test prediction accuracy
  await testPredictionAccuracy();

  // Test false alarm rate
  await testFalseAlarmRate();

  // Test intervention success rate
  await testInterventionSuccessRate();

  // Summary
  console.log('\n=====================================');
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

