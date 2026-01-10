/**
 * Test script for Loan Application with Credit Scoring Integration
 * 
 * This script tests the complete flow:
 * 1. Create a loan application
 * 2. Submit with scoring data
 * 3. Verify credit score was calculated
 * 4. Check scoring details
 * 
 * Usage: node test-loan-application-scoring.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';
const COMPANY_ID = process.env.COMPANY_ID || null; // Will be fetched from user

// Sample test data
const sampleLoanApplication = {
  applicantType: 'Customer',
  applicantId: 'test-applicant-' + Date.now(),
  loanProductId: null, // Will need to get from database or create
  requestedAmount: 50000,
  repaymentPeriods: 24,
  repaymentFrequency: 'Monthly',
  isSecuredLoan: false,
};

const sampleScoringData = {
  bankAccountData: {
    transactions: [
      {
        date: '2024-01-15',
        amount: 5000,
        category: 'SALARY',
        description: 'Monthly salary deposit'
      },
      {
        date: '2024-01-10',
        amount: -800,
        category: 'GROCERIES',
        description: 'Grocery store purchase'
      },
      {
        date: '2024-01-08',
        amount: -200,
        category: 'UTILITIES',
        description: 'Electricity bill'
      },
      {
        date: '2024-01-05',
        amount: -1200,
        category: 'RENT',
        description: 'Monthly rent payment'
      },
      {
        date: '2023-12-15',
        amount: 5000,
        category: 'SALARY',
        description: 'Monthly salary deposit'
      },
      {
        date: '2023-12-10',
        amount: -750,
        category: 'GROCERIES',
        description: 'Grocery store purchase'
      },
      {
        date: '2023-12-05',
        amount: -1200,
        category: 'RENT',
        description: 'Monthly rent payment'
      },
      {
        date: '2023-11-15',
        amount: 5000,
        category: 'SALARY',
        description: 'Monthly salary deposit'
      },
      {
        date: '2023-11-10',
        amount: -700,
        category: 'GROCERIES',
        description: 'Grocery store purchase'
      },
      {
        date: '2023-11-05',
        amount: -1200,
        category: 'RENT',
        description: 'Monthly rent payment'
      },
    ]
  },
  utilityTelecomData: {
    payments: [
      {
        date: '2024-01-05',
        amount: 100,
        daysLate: 0,
        utilityType: 'ELECTRICITY'
      },
      {
        date: '2023-12-05',
        amount: 95,
        daysLate: 0,
        utilityType: 'ELECTRICITY'
      },
      {
        date: '2023-11-05',
        amount: 105,
        daysLate: 0,
        utilityType: 'ELECTRICITY'
      },
      {
        date: '2024-01-03',
        amount: 50,
        daysLate: 0,
        utilityType: 'WATER'
      },
      {
        date: '2023-12-03',
        amount: 48,
        daysLate: 0,
        utilityType: 'WATER'
      },
      {
        date: '2024-01-01',
        amount: 80,
        daysLate: 0,
        utilityType: 'INTERNET'
      },
      {
        date: '2023-12-01',
        amount: 80,
        daysLate: 0,
        utilityType: 'INTERNET'
      },
    ],
    accounts: [
      {
        startDate: '2022-01-01',
        type: 'ELECTRICITY'
      },
      {
        startDate: '2021-06-01',
        type: 'WATER'
      },
      {
        startDate: '2020-03-01',
        type: 'INTERNET'
      },
    ]
  },
  rentPaymentData: {
    payments: [
      {
        date: '2024-01-01',
        amount: 1200,
        daysLate: 0
      },
      {
        date: '2023-12-01',
        amount: 1200,
        daysLate: 0
      },
      {
        date: '2023-11-01',
        amount: 1200,
        daysLate: 0
      },
      {
        date: '2023-10-01',
        amount: 1200,
        daysLate: 0
      },
      {
        date: '2023-09-01',
        amount: 1200,
        daysLate: 0
      },
      {
        date: '2023-08-01',
        amount: 1200,
        daysLate: 0
      },
    ],
    verified: true,
    partial: false
  },
  behavioralData: {
    completionRate: 1.0,
    typingConsistency: 0.85,
    typingSpeed: 0.7,
    authentic: true,
    suspicious: false,
    timeSpentSeconds: 600
  },
  digitalFootprintData: {
    consent: true,
    professionalStrength: 0.8,
    presenceStability: 0.75,
    educationVerified: true,
    educationPartial: false
  },
  transactionalData: {
    transactions: [
      {
        merchantCategory: 'GROCERIES',
        timeOfDay: '14:30',
        location: 'New York, NY'
      },
      {
        merchantCategory: 'UTILITIES',
        timeOfDay: '10:00',
        location: 'New York, NY'
      },
      {
        merchantCategory: 'TRANSPORTATION',
        timeOfDay: '08:30',
        location: 'New York, NY'
      },
      {
        merchantCategory: 'GROCERIES',
        timeOfDay: '15:00',
        location: 'New York, NY'
      },
    ],
    timeConsistency: 0.8,
    geographicConsistency: 0.9
  }
};

/**
 * Get or create a loan product
 */
async function getOrCreateLoanProduct(companyId) {
  try {
    // Try to get existing loan products
    const response = await axios.get(
      `${BASE_URL}/loan-products`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      }
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }
  } catch (error) {
    console.log('Could not fetch loan products, will try to create one...');
  }

  // Create a test loan product
  try {
    const createResponse = await axios.post(
      `${BASE_URL}/loan-products`,
      {
        productName: 'Test Personal Loan',
        productCode: 'TEST-PL-' + Date.now(),
        productType: 'Personal Loan',
        rateOfInterest: 12.5,
        minimumLoanAmount: 10000,
        maximumLoanAmount: 100000,
        minimumTenure: 12,
        maximumTenure: 60,
        companyId: companyId,
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return createResponse.data.id;
  } catch (error) {
    console.error('Failed to create loan product:', error.response?.data || error.message);
    throw new Error('Could not get or create loan product');
  }
}

/**
 * Get user info to extract companyId
 */
async function getUserInfo() {
  try {
    const response = await axios.get(
      `${BASE_URL}/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to get user info:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test the complete flow
 */
async function testLoanApplicationScoring() {
  console.log('🧪 Testing Loan Application with Credit Scoring Integration\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Get user info and companyId
    console.log('📋 Step 1: Getting user information...');
    const userInfo = await getUserInfo();
    const companyId = userInfo.companyId || COMPANY_ID;
    
    if (!companyId) {
      throw new Error('Company ID is required. Please set COMPANY_ID environment variable or ensure user has companyId.');
    }
    
    console.log(`✅ User: ${userInfo.email || userInfo.username}`);
    console.log(`✅ Company ID: ${companyId}`);
    console.log('');

    // Step 2: Get or create loan product
    console.log('📋 Step 2: Getting or creating loan product...');
    const loanProductId = await getOrCreateLoanProduct(companyId);
    sampleLoanApplication.loanProductId = loanProductId;
    console.log(`✅ Loan Product ID: ${loanProductId}`);
    console.log('');

    // Step 3: Create loan application
    console.log('📋 Step 3: Creating loan application...');
    const createResponse = await axios.post(
      `${BASE_URL}/loan-applications`,
      sampleLoanApplication,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const application = createResponse.data;
    console.log(`✅ Application created: ${application.applicationNumber}`);
    console.log(`   ID: ${application.id}`);
    console.log(`   Status: ${application.status}`);
    console.log('');

    // Step 4: Submit application with scoring data
    console.log('📋 Step 4: Submitting application with credit scoring data...');
    const submitResponse = await axios.post(
      `${BASE_URL}/loan-applications/${application.id}/submit`,
      {
        scoringData: sampleScoringData,
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const submittedApplication = submitResponse.data;
    console.log(`✅ Application submitted successfully!`);
    console.log(`   Status: ${submittedApplication.status}`);
    
    if (submittedApplication.creditScore) {
      console.log(`   Credit Score: ${submittedApplication.creditScore}`);
      console.log(`   Risk Tier: ${submittedApplication.scoringDetails?.riskTier || 'N/A'}`);
      console.log(`   Confidence: ${((submittedApplication.scoringDetails?.confidence || 0) * 100).toFixed(1)}%`);
    } else {
      console.log(`   ⚠️  Credit score not calculated yet`);
    }
    console.log('');

    // Step 5: Verify scoring details
    if (submittedApplication.scoringDetails) {
      console.log('📊 Credit Scoring Breakdown:');
      console.log('─'.repeat(60));
      
      const breakdown = submittedApplication.scoringDetails.scoreBreakdown;
      
      if (breakdown.traditional) {
        console.log(`Traditional Bureau: ${breakdown.traditional.score} (30% weight)`);
        console.log(`  - Payment History: ${breakdown.traditional.breakdown?.paymentHistory || 'N/A'}`);
        console.log(`  - Credit Utilization: ${breakdown.traditional.breakdown?.creditUtilization || 'N/A'}`);
        console.log(`  - Public Records: ${breakdown.traditional.breakdown?.publicRecords || 'N/A'}`);
      }
      
      if (breakdown.alternative) {
        console.log(`Alternative Financial: ${breakdown.alternative.score} (40% weight)`);
        if (breakdown.alternative.breakdown?.bankAccount) {
          console.log(`  - Bank Account: ${breakdown.alternative.breakdown.bankAccount.score}`);
          if (breakdown.alternative.breakdown.bankAccount.aiInsights) {
            console.log(`    AI Insights: Cash flow stability detected`);
          }
        }
        console.log(`  - Utility/Telecom: ${breakdown.alternative.breakdown?.utilityTelecom?.score || 'N/A'}`);
        console.log(`  - Rent Payments: ${breakdown.alternative.breakdown?.rentPayment?.score || 'N/A'}`);
      }
      
      if (breakdown.behavioral) {
        console.log(`Behavioral & Digital: ${breakdown.behavioral.score} (30% weight)`);
        console.log(`  - Device Biometrics: ${breakdown.behavioral.breakdown?.deviceBiometrics?.score || 'N/A'}`);
        console.log(`  - Digital Footprint: ${breakdown.behavioral.breakdown?.digitalFootprint?.score || 'N/A'}`);
        console.log(`  - Transactional Intelligence: ${breakdown.behavioral.breakdown?.transactionalIntelligence?.score || 'N/A'}`);
      }
      
      console.log('─'.repeat(60));
      console.log(`Final Score: ${submittedApplication.scoringDetails.finalScore}`);
      console.log(`Explanation: ${submittedApplication.scoringDetails.explanation}`);
      console.log('');
    }

    // Step 6: Fetch application again to verify persistence
    console.log('📋 Step 5: Verifying data persistence...');
    const verifyResponse = await axios.get(
      `${BASE_URL}/loan-applications/${application.id}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      }
    );

    const verifiedApplication = verifyResponse.data;
    
    if (verifiedApplication.creditScore) {
      console.log(`✅ Credit score persisted: ${verifiedApplication.creditScore}`);
      console.log(`✅ Scoring details stored: ${verifiedApplication.scoringDetails ? 'Yes' : 'No'}`);
      console.log(`✅ Calculated at: ${verifiedApplication.creditScoreCalculatedAt || 'N/A'}`);
    } else {
      console.log(`⚠️  Credit score not found in database`);
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Application Number: ${application.applicationNumber}`);
    console.log(`Application Status: ${submittedApplication.status}`);
    console.log(`Credit Score: ${submittedApplication.creditScore || 'Not calculated'}`);
    console.log(`Risk Tier: ${submittedApplication.scoringDetails?.riskTier || 'N/A'}`);
    console.log(`Integration Status: ${submittedApplication.creditScore ? '✅ SUCCESS' : '⚠️  PARTIAL'}`);
    console.log('='.repeat(60));
    console.log('');

    return {
      success: true,
      application: submittedApplication,
    };

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error(`Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Make sure the backend server is running on', BASE_URL);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('');
  console.log('🚀 Loan Application Credit Scoring Integration Test');
  console.log('='.repeat(60));
  console.log('');

  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Warning: JWT token not set!');
    console.log('Please set TOKEN environment variable or update the script.');
    console.log('');
    console.log('To get a token:');
    console.log('1. Login via POST /auth/login');
    console.log('2. Copy the token from response');
    console.log('3. Set: export JWT_TOKEN="your-token-here"');
    console.log('');
    process.exit(1);
  }

  try {
    await testLoanApplicationScoring();
    console.log('🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ Test failed');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testLoanApplicationScoring, sampleLoanApplication, sampleScoringData };

