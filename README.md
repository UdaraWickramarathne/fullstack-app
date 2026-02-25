# Velora Wear - Full Stack E-Commerce Application

A modern e-commerce platform for clothing retail built with React, Node.js, MongoDB, and Kubernetes.

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│  Ingress (Traefik)              │
│  velora.local:8080              │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌─────────┐
│Frontend│  │ Backend │
│(React) │  │(Node.js)│
│nginx   │  │Express  │
│Port 80 │  │Port 5000│
└────────┘  └────┬────┘
                 │
                 ↓
            ┌─────────┐
            │ MongoDB │
            └─────────┘
```

## 📋 Prerequisites

- **Docker** - For building container images
- **Kubernetes** - Rancher Desktop, Minikube, or cloud provider
- **kubectl** - Kubernetes CLI tool
- **MongoDB** - Connection string for database

## 🚀 Quick Start (Rancher Desktop on Linux)

### 1. Build Docker Images

```bash
# Build backend
cd backend
docker build -t velora-backend:latest .

# Build frontend
cd ../frontend
docker build -t velora-frontend:latest .
```

### 2. Configure Secrets

```bash
cd k8s
cp secrets.template.yaml secrets.yaml

# Edit secrets.yaml with your MongoDB URI and JWT secret
# Use base64 encoding for values:
echo -n "your-mongodb-uri" | base64
echo -n "your-jwt-secret" | base64
```

### 3. Deploy to Kubernetes

```bash
# Apply all Kubernetes configurations
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n velora-wear
kubectl get svc -n velora-wear
kubectl get ingress -n velora-wear
```

### 4. Set Up Local Access

**Add to /etc/hosts:**
```bash
echo "127.0.0.1 velora.local" | sudo tee -a /etc/hosts
```

**Start Port Forwarding:**
```bash
# Use the provided script
./k8s/port-forward.sh

# Or manually
kubectl port-forward -n kube-system svc/traefik 8080:80
```

### 5. Access the Application

Open your browser: **http://velora.local:8080**

- Frontend: `http://velora.local:8080`
- Backend API: `http://velora.local:8080/api`
- API Docs: `http://velora.local:8080/api-docs`

## 🔧 Configuration

### Frontend Environment Variables

The frontend uses runtime configuration via environment variable:
- `API_URL`: Set to `/api` for relative path routing through ingress

### Backend Environment Variables

- `NODE_ENV`: production
- `PORT`: 5000
- `MONGODB_URI`: MongoDB connection string (from secrets)
- `JWT_SECRET`: JWT signing secret (from secrets)

## 🌍 Deployment Scenarios

### Rancher Desktop (Linux) - Current Setup

**Issue**: LoadBalancer IP not accessible from host machine (Lima VM isolation)

**Solution**: Use port forwarding
```bash
./k8s/port-forward.sh
# Access: http://velora.local:8080
```

### Cloud Kubernetes (EKS, GKE, AKS)

No port forwarding needed! LoadBalancer gets a real public IP.

```bash
kubectl apply -f k8s/

# Get LoadBalancer IP
kubectl get ingress velora-ingress -n velora-wear

# Update DNS to point to LoadBalancer IP
# Access: https://yourdomain.com
```

### Minikube on EC2

```bash
minikube start
minikube addons enable ingress

# Build images
eval $(minikube docker-env)
docker build -t velora-backend:latest backend/
docker build -t velora-frontend:latest frontend/

# Deploy
kubectl apply -f k8s/

# Get NodePort
kubectl get svc ingress-nginx-controller -n ingress-nginx

# Configure EC2 Security Group to allow NodePort
# Access: http://<EC2-PUBLIC-IP>:<NodePort>
```

### Manual Kubernetes on EC2

**Option 1: Use NodePort**
- Change Traefik service type to NodePort
- Access via `http://<EC2-IP>:<NodePort>`

**Option 2: Install MetalLB**
```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml
# Configure IP pool for your network
```

**Option 3: Use AWS ALB**
- Expose via NodePort
- Create Application Load Balancer pointing to EC2 instances

## 📁 Project Structure

```
fullstack-app/
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── models/
│   ├── routes/
│   └── middleware/
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   └── public/
└── k8s/
    ├── namespace.yaml
    ├── secrets.yaml
    ├── backend.yaml
    ├── frontend.yaml
    ├── ingress.yaml
    └── port-forward.sh
```

## 🛠️ Useful Commands

```bash
# View logs
kubectl logs -n velora-wear deployment/velora-frontend
kubectl logs -n velora-wear deployment/velora-backend

# Scale deployments
kubectl scale deployment velora-frontend -n velora-wear --replicas=3

# Restart deployments
kubectl rollout restart deployment/velora-frontend -n velora-wear
kubectl rollout restart deployment/velora-backend -n velora-wear

# Check pod status
kubectl get pods -n velora-wear -w

# Delete everything
kubectl delete namespace velora-wear
```

## 🐛 Troubleshooting

### App continuously loading

**Problem**: Frontend can't reach backend

**Solution**: 
1. Check API_URL is set to `/api` in frontend deployment
2. Verify port forwarding is running
3. Restart frontend pods: `kubectl rollout restart deployment/velora-frontend -n velora-wear`

### Port forwarding not working

**Problem**: Cannot access http://velora.local:8080

**Solutions**:
```bash
# Check if port forward is running
ps aux | grep "port-forward"

# Kill existing and restart
pkill -f "port-forward"
./k8s/port-forward.sh

# Verify hosts file
cat /etc/hosts | grep velora.local
```

### Pods in CrashLoopBackOff

**Problem**: Pods keep restarting

**Solutions**:
```bash
# Check logs
kubectl logs -n velora-wear <pod-name>

# Common issues:
# - MongoDB connection failed → Check secrets.yaml
# - Image not found → Rebuild images
# - Port conflicts → Check port configuration
```

### LoadBalancer stuck in Pending

**Expected behavior** on Rancher Desktop Linux. Use port forwarding instead.

For cloud deployments, ensure your cluster has a LoadBalancer controller.

## 📝 Notes

- **Local Development**: Port forwarding required for Rancher Desktop on Linux
- **Production**: Use proper LoadBalancer or Ingress with real domain/SSL
- **Security**: Never commit `secrets.yaml` to git (included in `.gitignore`)
- **Images**: Set `imagePullPolicy: Never` for local, `Always` or `IfNotPresent` for cloud

## 📄 License

This project is for educational purposes.
