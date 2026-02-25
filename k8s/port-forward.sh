#!/bin/bash

# Port Forward Script for Velora Wear App
# This script forwards local port 8080 to Traefik ingress controller

set -e

PORT=${1:-8080}
NAMESPACE="kube-system"
SERVICE="traefik"

echo "========================================"
echo "Velora Wear - Port Forward Setup"
echo "========================================"
echo ""

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $PORT is already in use!"
    echo ""
    echo "Processes using port $PORT:"
    lsof -i :$PORT
    echo ""
    read -p "Kill existing process? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Killing process on port $PORT..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "Exiting. Please use a different port or kill the existing process."
        exit 1
    fi
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if service exists
if ! kubectl get svc $SERVICE -n $NAMESPACE &> /dev/null; then
    echo "❌ Service '$SERVICE' not found in namespace '$NAMESPACE'"
    echo "Please ensure Traefik is deployed."
    exit 1
fi

echo "✅ Starting port forward..."
echo "   Local Port: $PORT"
echo "   Service: $SERVICE (namespace: $NAMESPACE)"
echo "   Target Port: 80"
echo ""
echo "🌐 Access your app at: http://velora.local:$PORT"
echo ""
echo "Press Ctrl+C to stop port forwarding"
echo "========================================"
echo ""

# Start port forwarding
kubectl port-forward -n $NAMESPACE svc/$SERVICE $PORT:80
