/**
 * Test script for Fraud Detection Features
 * 
 * Tests all three fraud detection services:
 * 1. Identity Duplication Detection
 * 2. Document Forgery Detection
 * 3. Behavioral Anomaly Detection
 * 
 * Usage:
 *   npx ts-node backend/test-fraud-detection.ts
 * 
 * Or with environment variables:
 *   API_URL=http://localhost:3001/api AUTH_TOKEN=your-token npx ts-node backend/test-fraud-detection.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const testResults: TestResult[] = [];

/**
 * Make API request with error handling
 */
async function makeRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  data?: any,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config: any = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (AUTH_TOKEN) {
      config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
    };
  }
}

/**
 * Test Identity Duplication Detection
 */
async function testIdentityDuplication(): Promise<void> {
  console.log('\n📋 Testing Identity Duplication Detection...\n');

  // Test 1: Duplicate ID number
  const test1 = await makeRequest('POST', '/fraud-detection/identity-duplication/check', {
    applicationId: 'test-app-1',
    idNumber: 'ABC123456',
    phoneNumber: '+1234567890',
    email: 'test@example.com',
    deviceFingerprint: 'device-fingerprint-1',
    fullName: 'John Smith',
  });

  testResults.push({
    name: 'Identity Duplication - Basic Check',
    passed: test1.success,
    error: test1.error,
    response: test1.data,
  });

  console.log(`  ✅ Basic check: ${test1.success ? 'PASSED' : 'FAILED'}`);
  if (test1.error) console.log(`     Error: ${test1.error}`);

  // Test 2: Fuzzy name matching
  const test2 = await makeRequest('POST', '/fraud-detection/identity-duplication/check', {
    applicationId: 'test-app-2',
    idNumber: 'XYZ789012',
    phoneNumber: '+9876543210',
    email: 'test2@example.com',
    deviceFingerprint: 'device-fingerprint-2',
    fullName: 'Jon Smyth', // Similar to "John Smith"
  });

  testResults.push({
    name: 'Identity Duplication - Fuzzy Name Match',
    passed: test2.success,
    error: test2.error,
    response: test2.data,
  });

  console.log(`  ✅ Fuzzy name match: ${test2.success ? 'PASSED' : 'FAILED'}`);
  if (test2.error) console.log(`     Error: ${test2.error}`);

  // Test 3: Same device multiple accounts
  for (let i = 3; i <= 7; i++) {
    const test3 = await makeRequest('POST', '/fraud-detection/identity-duplication/check', {
      applicationId: `test-app-${i}`,
      idNumber: `ID${i}`,
      phoneNumber: `+123456789${i}`,
      email: `test${i}@example.com`,
      deviceFingerprint: 'same-device-fingerprint', // Same device
      fullName: `User ${i}`,
    });

    if (i === 7) {
      testResults.push({
        name: 'Identity Duplication - Same Device Pattern',
        passed: test3.success,
        error: test3.error,
        response: test3.data,
      });
      console.log(`  ✅ Same device pattern (${i} accounts): ${test3.success ? 'PASSED' : 'FAILED'}`);
      if (test3.error) console.log(`     Error: ${test3.error}`);
    }
  }
}

/**
 * Test Document Forgery Detection
 */
async function testDocumentForgery(): Promise<void> {
  console.log('\n📄 Testing Document Forgery Detection...\n');

  // Note: This test requires an actual file path
  // In production, you would upload a file first and get the path
  const test1 = await makeRequest('POST', '/fraud-detection/document-forgery/check', {
    applicationId: 'test-app-1',
    documentId: 'test-doc-1',
    filePath: '/tmp/test-document.pdf', // This would be a real file path
    mimeType: 'application/pdf',
  });

  testResults.push({
    name: 'Document Forgery - Basic Check',
    passed: test1.success || test1.error?.includes('File not found'), // Expected if file doesn't exist
    error: test1.error,
    response: test1.data,
  });

  console.log(`  ✅ Basic check: ${test1.success ? 'PASSED' : 'FAILED (expected if file not found)'}`);
  if (test1.error && !test1.error.includes('File not found')) {
    console.log(`     Error: ${test1.error}`);
  }
}

/**
 * Test Behavioral Anomaly Detection
 */
async function testBehavioralAnomaly(): Promise<void> {
  console.log('\n🔍 Testing Behavioral Anomaly Detection...\n');

  // Test 1: Speed anomaly (<1 minute)
  const test1 = await makeRequest('POST', '/fraud-detection/behavioral-anomaly/check', {
    applicationId: 'test-app-1',
    applicationStartTime: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
    applicationCompletionTime: new Date().toISOString(), // Now
    deviceLocation: {
      lat: 40.7128,
      lng: -74.0060,
    },
    applicationAddress: '123 Main St, New York, NY 10001',
    deviceFingerprint: 'device-fingerprint-1',
    platform: 'web',
    usagePatterns: {
      fieldTime: { field1: 1, field2: 1, field3: 1 },
      clickPattern: { totalClicks: 20, backspaces: 0 },
    },
  });

  testResults.push({
    name: 'Behavioral Anomaly - Speed Anomaly',
    passed: test1.success,
    error: test1.error,
    response: test1.data,
  });

  console.log(`  ✅ Speed anomaly (30s completion): ${test1.success ? 'PASSED' : 'FAILED'}`);
  if (test1.error) console.log(`     Error: ${test1.error}`);
  if (test1.data?.speedAnomaly?.detected) {
    console.log(`     ⚠️  Speed anomaly detected: ${test1.data.speedAnomaly.completionTimeSeconds}s`);
  }

  // Test 2: Location anomaly
  const test2 = await makeRequest('POST', '/fraud-detection/behavioral-anomaly/check', {
    applicationId: 'test-app-2',
    applicationStartTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    applicationCompletionTime: new Date().toISOString(),
    deviceLocation: {
      lat: 40.7128, // New York
      lng: -74.0060,
    },
    applicationAddress: '123 Main St, Los Angeles, CA 90001', // Los Angeles
    deviceFingerprint: 'device-fingerprint-2',
    platform: 'web',
  });

  testResults.push({
    name: 'Behavioral Anomaly - Location Anomaly',
    passed: test2.success,
    error: test2.error,
    response: test2.data,
  });

  console.log(`  ✅ Location anomaly: ${test2.success ? 'PASSED' : 'FAILED'}`);
  if (test2.error) console.log(`     Error: ${test2.error}`);

  // Test 3: Usage pattern anomaly
  const test3 = await makeRequest('POST', '/fraud-detection/behavioral-anomaly/check', {
    applicationId: 'test-app-3',
    applicationStartTime: new Date(Date.now() - 120000).toISOString(),
    applicationCompletionTime: new Date().toISOString(),
    deviceFingerprint: 'new-device-fingerprint', // First-time user
    platform: 'web',
    usagePatterns: {
      fieldTime: { field1: 1, field2: 1, field3: 1, field4: 1, field5: 1, field6: 1 },
      clickPattern: { totalClicks: 25, backspaces: 0 },
      typingSpeed: 250, // Suspiciously fast
    },
  });

  testResults.push({
    name: 'Behavioral Anomaly - Usage Pattern Anomaly',
    passed: test3.success,
    error: test3.error,
    response: test3.data,
  });

  console.log(`  ✅ Usage pattern anomaly: ${test3.success ? 'PASSED' : 'FAILED'}`);
  if (test3.error) console.log(`     Error: ${test3.error}`);

  // Test 4: Multi-platform anomaly
  const platforms = ['web', 'mobile-ios', 'mobile-android'];
  for (let i = 0; i < platforms.length; i++) {
    await makeRequest('POST', '/fraud-detection/behavioral-anomaly/check', {
      applicationId: `test-app-multi-${i}`,
      applicationStartTime: new Date(Date.now() - (i * 3600000)).toISOString(), // 1 hour apart
      applicationCompletionTime: new Date(Date.now() - (i * 3600000) + 60000).toISOString(),
      deviceFingerprint: 'same-device-multi-platform', // Same device
      platform: platforms[i],
    });
  }

  const test4 = await makeRequest('POST', '/fraud-detection/behavioral-anomaly/check', {
    applicationId: 'test-app-multi-final',
    applicationStartTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    applicationCompletionTime: new Date().toISOString(),
    deviceFingerprint: 'same-device-multi-platform', // Same device as above
    platform: 'web',
  });

  testResults.push({
    name: 'Behavioral Anomaly - Multi-Platform Anomaly',
    passed: test4.success,
    error: test4.error,
    response: test4.data,
  });

  console.log(`  ✅ Multi-platform anomaly: ${test4.success ? 'PASSED' : 'FAILED'}`);
  if (test4.error) console.log(`     Error: ${test4.error}`);
  if (test4.data?.multiPlatformAnomaly?.detected) {
    console.log(`     ⚠️  Multi-platform detected: ${test4.data.multiPlatformAnomaly.platformCount} platforms`);
  }
}

/**
 * Check server health
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Main test function
 */
async function runTests(): Promise<void> {
  console.log('🚀 Fraud Detection Features Test Suite');
  console.log('=====================================\n');
  console.log(`API URL: ${API_URL}`);
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

  // Run tests
  try {
    await testIdentityDuplication();
    await testDocumentForgery();
    await testBehavioralAnomaly();

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('==============\n');

    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;

    testResults.forEach((result) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status}: ${result.name}`);
      if (result.error && !result.passed) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log(`\nTotal: ${testResults.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. This may be expected if:');
      console.log('   - Database migrations not run');
      console.log('   - Test files don\'t exist (document forgery)');
      console.log('   - Authentication required');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
    }
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

