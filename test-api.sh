#!/bin/bash

# =====================================================
# API Testing Script for Mindote
# =====================================================
# 
# Cách dùng:
# 1. Start dev server: pnpm dev
# 2. Đăng nhập vào app để lấy session cookie
# 3. Run script này để test API
# 
# Note: Cần có session cookie để authenticate
# =====================================================

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Mindote API Routes..."
echo "================================"
echo ""

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  
  echo -e "${YELLOW}Testing: ${description}${NC}"
  echo "  ${method} ${endpoint}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}" \
      -b cookies.txt)
  else
    response=$(curl -s -X $method "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w "\n%{http_code}" \
      -b cookies.txt)
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
    echo -e "  ${GREEN}✓ Success (${status_code})${NC}"
  elif [ "$status_code" -eq 401 ]; then
    echo -e "  ${RED}✗ Unauthorized (${status_code}) - Cần đăng nhập trước${NC}"
  else
    echo -e "  ${RED}✗ Failed (${status_code})${NC}"
  fi
  
  echo "  Response: ${body}" | head -c 200
  echo ""
  echo ""
}

# Check if dev server is running
if ! curl -s "${BASE_URL}" > /dev/null; then
  echo -e "${RED}❌ Dev server is not running!${NC}"
  echo "Please run: pnpm dev"
  exit 1
fi

echo -e "${GREEN}✓ Dev server is running${NC}"
echo ""

# Check for session cookie
if [ ! -f cookies.txt ]; then
  echo -e "${YELLOW}⚠️  No cookies.txt file found${NC}"
  echo "Please login first and save cookies:"
  echo ""
  echo "1. Open browser and login at ${BASE_URL}/auth"
  echo "2. Open DevTools > Application > Cookies"
  echo "3. Export cookies to cookies.txt (or login via curl)"
  echo ""
  read -p "Press Enter to continue testing (will get 401 errors)..."
fi

echo ""
echo "================================"
echo "📂 Testing Collections API"
echo "================================"
echo ""

# Test GET collections
test_endpoint "GET" "/collections" "Get all collections"

# Test CREATE collection
test_endpoint "POST" "/collections" "Create new collection" \
  '{"name":"Test Collection","color":"#FF5733"}'

# Test GET single collection (you need to replace COLLECTION_ID)
# test_endpoint "GET" "/collections/COLLECTION_ID" "Get single collection"

# Test UPDATE collection
# test_endpoint "PATCH" "/collections/COLLECTION_ID" "Update collection" \
#   '{"name":"Updated Collection"}'

# Test DELETE collection
# test_endpoint "DELETE" "/collections/COLLECTION_ID" "Delete collection"

echo ""
echo "================================"
echo "📝 Testing Words API"
echo "================================"
echo ""

# Test GET words
test_endpoint "GET" "/words" "Get all words"

# Test CREATE word (cần có collectionId)
# test_endpoint "POST" "/words" "Create new word" \
#   '{"term":"hello","definition":"greeting","collectionId":"COLLECTION_ID"}'

# Test GET single word
# test_endpoint "GET" "/words/WORD_ID" "Get single word"

# Test UPDATE word
# test_endpoint "PATCH" "/words/WORD_ID" "Update word" \
#   '{"definition":"updated definition"}'

# Test DELETE word
# test_endpoint "DELETE" "/words/WORD_ID" "Delete word"

echo ""
echo "================================"
echo "⚙️  Testing Settings API"
echo "================================"
echo ""

# Test GET settings
test_endpoint "GET" "/settings" "Get user settings"

# Test UPDATE settings
test_endpoint "PATCH" "/settings" "Update settings" \
  '{"srsEnabled":true,"theme":"dark"}'

echo ""
echo "================================"
echo "✅ Testing Complete!"
echo "================================"
echo ""
echo "Summary:"
echo "  - If you see 401 errors, you need to login first"
echo "  - Check the responses to verify data structure"
echo "  - Uncomment tests for specific IDs to test update/delete"
echo ""
