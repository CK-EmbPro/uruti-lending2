/**
 * Test script for Weighted Credit Scoring Engine API
 * 
 * Usage: node test-weighted-scoring.js
 * 
 * Make sure:
 * 1. Backend server is running (npm run start:dev)
 * 2. You have a valid JWT token (update TOKEN variable)
 * 3. Update BASE_URL if needed
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE'; // Update with actual token

// Sample test data
const sampleScoringRequest = {
  applicantId: 'test-applicant-' + Date.now(),
  applicationId: 'test-application-' + Date.now(),
  
  // Bank Account Data
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

  // Utility & Telecom Data
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

  // Rent Payment Data
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

  // Behavioral Data
  behavioralData: {
    completionRate: 1.0,
    typingConsistency: 0.85,
    typingSpeed: 0.7,
    authentic: true,
    suspicious: false,
    timeSpentSeconds: 600
  },

  // Digital Footprint Data (with consent)
  digitalFootprintData: {
    consent: true,
    professionalStrength: 0.8,
    presenceStability: 0.75,
    educationVerified: true,
    educationPartial: false
  },

  // Transactional Intelligence Data
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
 * Test the weighted scoring endpoint
 */
async function testWeightedScoring() {
  console.log('🧪 Testing Weighted Credit Scoring Engine API\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Endpoint: /credit-scoring-engine/calculate-weighted-score`);
  console.log('='.repeat(60));
  console.log('');

  try {
    console.log('📤 Sending request...');
    console.log('Request data:', JSON.stringify(sampleScoringRequest, null, 2));
    console.log('');

    const response = await axios.post(
      `${BASE_URL}/credit-scoring-engine/calculate-weighted-score`,
      sampleScoringRequest,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log('✅ Success! Response received:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(60));
    console.log('');

    // Display summary
    if (response.data) {
      console.log('📊 SCORING SUMMARY:');
      console.log('─'.repeat(60));
      console.log(`Final Score: ${response.data.finalScore} (${response.data.riskTier} risk tier)`);
      console.log(`Confidence: ${(response.data.confidence * 100).toFixed(1)}%`);
      console.log(`Processing Time: ${response.data.processingTimeMs}ms`);
      console.log('');
      
      if (response.data.scoreBreakdown) {
        console.log('📈 Score Breakdown:');
        console.log('─'.repeat(60));
        if (response.data.scoreBreakdown.traditional) {
          console.log(`Traditional Bureau: ${response.data.scoreBreakdown.traditional.score} (30% weight)`);
        }
        if (response.data.scoreBreakdown.alternative) {
          console.log(`Alternative Financial: ${response.data.scoreBreakdown.alternative.score} (40% weight)`);
        }
        if (response.data.scoreBreakdown.behavioral) {
          console.log(`Behavioral & Digital: ${response.data.scoreBreakdown.behavioral.score} (30% weight)`);
        }
        console.log('');
      }

      if (response.data.explanation) {
        console.log('💡 Explanation:');
        console.log('─'.repeat(60));
        console.log(response.data.explanation);
        console.log('');
      }
    }

    console.log('✅ Test completed successfully!');
    return response.data;

  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('='.repeat(60));
    
    if (error.response) {
      // Server responded with error
      console.error(`Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // Request made but no response
      console.error('No response received from server');
      console.error('Make sure the backend server is running on', BASE_URL);
    } else {
      // Error setting up request
      console.error('Error:', error.message);
    }
    
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Test authentication (get token if needed)
 */
async function testAuth() {
  console.log('🔐 Testing authentication...');
  
  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Warning: JWT token not set!');
    console.log('Please set TOKEN environment variable or update the script.');
    console.log('');
    console.log('To get a token:');
    console.log('1. Login via POST /auth/login');
    console.log('2. Copy the token from response');
    console.log('3. Set: export JWT_TOKEN="your-token-here"');
    console.log('');
    return false;
  }

  // Try a simple authenticated request to verify token
  try {
    await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });
    console.log('✅ Authentication token appears valid');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('❌ Authentication failed: Invalid token');
      return false;
    }
    // Health endpoint might not exist, that's okay
    console.log('⚠️  Could not verify token (health endpoint may not exist)');
    return true; // Assume token is valid if we can't verify
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('');
  console.log('🚀 Weighted Credit Scoring Engine - API Test');
  console.log('='.repeat(60));
  console.log('');

  // Check authentication
  const authValid = await testAuth();
  if (!authValid) {
    console.log('');
    console.log('❌ Cannot proceed without valid authentication token');
    process.exit(1);
  }

  console.log('');

  // Run the test
  try {
    await testWeightedScoring();
    console.log('');
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

module.exports = { testWeightedScoring, sampleScoringRequest };

