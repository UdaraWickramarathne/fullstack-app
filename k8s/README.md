# Velora Wear - Kubernetes Deployment Guide

This guide will help you deploy the Velora Wear application on your local Kubernetes cluster using Rancher Desktop.

## Prerequisites

1. **Rancher Desktop** installed and running
   - Download from: https://rancherdesktop.io/
   - Make sure Kubernetes is enabled in settings

2. **kubectl** command-line tool
   - Should be installed with Rancher Desktop
   - Verify: `kubectl version`

3. **MongoDB Atlas Account**
   - Create a free cluster at: https://www.mongodb.com/cloud/atlas
   - Get your connection string (MongoDB URI)

4. **Docker** (comes with Rancher Desktop)
   - Verify: `docker version`

## Step 1: Build Docker Images

Build the Docker images locally so they can be used by Rancher Desktop:

```bash
# Navigate to project root
cd /home/udaraw/Desktop/projects/velora-wear

# Build backend image
docker build -t velora-backend:latest ./velora-backend

# Build frontend image
docker build -t velora-frontend:latest ./velora-frontend

# Verify images are created
docker images | grep velora
```

## Step 2: Configure Secrets

Edit the `k8s/secrets.yaml` file and replace the placeholder values:

```bash
# Edit the secrets file
nano k8s/secrets.yaml
# or
code k8s/secrets.yaml
```

**Required changes:**
1. `mongodb-uri`: Replace with your MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/velora-wear?retryWrites=true&w=majority`
2. `jwt-secret`: Replace with a strong random string
   - Generate one: `openssl rand -base64 32`
3. Update admin credentials if needed (optional)

## Step 3: Add Local DNS Entry

Add `velora.local` to your `/etc/hosts` file:

```bash
echo "127.0.0.1 velora.local" | sudo tee -a /etc/hosts
```

## Step 4: Deploy to Kubernetes

Apply all Kubernetes configurations:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl apply -f k8s/secrets.yaml

# Deploy backend
kubectl apply -f k8s/backend.yaml

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

**Or apply everything at once:**

```bash
kubectl apply -f k8s/
```

## Step 5: Verify Deployment

Check if all pods are running:

```bash
# Watch pods until they're all running
kubectl get pods -n velora-wear -w

# Check services
kubectl get svc -n velora-wear

# Check ingress
kubectl get ingress -n velora-wear
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS   AGE
velora-backend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
velora-backend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
velora-frontend-xxxxxxxxxx-xxxxx  1/1     Running   0          2m
velora-frontend-xxxxxxxxxx-xxxxx  1/1     Running   0          2m
```

## Step 6: Access the Application

Once all pods are running:

### Method 1: Through Ingress (if configured)
- **Frontend**: http://velora.local
- **Backend API**: http://velora.local/api
- **API Documentation**: http://velora.local/api-docs

### Method 2: Port Forward (easiest for local development)

Use the automated port-forward script:

```bash
cd k8s
./port-forward.sh
```

**By default**, this forwards everything:
- App on port 8080 (http://velora.local:8080)
- Grafana on port 3000 (http://localhost:3000)
- Prometheus on port 9090 (http://localhost:9090)

**For specific services:**
```bash
./port-forward.sh app        # App only
./port-forward.sh monitoring # Grafana + Prometheus only
./port-forward.sh grafana    # Grafana only
```

See [PORT_FORWARD_GUIDE.md](PORT_FORWARD_GUIDE.md) for details.

## Default Admin Credentials

- Email: `admin@velorawear.com`
- Password: `Admin@123`

**⚠️ Important**: Change these credentials after first login!

## Troubleshooting

### Pods not starting

```bash
# Check pod logs
kubectl logs -n velora-wear <pod-name>

# Describe pod for events
kubectl describe pod -n velora-wear <pod-name>
```

### Backend can't connect to MongoDB

```bash
# Verify secrets are properly set
kubectl get secret velora-secrets -n velora-wear -o yaml

# Check backend logs for connection errors
kubectl logs -n velora-wear -l app=velora-backend
```

### Images not found

Make sure you built the images with correct tags and set `imagePullPolicy: Never` in deployments.

```bash
# Check if images exist
docker images | grep velora

# If missing, rebuild them (see Step 1)
```

### Can't access velora.local

```bash
# Verify /etc/hosts entry
cat /etc/hosts | grep velora

# Check ingress is running
kubectl get ingress -n velora-wear

# Check traefik is running (default ingress controller in Rancher Desktop)
kubectl get pods -n kube-system | grep traefik
```

### Port conflicts

If you have services running on ports 80/443:

```bash
# Stop conflicting services
sudo systemctl stop nginx  # or apache2, or other web servers
```

## Scaling

Scale deployments up or down:

```bash
# Scale backend
kubectl scale deployment velora-backend -n velora-wear --replicas=3

# Scale frontend
kubectl scale deployment velora-frontend -n velora-wear --replicas=3

# Check status
kubectl get pods -n velora-wear
```

## Updating the Application

After making code changes:

```bash
# 1. Rebuild the image
docker build -t velora-backend:latest ./velora-backend
# or
docker build -t velora-frontend:latest ./velora-frontend

# 2. Delete existing pods to force recreation
kubectl delete pods -n velora-wear -l app=velora-backend
# or
kubectl delete pods -n velora-wear -l app=velora-frontend

# Pods will automatically be recreated with the new image
```

## Cleanup

To remove the entire deployment:

```bash
# Delete all resources
kubectl delete namespace velora-wear

# Or delete individually
kubectl delete -f k8s/
```

## Useful Commands

```bash
# View all resources in namespace
kubectl get all -n velora-wear

# Get real-time logs from backend
kubectl logs -f -n velora-wear -l app=velora-backend

# Get real-time logs from frontend
kubectl logs -f -n velora-wear -l app=velora-frontend

# Execute commands inside a pod
kubectl exec -it -n velora-wear <pod-name> -- sh

# Port forward to access services directly
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000
kubectl port-forward -n velora-wear svc/velora-frontend-service 8080:80
```

## Step 7: Set Up Monitoring (Optional but Recommended)

Deploy the complete monitoring stack with Grafana, Prometheus, Loki, and Promtail:

```bash
# Quick setup
cd monitoring
./deploy-monitoring.sh

# Or manually
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml
kubectl apply -f monitoring/grafana-config.yaml
kubectl apply -f monitoring/grafana-deployment.yaml
kubectl apply -f monitoring/loki-deployment.yaml
kubectl apply -f monitoring/promtail-daemonset.yaml
kubectl apply -f monitoring/monitoring-ingress.yaml
```

**Access Grafana Dashboard:**
```bash
kubectl port-forward -n velora-wear svc/grafana 3000:3000
# Open: http://localhost:3000
# Username: admin
# Password: admin123
```

**What you get:**
- 📊 Real-time metrics and dashboards
- 📝 Centralized log aggregation
- 🔔 Alerting capabilities
- 📈 Pre-built dashboard for backend APIs

For detailed monitoring documentation, see [monitoring/README.md](monitoring/README.md) or [monitoring/QUICKSTART.md](monitoring/QUICKSTART.md)

## Production Considerations

When deploying to production:

1. **Security**:
   - Use proper secrets management (sealed-secrets, external-secrets)
   - Enable TLS/HTTPS with cert-manager
   - Set strong JWT secrets and admin passwords
   - Configure network policies

2. **Scaling**:
   - Adjust replica counts based on load
   - Configure Horizontal Pod Autoscaler (HPA)
   - Set appropriate resource requests/limits

3. **Monitoring**:
   - ✅ Monitoring stack available in `monitoring/` directory
   - See [monitoring/README.md](monitoring/README.md) for full setup
   - Configure alerts for critical metrics
   - Set up log retention policies

4. **Images**:
   - Push images to a container registry
   - Use specific version tags instead of `latest`
   - Change `imagePullPolicy` to `IfNotPresent` or `Always`

5. **Database**:
   - Configure MongoDB Atlas IP whitelist
   - Use database user with minimal required permissions
   - Enable backup and point-in-time recovery

## Support

For issues or questions:
- Check pod logs: `kubectl logs -n velora-wear <pod-name>`
- Check events: `kubectl get events -n velora-wear --sort-by='.lastTimestamp'`
- Verify configurations: `kubectl describe <resource-type> <resource-name> -n velora-wear`
