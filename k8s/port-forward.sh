#!/bin/bash

# Port Forward Script for Velora Wear App
# This script forwards ports for app, Grafana, and Prometheus

set -e

APP_NAMESPACE="velora-wear"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Velora Wear - Port Forward Setup"
echo "========================================"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}⚠️  Port $port is already in use!${NC}"
    lsof -i :$port || true
    read -p "Kill existing process? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Killing process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        return 1
    fi
    return 0
}

# Function to start port forward in background
start_port_forward() {
    local namespace=$1
    local service=$2
    local local_port=$3
    local target_port=$4
    local name=$5
    
    # Check if service exists
    if ! kubectl get svc $service -n $namespace &> /dev/null; then
        echo -e "${RED}❌ Service '$service' not found in namespace '$namespace'${NC}"
        return 1
    fi
    
    # Check and handle port conflict
    if check_port $local_port; then
        if ! kill_port $local_port; then
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Starting port forward for $name...${NC}"
    kubectl port-forward -n $namespace svc/$service $local_port:$target_port > /dev/null 2>&1 &
    local pid=$!
    echo $pid > /tmp/velora-pf-$local_port.pid
    sleep 2
    
    # Verify port forward is working
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}   ✓ $name: http://localhost:$local_port${NC}"
        return 0
    else
        echo -e "${RED}   ✗ Failed to start port forward for $name${NC}"
        return 1
    fi
}

# Show menu
echo "Select services to forward:"
echo "  1) App only (Frontend + Backend) - port 8080"
echo "  2) Grafana only - port 3000"
echo "  3) Prometheus only - port 9090"
echo "  4) All monitoring (Grafana + Prometheus)"
echo "  5) Everything (App + Grafana + Prometheus)"
echo "  6) Custom selection"
echo ""
read -p "Enter choice (1-6): " choice

# Arrays to track what to forward
declare -a forwards=()

case $choice in
    1)
        forwards+=("app")
        ;;
    2)
        forwards+=("grafana")
        ;;
    3)
        forwards+=("prometheus")
        ;;
    4)
        forwards+=("grafana" "prometheus")
        ;;
    5)
        forwards+=("app" "grafana" "prometheus")
        ;;
    6)
        echo ""
        read -p "Forward app? (y/n): " -n 1 -r
        echo ""
        [[ $REPLY =~ ^[Yy]$ ]] && forwards+=("app")
        
        read -p "Forward Grafana? (y/n): " -n 1 -r
        echo ""
        [[ $REPLY =~ ^[Yy]$ ]] && forwards+=("grafana")
        
        read -p "Forward Prometheus? (y/n): " -n 1 -r
        echo ""
        [[ $REPLY =~ ^[Yy]$ ]] && forwards+=("prometheus")
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

if [ ${#forwards[@]} -eq 0 ]; then
    echo -e "${RED}No services selected${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Starting port forwards..."
echo "========================================"
echo ""

# Start port forwards
success_count=0

for service in "${forwards[@]}"; do
    case $service in
        app)
            # Try Traefik first (kube-system), then try ingress-nginx (velora-wear)
            if kubectl get svc traefik -n kube-system &> /dev/null; then
                if start_port_forward "kube-system" "traefik" "8080" "80" "App (Traefik)"; then
                    ((success_count++))
                    echo -e "${BLUE}   → Access app at: http://velora.local:8080${NC}"
                fi
            elif kubectl get svc ingress-nginx-controller -n $APP_NAMESPACE &> /dev/null; then
                if start_port_forward "$APP_NAMESPACE" "ingress-nginx-controller" "8080" "80" "App (Nginx)"; then
                    ((success_count++))
                    echo -e "${BLUE}   → Access app at: http://velora.local:8080${NC}"
                fi
            else
                # Try backend service directly
                if start_port_forward "$APP_NAMESPACE" "velora-backend-service" "5000" "5000" "Backend API"; then
                    ((success_count++))
                    echo -e "${BLUE}   → Backend API: http://localhost:5000${NC}"
                fi
                if start_port_forward "$APP_NAMESPACE" "velora-frontend-service" "3001" "80" "Frontend"; then
                    ((success_count++))
                    echo -e "${BLUE}   → Frontend: http://localhost:3001${NC}"
                fi
            fi
            ;;
        grafana)
            if start_port_forward "$APP_NAMESPACE" "grafana" "3000" "3000" "Grafana"; then
                ((success_count++))
                echo -e "${BLUE}   → Username: admin, Password: admin123${NC}"
            fi
            ;;
        prometheus)
            if start_port_forward "$APP_NAMESPACE" "prometheus" "9090" "9090" "Prometheus"; then
                ((success_count++))
            fi
            ;;
    esac
done

echo ""
echo "========================================"
echo "Port Forward Summary"
echo "========================================"
echo ""

if [ $success_count -gt 0 ]; then
    echo -e "${GREEN}✅ Successfully forwarded $success_count service(s)${NC}"
    echo ""
    echo "Active port forwards:"
    for pidfile in /tmp/velora-pf-*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            port=$(basename "$pidfile" | sed 's/velora-pf-//' | sed 's/.pid//')
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Port $port (PID: $pid)"
            fi
        fi
    done
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all port forwards${NC}"
    echo ""
    
    # Trap Ctrl+C to cleanup
    cleanup() {
        echo ""
        echo "Stopping all port forwards..."
        for pidfile in /tmp/velora-pf-*.pid; do
            if [ -f "$pidfile" ]; then
                pid=$(cat "$pidfile")
                if ps -p $pid > /dev/null 2>&1; then
                    kill $pid 2>/dev/null || true
                fi
                rm "$pidfile"
            fi
        done
        echo "Done."
        exit 0
    }
    trap cleanup INT TERM
    
    # Wait for user to press Ctrl+C
    while true; do
        sleep 1
    done
else
    echo -e "${RED}❌ No services were successfully forwarded${NC}"
    exit 1
fi
