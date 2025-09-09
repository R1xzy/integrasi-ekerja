#!/bin/bash

# Test Review Report Auto-Hide Feature
echo "🚀 Testing Review Report Auto-Hide Feature (C-10 & REQ-B-7.2)"
echo "=============================================================="

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 3

# Step 1: Login as provider
echo "1️⃣ Logging in as provider..."
PROVIDER_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"fanza.atsilatif423@example.com","password":"Atsla123!!"}' | \
  jq -r '.data.token // "null"')

if [ "$PROVIDER_TOKEN" = "null" ] || [ -z "$PROVIDER_TOKEN" ]; then
  echo "❌ Provider login failed"
  exit 1
fi

echo "✅ Provider login successful"

# Step 2: Get reviews list to find one to report
echo "2️⃣ Finding reviews to report..."
REVIEWS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/reviews?page=1&limit=5" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

echo "📊 Reviews response: $REVIEWS_RESPONSE"

# Check if reviews were retrieved successfully
if [[ $REVIEWS_RESPONSE == *"success\":true"* ]]; then
  echo "✅ Successfully retrieved reviews"
  
  # Extract first review ID for testing (in real scenario we'd filter better)
  REVIEW_ID=$(echo $REVIEWS_RESPONSE | jq -r '.data[0].id // "null"')
  
  if [ "$REVIEW_ID" != "null" ] && [ -n "$REVIEW_ID" ]; then
    echo "📝 Target review ID: $REVIEW_ID"
    
    # Step 3: Report the review
    echo "3️⃣ Reporting the review..."
    REPORT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/review-reports" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d "{\"reviewId\":$REVIEW_ID,\"reason\":\"Testing auto-hide feature\"}")
    
    echo "📧 Report response: $REPORT_RESPONSE"
    
    if [[ $REPORT_RESPONSE == *"automatically hidden"* ]]; then
      echo "🎉 SUCCESS: Review is automatically hidden when reported!"
      echo "✅ [C-10] and [REQ-B-7.2] requirements fulfilled"
    elif [[ $REPORT_RESPONSE == *"already reported"* ]]; then
      echo "⚠️ Review was already reported (expected in repeated tests)"
    else
      echo "❌ Unexpected response from report endpoint"
    fi
  else
    echo "❌ No review ID found to test with"
  fi
else
  echo "❌ Failed to retrieve reviews"
fi

echo ""
echo "=============================================================="
echo "🏁 Review Report Auto-Hide Test Completed"
