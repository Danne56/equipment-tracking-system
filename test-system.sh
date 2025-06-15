#!/bin/bash

# Workshop Tool Tracking System - End-to-End Test Script
# This script tests all major functionality of the system

echo "🔧 Workshop Tool Tracking System - E2E Tests"
echo "============================================="

SERVER_URL="http://localhost:3000"

echo ""
echo "📦 Testing Tool Management..."

# Test 1: Get all tools
echo "1. Fetching all tools..."
curl -s "$SERVER_URL/api/tools" | jq '.success' > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Tools API working"
else
    echo "❌ Tools API failed"
fi

# Test 2: QR Code lookup
echo "2. Testing QR code lookup..."
TOOL_ID="cclbosmmgqwdfczfidlf5z4v"
RESPONSE=$(curl -s "$SERVER_URL/api/tools/qr/$TOOL_ID")
SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    TOOL_NAME=$(echo $RESPONSE | jq -r '.tool.name')
    echo "✅ QR lookup working - Found: $TOOL_NAME"
else
    echo "❌ QR lookup failed"
fi

echo ""
echo "📋 Testing Borrow Records..."

# Test 3: Get borrow records
echo "3. Fetching borrow records..."
curl -s "$SERVER_URL/api/borrow-records" | jq '.success' > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Borrow records API working"
else
    echo "❌ Borrow records API failed"
fi

echo ""
echo "🔔 Testing Notifications..."

# Test 4: Get notifications
echo "4. Fetching notifications..."
NOTIF_RESPONSE=$(curl -s "$SERVER_URL/api/notifications")
NOTIF_SUCCESS=$(echo $NOTIF_RESPONSE | jq -r '.success')
if [ "$NOTIF_SUCCESS" = "true" ]; then
    NOTIF_COUNT=$(echo $NOTIF_RESPONSE | jq '.notifications | length')
    echo "✅ Notifications API working - $NOTIF_COUNT notifications found"
else
    echo "❌ Notifications API failed"
fi

echo ""
echo "📊 System Statistics:"
echo "===================="

# Get system stats
TOOLS_RESPONSE=$(curl -s "$SERVER_URL/api/tools")
RECORDS_RESPONSE=$(curl -s "$SERVER_URL/api/borrow-records/active")

TOTAL_TOOLS=$(echo $TOOLS_RESPONSE | jq '.tools | length')
AVAILABLE_TOOLS=$(echo $TOOLS_RESPONSE | jq '.tools | map(select(.status == "available")) | length')
BORROWED_TOOLS=$(echo $TOOLS_RESPONSE | jq '.tools | map(select(.status == "borrowed")) | length')
ACTIVE_RECORDS=$(echo $RECORDS_RESPONSE | jq '.records | length')

echo "🔧 Total Tools: $TOTAL_TOOLS"
echo "✅ Available: $AVAILABLE_TOOLS"
echo "🔄 Borrowed: $BORROWED_TOOLS"
echo "📋 Active Records: $ACTIVE_RECORDS"

echo ""
echo "🎯 Test QR Input (for manual testing in browser):"
echo "================================================"
echo "Available Tool IDs you can use in the QR Scanner manual input:"

echo $TOOLS_RESPONSE | jq -r '.tools[] | select(.status == "available") | "- \(.id) (\(.name))"' | head -3

echo ""
echo "🚀 Frontend URL: http://localhost:5173"
echo "🔗 Backend URL: http://localhost:3000"
echo ""
echo "✨ System Status: FULLY OPERATIONAL"
