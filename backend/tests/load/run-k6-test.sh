#!/bin/bash

# K6 Load Test Runner
# This script runs k6 load tests with various configurations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL=${BASE_URL:-http://localhost:5000}
TEST_PROFILE=${1:-default}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}       K6 Load Test Runner${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}✗ k6 is not installed${NC}"
    echo ""
    echo "Install k6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   See https://k6.io/docs/getting-started/installation/"
    echo ""
    echo "Or use the Node.js test instead:"
    echo "  ./run-quick-test.sh"
    exit 1
fi

echo -e "${GREEN}✓ k6 detected${NC}"
echo ""

# Check if backend is reachable
echo "Checking backend connectivity..."
if curl -f -s -o /dev/null "$BASE_URL/health" 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is reachable at $BASE_URL${NC}"
else
    echo -e "${RED}✗ Cannot reach backend at $BASE_URL${NC}"
    echo ""
    echo "Make sure port forwarding is active:"
    echo "  cd k8s && ./port-forward.sh"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test Configuration:${NC}"
echo "  Target URL:  $BASE_URL"
echo "  Profile:     $TEST_PROFILE"
echo ""

case $TEST_PROFILE in
    "quick"|"smoke")
        echo -e "${YELLOW}Running smoke test (10 users, 30s)...${NC}"
        k6 run -e BASE_URL=$BASE_URL \
            --stage 5s:10 \
            --stage 20s:10 \
            --stage 5s:0 \
            k6-login-stress.js
        ;;
    
    "default"|"standard")
        echo -e "${YELLOW}Running standard test (100 users, 2m)...${NC}"
        k6 run -e BASE_URL=$BASE_URL k6-login-stress.js
        ;;
    
    "heavy"|"stress")
        echo -e "${YELLOW}Running stress test (200 users, 3m)...${NC}"
        k6 run -e BASE_URL=$BASE_URL \
            --stage 30s:100 \
            --stage 30s:200 \
            --stage 2m:200 \
            --stage 30s:0 \
            k6-login-stress.js
        ;;
    
    "spike")
        echo -e "${YELLOW}Running spike test (sudden 300 users)...${NC}"
        k6 run -e BASE_URL=$BASE_URL \
            --stage 10s:0 \
            --stage 10s:300 \
            --stage 1m:300 \
            --stage 10s:0 \
            k6-login-stress.js
        ;;
    
    "soak"|"endurance")
        echo -e "${YELLOW}Running soak test (50 users, 10m)...${NC}"
        k6 run -e BASE_URL=$BASE_URL \
            --stage 1m:50 \
            --stage 8m:50 \
            --stage 1m:0 \
            k6-login-stress.js
        ;;
    
    *)
        echo -e "${RED}Unknown test profile: $TEST_PROFILE${NC}"
        echo ""
        echo "Available profiles:"
        echo "  quick/smoke     - Quick smoke test (10 users, 30s)"
        echo "  default         - Standard test (100 users, 2m)"
        echo "  heavy/stress    - Heavy stress test (200 users, 3m)"
        echo "  spike           - Spike test (sudden 300 users)"
        echo "  soak/endurance  - Long-running soak test (50 users, 10m)"
        echo ""
        echo "Usage: $0 [profile]"
        echo "Example: $0 stress"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Load test completed${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "View detailed metrics:"
echo "  Grafana:    http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
