#!/bin/bash

# Velora Wear - Monitoring Stack Deployment Script
# This script deploys Prometheus, Grafana, Loki, and Promtail

set -e

NAMESPACE="velora-wear"
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Velora Wear Monitoring Stack Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    print_error "Namespace $NAMESPACE does not exist. Please create it first:"
    echo "  kubectl create namespace $NAMESPACE"
    exit 1
fi

print_status "Namespace $NAMESPACE exists"

echo ""
echo "Deploying monitoring components..."
echo ""

# Deploy Prometheus
echo "1️⃣  Deploying Prometheus..."
kubectl apply -f "$MONITORING_DIR/prometheus-config.yaml"
kubectl apply -f "$MONITORING_DIR/prometheus-deployment.yaml"
print_status "Prometheus configuration applied"

# Deploy Grafana
echo ""
echo "2️⃣  Deploying Grafana..."
kubectl apply -f "$MONITORING_DIR/grafana-config.yaml"
kubectl apply -f "$MONITORING_DIR/grafana-deployment.yaml"
kubectl apply -f "$MONITORING_DIR/grafana-dashboards.yaml"
print_status "Grafana configuration applied"

# Deploy Loki
echo ""
echo "3️⃣  Deploying Loki..."
kubectl apply -f "$MONITORING_DIR/loki-deployment.yaml"
print_status "Loki configuration applied"

# Deploy Promtail
echo ""
echo "4️⃣  Deploying Promtail..."
kubectl apply -f "$MONITORING_DIR/promtail-daemonset.yaml"
print_status "Promtail DaemonSet applied"

# Deploy Monitoring Ingress
echo ""
echo "5️⃣  Deploying Monitoring Ingress..."
kubectl apply -f "$MONITORING_DIR/monitoring-ingress.yaml"
print_status "Monitoring Ingress applied"

echo ""
echo "========================================="
echo "Waiting for pods to be ready..."
echo "========================================="
echo ""

# Wait for Prometheus
echo "⏳ Waiting for Prometheus..."
kubectl wait --for=condition=ready pod -l app=prometheus -n $NAMESPACE --timeout=120s
print_status "Prometheus is ready"

# Wait for Grafana
echo "⏳ Waiting for Grafana..."
kubectl wait --for=condition=ready pod -l app=grafana -n $NAMESPACE --timeout=120s
print_status "Grafana is ready"

# Wait for Loki
echo "⏳ Waiting for Loki..."
kubectl wait --for=condition=ready pod -l app=loki -n $NAMESPACE --timeout=120s
print_status "Loki is ready"

# Check Promtail (DaemonSet)
echo "⏳ Checking Promtail DaemonSet..."
sleep 5
PROMTAIL_PODS=$(kubectl get pods -n $NAMESPACE -l app=promtail --no-headers | wc -l)
if [ $PROMTAIL_PODS -gt 0 ]; then
    print_status "Promtail is running on $PROMTAIL_PODS node(s)"
else
    print_warning "Promtail pods not found. Check deployment status."
fi

echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""

# Get pod status
kubectl get pods -n $NAMESPACE -l 'app in (prometheus,grafana,loki,promtail)' -o wide

echo ""
echo "========================================="
echo "Access Information"
echo "========================================="
echo ""

print_status "Monitoring stack deployed successfully!"
echo ""
echo "📊 Access Grafana:"
echo "   kubectl port-forward -n $NAMESPACE svc/grafana 3000:3000"
echo "   URL: http://localhost:3000"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📈 Access Prometheus:"
echo "   kubectl port-forward -n $NAMESPACE svc/prometheus 9090:9090"
echo "   URL: http://localhost:9090"
echo ""
echo "🔍 View Logs in Grafana:"
echo "   1. Access Grafana"
echo "   2. Go to Explore"
echo "   3. Select 'Loki' data source"
echo "   4. Query: {namespace=\"velora-wear\"}"
echo ""
echo "📋 Check metrics from backend:"
echo "   kubectl port-forward -n $NAMESPACE svc/velora-backend-service 5000:5000"
echo "   curl http://localhost:5000/metrics"
echo ""
echo "📚 For more information, see: $MONITORING_DIR/README.md"
echo ""
print_warning "Remember to redeploy your backend to enable metrics collection!"
echo "   kubectl apply -f k8s/backend.yaml"
echo ""
