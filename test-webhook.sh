#!/bin/bash

# Test Lemon Squeezy Webhook Endpoint
# This script tests if the webhook endpoint is accessible

echo "🧪 Testing Lemon Squeezy Webhook Endpoint..."
echo ""
echo "URL: https://mindote.app/api/webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test GET request (should return endpoint info)
echo "📡 Testing GET /api/webhook..."
response=$(curl -s https://mindote.app/api/webhook)

if [ $? -eq 0 ]; then
    echo "✅ Endpoint is accessible!"
    echo ""
    echo "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
else
    echo "❌ Failed to connect to endpoint"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Webhook endpoint is READY!"
echo ""
echo "Next steps:"
echo "1. Set LEMON_SQUEEZY_WEBHOOK_SECRET in .env"
echo "2. Create webhook in Lemon Squeezy Dashboard"
echo "3. Use this URL: https://mindote.app/api/webhook"
echo ""
