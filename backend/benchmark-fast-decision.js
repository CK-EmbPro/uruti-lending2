/**
 * Benchmark Script for Fast Decision
 * Tests 100 applications to verify 95% target
 * 
 * Run with: node backend/benchmark-fast-decision.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-test-token';

async function initiateFastDecision(applicationId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/fast-decision/initiate`,
      {
        applicationId,
        autoApprove: true,
        autoApproveThreshold: 700,
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getProgress(applicationId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/fast-decision/progress/${applicationId}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function waitForCompletion(applicationId, maxWait = 600000) {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(maxWait / 1000);

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const progress = await getProgress(applicationId);
    
    if (progress.success && progress.data) {
      const status = progress.data.status;
      
      if (status === 'COMPLETED' || status === 'FAILED') {
        return {
          success: true,
          progress: progress.data,
          waitTime: Date.now() - startTime,
        };
      }
    }

    attempts++;
  }

  return { success: false, error: 'Timeout waiting for completion' };
}

async function runBenchmark() {
  console.log('🚀 Starting Fast Decision Benchmark (100 applications)...\n');

  const results = [];
  const totalApplications = 100;
  const batchSize = 10;

  // Process in batches to avoid overwhelming the system
  for (let batch = 0; batch < totalApplications / batchSize; batch++) {
    console.log(`\n📦 Processing batch ${batch + 1} (${batchSize} applications)...`);

    const batchPromises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const applicationId = `benchmark-app-${batch * batchSize + i + 1}`;
      
      batchPromises.push(
        (async () => {
          // Initiate
          const initiate = await initiateFastDecision(applicationId);
          if (!initiate.success) {
            return { applicationId, success: false, error: initiate.error };
          }

          // Wait for completion
          const completion = await waitForCompletion(applicationId);
          if (!completion.success) {
            return { applicationId, success: false, error: completion.error };
          }

          const progress = completion.progress;
          const totalTime = progress.elapsedTime;
          const slaCompliant = totalTime < 600000; // 10 minutes

          return {
            applicationId,
            success: true,
            totalTime,
            slaCompliant,
            progress,
          };
        })()
      );
    }

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    const completed = results.filter(r => r.success).length;
    const slaCompliant = results.filter(r => r.success && r.slaCompliant).length;
    
    console.log(`  ✅ Completed: ${completed}/${results.length}`);
    console.log(`  ✅ SLA Compliant: ${slaCompliant}/${completed}`);

    // Small delay between batches
    if (batch < totalApplications / batchSize - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Calculate statistics
  const successful = results.filter(r => r.success);
  const total = successful.length;
  const slaCompliant = successful.filter(r => r.slaCompliant).length;
  const slaViolated = total - slaCompliant;

  const times = successful.map(r => r.totalTime).sort((a, b) => a - b);
  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const p50Time = times[Math.floor(times.length * 0.5)];
  const p95Time = times[Math.floor(times.length * 0.95)];
  const p99Time = times[Math.floor(times.length * 0.99)];
  const maxTime = times[times.length - 1];

  const complianceRate = (slaCompliant / total) * 100;

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK RESULTS');
  console.log('='.repeat(60) + '\n');

  console.log(`Total Applications: ${totalApplications}`);
  console.log(`Successful: ${total}`);
  console.log(`Failed: ${results.length - total}\n`);

  console.log('SLA Compliance:');
  console.log(`  ✅ Compliant: ${slaCompliant} (${complianceRate.toFixed(1)}%)`);
  console.log(`  ❌ Violated: ${slaViolated} (${(100 - complianceRate).toFixed(1)}%)\n`);

  console.log('Processing Time Statistics:');
  console.log(`  Average: ${(averageTime / 1000).toFixed(1)}s (${(averageTime / 60000).toFixed(2)} minutes)`);
  console.log(`  P50 (Median): ${(p50Time / 1000).toFixed(1)}s`);
  console.log(`  P95: ${(p95Time / 1000).toFixed(1)}s (${(p95Time / 60000).toFixed(2)} minutes)`);
  console.log(`  P99: ${(p99Time / 1000).toFixed(1)}s`);
  console.log(`  Max: ${(maxTime / 1000).toFixed(1)}s (${(maxTime / 60000).toFixed(2)} minutes)\n`);

  console.log('Target Verification:');
  console.log(`  P95 Target: <10 minutes (600,000ms)`);
  console.log(`  P95 Actual: ${(p95Time / 60000).toFixed(2)} minutes`);
  console.log(`  P95 Status: ${p95Time < 600000 ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log(`  Compliance Target: ≥95%`);
  console.log(`  Compliance Actual: ${complianceRate.toFixed(1)}%`);
  console.log(`  Compliance Status: ${complianceRate >= 95 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Save detailed results
  const fs = require('fs');
  fs.writeFileSync(
    'benchmark-results.json',
    JSON.stringify({
      summary: {
        total: totalApplications,
        successful: total,
        failed: results.length - total,
        slaCompliant,
        slaViolated,
        complianceRate,
        averageTime,
        p50Time,
        p95Time,
        p99Time,
        maxTime,
      },
      results,
    }, null, 2)
  );

  console.log('📄 Detailed results saved to benchmark-results.json\n');

  // Final verdict
  const p95Pass = p95Time < 600000;
  const compliancePass = complianceRate >= 95;

  if (p95Pass && compliancePass) {
    console.log('🎉 BENCHMARK PASSED!');
    console.log('   ✅ P95 time < 10 minutes');
    console.log('   ✅ Compliance rate ≥ 95%');
    process.exit(0);
  } else {
    console.log('⚠️  BENCHMARK FAILED');
    if (!p95Pass) console.log('   ❌ P95 time ≥ 10 minutes');
    if (!compliancePass) console.log('   ❌ Compliance rate < 95%');
    process.exit(1);
  }
}

// Run benchmark
runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});

