/**
 * Comprehensive Test Script for All 4 Features
 * 
 * Run with: npx ts-node backend/test-all-features.ts
 * 
 * This script tests:
 * 1. AI Document Verification
 * 2. Instant KYC/AML Checks
 * 3. Zero-Branch Onboarding
 * 4. Under 10 Minutes Decision
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-test-token';

interface TestResult {
  feature: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration?: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function makeRequest(method: string, endpoint: string, data?: any) {
  try {
    const startTime = Date.now();
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data,
    });
    const duration = Date.now() - startTime;
    return { success: true, data: response.data, duration };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

async function testDocumentVerification() {
  console.log('\n📄 Testing AI Document Verification...\n');

  // Test 1: Process Document
  const test1 = await makeRequest('POST', '/ai/documents/process', {
    documentId: 'test-doc-001',
    documentType: 'ID_CARD',
    fileUrl: 'https://example.com/test-id.jpg',
  });

  results.push({
    feature: 'AI Document Verification',
    test: 'Process Document',
    status: test1.success ? 'PASS' : 'FAIL',
    duration: test1.duration,
    error: test1.error,
    details: test1.data,
  });

  console.log(`  ✓ Process Document: ${test1.success ? 'PASS' : 'FAIL'} (${test1.duration}ms)`);
  if (test1.error) console.log(`    Error: ${test1.error}`);

  // Verify response time < 10 seconds
  if (test1.success && test1.duration) {
    const slaMet = test1.duration < 10000;
    results.push({
      feature: 'AI Document Verification',
      test: 'Response Time SLA (<10s)',
      status: slaMet ? 'PASS' : 'FAIL',
      duration: test1.duration,
      details: { target: 10000, actual: test1.duration },
    });
    console.log(`  ✓ Response Time SLA: ${slaMet ? 'PASS' : 'FAIL'} (${test1.duration}ms < 10000ms)`);
  }
}

async function testKYCAML() {
  console.log('\n🛡️ Testing Instant KYC/AML Checks...\n');

  const test1 = await makeRequest('POST', '/compliance/instant-kyc-aml/check', {
    applicationId: 'test-app-001',
    nationalId: {
      idNumber: 'TEST123456',
      fullName: 'Test User',
    },
    sanctions: {
      fullName: 'Test User',
      checkOFAC: true,
      checkLocal: true,
    },
  });

  results.push({
    feature: 'Instant KYC/AML',
    test: 'Perform Instant Checks',
    status: test1.success ? 'PASS' : 'FAIL',
    duration: test1.duration,
    error: test1.error,
    details: test1.data,
  });

  console.log(`  ✓ Perform Checks: ${test1.success ? 'PASS' : 'FAIL'} (${test1.duration}ms)`);
  if (test1.error) console.log(`    Error: ${test1.error}`);

  // Verify processing time < 45 seconds
  if (test1.success && test1.duration) {
    const slaMet = test1.duration < 45000;
    results.push({
      feature: 'Instant KYC/AML',
      test: 'Processing Time SLA (<45s)',
      status: slaMet ? 'PASS' : 'FAIL',
      duration: test1.duration,
      details: { target: 45000, actual: test1.duration },
    });
    console.log(`  ✓ Processing Time SLA: ${slaMet ? 'PASS' : 'FAIL'} (${test1.duration}ms < 45000ms)`);
  }

  // Verify risk level in response
  if (test1.success && test1.data) {
    const hasRiskLevel = test1.data.riskLevel && ['GREEN', 'YELLOW', 'RED'].includes(test1.data.riskLevel);
    results.push({
      feature: 'Instant KYC/AML',
      test: 'Risk Level Returned',
      status: hasRiskLevel ? 'PASS' : 'FAIL',
      details: test1.data,
    });
    console.log(`  ✓ Risk Level: ${hasRiskLevel ? 'PASS' : 'FAIL'}`);
  }
}

async function testOnboarding() {
  console.log('\n📱 Testing Zero-Branch Onboarding...\n');

  // Test 1: Save Progress
  const test1 = await makeRequest('POST', '/onboarding/save-progress', {
    applicationId: 'test-app-001',
    currentStep: 'PROFILE',
    formData: {
      fullName: 'Test User',
      email: 'test@example.com',
    },
    platform: 'WEB',
  });

  results.push({
    feature: 'Zero-Branch Onboarding',
    test: 'Save Progress',
    status: test1.success ? 'PASS' : 'FAIL',
    duration: test1.duration,
    error: test1.error,
  });

  console.log(`  ✓ Save Progress: ${test1.success ? 'PASS' : 'FAIL'}`);

  // Test 2: Get Progress
  const test2 = await makeRequest('GET', '/onboarding/progress/test-app-001');

  results.push({
    feature: 'Zero-Branch Onboarding',
    test: 'Get Progress',
    status: test2.success ? 'PASS' : 'FAIL',
    duration: test2.duration,
    error: test2.error,
  });

  console.log(`  ✓ Get Progress: ${test2.success ? 'PASS' : 'FAIL'}`);

  // Test 3: Resume Progress
  const test3 = await makeRequest('POST', '/onboarding/resume-progress', {
    applicationId: 'test-app-001',
  });

  results.push({
    feature: 'Zero-Branch Onboarding',
    test: 'Resume Progress',
    status: test3.success ? 'PASS' : 'FAIL',
    duration: test3.duration,
    error: test3.error,
  });

  console.log(`  ✓ Resume Progress: ${test3.success ? 'PASS' : 'FAIL'}`);

  // Test 4: Biometric Match
  const test4 = await makeRequest('POST', '/onboarding/biometric-match', {
    applicationId: 'test-app-001',
    selfieImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    idPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    platform: 'WEB',
  });

  results.push({
    feature: 'Zero-Branch Onboarding',
    test: 'Biometric Match',
    status: test4.success ? 'PASS' : 'FAIL',
    duration: test4.duration,
    error: test4.error,
  });

  console.log(`  ✓ Biometric Match: ${test4.success ? 'PASS' : 'FAIL'}`);

  // Test 5: Capture Signature
  const test5 = await makeRequest('POST', '/onboarding/capture-signature', {
    applicationId: 'test-app-001',
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    platform: 'WEB',
  });

  results.push({
    feature: 'Zero-Branch Onboarding',
    test: 'Capture Signature',
    status: test5.success ? 'PASS' : 'FAIL',
    duration: test5.duration,
    error: test5.error,
  });

  console.log(`  ✓ Capture Signature: ${test5.success ? 'PASS' : 'FAIL'}`);
}

async function testFastDecision() {
  console.log('\n⚡ Testing Under 10 Minutes Decision...\n');

  // Test 1: Initiate Fast Decision
  const test1 = await makeRequest('POST', '/fast-decision/initiate', {
    applicationId: 'test-app-001',
    autoApprove: true,
    autoApproveThreshold: 700,
  });

  results.push({
    feature: 'Under 10 Minutes Decision',
    test: 'Initiate Fast Decision',
    status: test1.success ? 'PASS' : 'FAIL',
    duration: test1.duration,
    error: test1.error,
    details: test1.data,
  });

  console.log(`  ✓ Initiate: ${test1.success ? 'PASS' : 'FAIL'}`);

  if (!test1.success) {
    console.log(`    Error: ${test1.error}`);
    return;
  }

  // Test 2: Get Progress (poll until complete)
  let progress = null;
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds max

  console.log('  ⏳ Waiting for processing to complete...');

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const test2 = await makeRequest('GET', '/fast-decision/progress/test-app-001');
    
    if (test2.success && test2.data) {
      progress = test2.data;
      
      if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
        break;
      }
      
      process.stdout.write(`\r  Progress: ${progress.progressPercentage}% (${progress.elapsedTime}ms)`);
    }

    attempts++;
  }

  console.log(''); // New line

  results.push({
    feature: 'Under 10 Minutes Decision',
    test: 'Get Progress',
    status: progress ? 'PASS' : 'FAIL',
    details: progress,
  });

  console.log(`  ✓ Get Progress: ${progress ? 'PASS' : 'FAIL'}`);

  if (progress) {
    // Test 3: Verify SLA Compliance
    const totalTime = progress.elapsedTime;
    const slaMet = totalTime < 600000; // 10 minutes

    results.push({
      feature: 'Under 10 Minutes Decision',
      test: 'Total Time SLA (<10 minutes)',
      status: slaMet ? 'PASS' : 'FAIL',
      duration: totalTime,
      details: { target: 600000, actual: totalTime },
    });

    console.log(`  ✓ Total Time SLA: ${slaMet ? 'PASS' : 'FAIL'} (${totalTime}ms < 600000ms)`);

    // Test 4: Verify Component SLAs
    if (progress.steps) {
      const componentSLAs = [
        { step: 'DOCUMENT_VERIFICATION', target: 30000 },
        { step: 'KYC_AML', target: 45000 },
        { step: 'SCORING', target: 2000 },
        { step: 'APPROVAL', target: 15000 },
      ];

      componentSLAs.forEach(({ step, target }) => {
        const stepData = progress.steps[step];
        if (stepData && stepData.duration !== undefined) {
          const slaMet = stepData.duration <= target;
          results.push({
            feature: 'Under 10 Minutes Decision',
            test: `${step} SLA (<${target}ms)`,
            status: slaMet ? 'PASS' : 'FAIL',
            duration: stepData.duration,
            details: { target, actual: stepData.duration },
          });
          console.log(`  ✓ ${step} SLA: ${slaMet ? 'PASS' : 'FAIL'} (${stepData.duration}ms < ${target}ms)`);
        }
      });
    }

    // Test 5: Get Result
    const test5 = await makeRequest('GET', '/fast-decision/result/test-app-001');

    results.push({
      feature: 'Under 10 Minutes Decision',
      test: 'Get Result',
      status: test5.success ? 'PASS' : 'FAIL',
      error: test5.error,
      details: test5.data,
    });

    console.log(`  ✓ Get Result: ${test5.success ? 'PASS' : 'FAIL'}`);
  }

  // Test 6: Get SLA Statistics
  const test6 = await makeRequest('GET', '/fast-decision/sla-statistics');

  results.push({
    feature: 'Under 10 Minutes Decision',
    test: 'Get SLA Statistics',
    status: test6.success ? 'PASS' : 'FAIL',
    error: test6.error,
    details: test6.data,
  });

  console.log(`  ✓ Get SLA Statistics: ${test6.success ? 'PASS' : 'FAIL'}`);

  if (test6.success && test6.data) {
    console.log(`    Total: ${test6.data.total}`);
    console.log(`    SLA Compliant: ${test6.data.slaCompliant}`);
    console.log(`    P95 Time: ${test6.data.p95Time}ms`);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Feature Tests...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    await testDocumentVerification();
    await testKYCAML();
    await testOnboarding();
    await testFastDecision();

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60) + '\n');

    const byFeature = results.reduce((acc, result) => {
      if (!acc[result.feature]) {
        acc[result.feature] = { pass: 0, fail: 0, skip: 0 };
      }
      acc[result.feature][result.status.toLowerCase()]++;
      return acc;
    }, {} as Record<string, { pass: number; fail: number; skip: number }>);

    Object.entries(byFeature).forEach(([feature, counts]) => {
      const total = counts.pass + counts.fail + counts.skip;
      const passRate = ((counts.pass / total) * 100).toFixed(1);
      console.log(`${feature}:`);
      console.log(`  ✅ Pass: ${counts.pass}`);
      console.log(`  ❌ Fail: ${counts.fail}`);
      console.log(`  ⏭️  Skip: ${counts.skip}`);
      console.log(`  📈 Pass Rate: ${passRate}%\n`);
    });

    const totalPass = results.filter(r => r.status === 'PASS').length;
    const totalFail = results.filter(r => r.status === 'FAIL').length;
    const totalSkip = results.filter(r => r.status === 'SKIP').length;
    const totalTests = results.length;
    const overallPassRate = ((totalPass / totalTests) * 100).toFixed(1);

    console.log('Overall:');
    console.log(`  ✅ Pass: ${totalPass}`);
    console.log(`  ❌ Fail: ${totalFail}`);
    console.log(`  ⏭️  Skip: ${totalSkip}`);
    console.log(`  📈 Pass Rate: ${overallPassRate}%\n`);

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      'test-results.json',
      JSON.stringify(results, null, 2),
    );
    console.log('📄 Detailed results saved to test-results.json\n');

    if (totalFail === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Check test-results.json for details.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();

