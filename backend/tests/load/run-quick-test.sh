#!/bin/bash

# Quick Stress Test Runner
# This script runs a quick stress test against the backend API

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
CONCURRENT_USERS=${CONCURRENT_USERS:-100}
BASE_URL=${BASE_URL:-http://localhost:3000}

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}       Velora Wear API Stress Test${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ to run this test"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    echo "Please upgrade Node.js"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Check if backend is reachable
echo "Checking backend connectivity..."
if curl -f -s -o /dev/null "$BASE_URL/health" 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is reachable at $BASE_URL${NC}"
else
    echo -e "${RED}✗ Cannot reach backend at $BASE_URL${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Make sure backend is running:"
    echo "   kubectl get pods -n velora-wear"
    echo ""
    echo "2. Start port forwarding:"
    echo "   cd k8s && ./port-forward.sh"
    echo ""
    echo "3. Or specify a different URL:"
    echo "   BASE_URL=http://localhost:5000 $0"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test Configuration:${NC}"
echo "  Target URL:       $BASE_URL"
echo "  Concurrent Users: $CONCURRENT_USERS"
echo ""

# Run the test
echo -e "${GREEN}Starting stress test...${NC}"
echo ""

CONCURRENT_USERS=$CONCURRENT_USERS BASE_URL=$BASE_URL node node-stress-test.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Stress test completed successfully${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Next steps:"
    echo "1. View metrics in Grafana: http://localhost:3001"
    echo "2. Check Prometheus: http://localhost:9090"
    echo "3. Review pod logs: kubectl logs -l app=velora-backend -n velora-wear"
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Stress test failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
