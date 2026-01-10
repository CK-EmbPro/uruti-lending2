#!/bin/bash

# Test script for Weighted Credit Scoring Engine API
# Usage: ./test-weighted-scoring.sh

BASE_URL="${API_URL:-http://localhost:3000}"
TOKEN="${JWT_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "❌ Error: JWT_TOKEN environment variable not set"
    echo ""
    echo "To get a token:"
    echo "1. Login via: curl -X POST $BASE_URL/auth/login -d '{\"email\":\"admin@urutilending.com\",\"password\":\"admin123\"}'"
    echo "2. Copy the token from response"
    echo "3. Set: export JWT_TOKEN=\"your-token-here\""
    exit 1
fi

echo "🧪 Testing Weighted Credit Scoring Engine API"
echo "============================================================"
echo "Base URL: $BASE_URL"
echo "Endpoint: /credit-scoring-engine/calculate-weighted-score"
echo "============================================================"
echo ""

# Sample request data
REQUEST_DATA='{
  "applicantId": "test-applicant-'$(date +%s)'",
  "bankAccountData": {
    "transactions": [
      {
        "date": "2024-01-15",
        "amount": 5000,
        "category": "SALARY",
        "description": "Monthly salary deposit"
      },
      {
        "date": "2024-01-10",
        "amount": -800,
        "category": "GROCERIES",
        "description": "Grocery store purchase"
      }
    ]
  },
  "utilityTelecomData": {
    "payments": [
      {
        "date": "2024-01-05",
        "amount": 100,
        "daysLate": 0,
        "utilityType": "ELECTRICITY"
      }
    ],
    "accounts": [
      {
        "startDate": "2022-01-01",
        "type": "ELECTRICITY"
      }
    ]
  },
  "rentPaymentData": {
    "payments": [
      {
        "date": "2024-01-01",
        "amount": 1200,
        "daysLate": 0
      }
    ],
    "verified": true
  },
  "behavioralData": {
    "completionRate": 1.0,
    "typingConsistency": 0.85,
    "authentic": true,
    "timeSpentSeconds": 600
  },
  "digitalFootprintData": {
    "consent": true,
    "professionalStrength": 0.8,
    "educationVerified": true
  },
  "transactionalData": {
    "timeConsistency": 0.8,
    "geographicConsistency": 0.9
  }
}'

echo "📤 Sending request..."
echo ""

# Make the API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/credit-scoring-engine/calculate-weighted-score" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_DATA")

# Extract HTTP status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "============================================================"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "✅ Success! HTTP Status: $HTTP_CODE"
    
    # Extract and display key information
    FINAL_SCORE=$(echo "$BODY" | jq -r '.finalScore' 2>/dev/null)
    RISK_TIER=$(echo "$BODY" | jq -r '.riskTier' 2>/dev/null)
    CONFIDENCE=$(echo "$BODY" | jq -r '.confidence' 2>/dev/null)
    
    if [ "$FINAL_SCORE" != "null" ] && [ "$FINAL_SCORE" != "" ]; then
        echo ""
        echo "📊 SCORING SUMMARY:"
        echo "─".repeat(60)
        echo "Final Score: $FINAL_SCORE ($RISK_TIER risk tier)"
        echo "Confidence: $(echo "$CONFIDENCE * 100" | bc -l | xargs printf "%.1f")%"
    fi
else
    echo "$BODY"
    echo ""
    echo "❌ Error! HTTP Status: $HTTP_CODE"
    exit 1
fi

echo "============================================================"

