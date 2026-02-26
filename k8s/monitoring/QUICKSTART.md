# 🚀 Monitoring Quick Start Guide

Get your monitoring stack up and running in 5 minutes!

## Prerequisites

✅ Kubernetes cluster running (Rancher Desktop, minikube, or cloud)  
✅ kubectl configured  
✅ Velora Wear namespace created  
✅ Backend application deployed  

## Step 1: Install Backend Dependencies (2 min)

```bash
cd backend
npm install
```

This installs `prom-client` for metrics collection.

## Step 2: Deploy Monitoring Stack (3 min)

```bash
cd ../k8s/monitoring
./deploy-monitoring.sh
```

This will deploy:
- ✅ Prometheus (metrics)
- ✅ Grafana (dashboards)
- ✅ Loki (logs)
- ✅ Promtail (log shipping)

## Step 3: Redeploy Backend with Metrics

```bash
cd ..
kubectl apply -f backend.yaml
```

## Step 4: Access Grafana

```bash
# Port forward Grafana
kubectl port-forward -n velora-wear svc/grafana 3000:3000
```

Open browser: http://localhost:3000

**Login:**
- Username: `admin`
- Password: `admin123`

## Step 5: View Pre-built Dashboard

1. In Grafana, go to **Dashboards**
2. Open **"Velora Wear - Backend Metrics"**
3. You should see:
   - Request rates
   - Response times
   - Error rates
   - Memory usage
   - Business metrics

## Step 6: Explore Logs

1. In Grafana, click **Explore** (compass icon)
2. Select **Loki** data source
3. Try this query:
   ```logql
   {namespace="velora-wear", app="velora-backend"}
   ```

## 🎉 Done!

You now have:
- 📊 Real-time metrics
- 📈 Beautiful dashboards
- 📝 Centralized logs
- 🔔 Alerting capabilities

## Quick Access Commands

```bash
# Grafana
kubectl port-forward -n velora-wear svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n velora-wear svc/prometheus 9090:9090

# Backend metrics endpoint
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000
curl http://localhost:5000/metrics

# View all monitoring pods
kubectl get pods -n velora-wear -l 'app in (prometheus,grafana,loki,promtail)'
```

## Troubleshooting

### Pods not starting?
```bash
# Check pod status
kubectl get pods -n velora-wear

# View logs
kubectl logs -n velora-wear <pod-name>
```

### No metrics in Grafana?
```bash
# Check if backend is exposing metrics
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000
curl http://localhost:5000/metrics

# Check Prometheus targets
kubectl port-forward -n velora-wear svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets
```

### No logs in Loki?
```bash
# Check Promtail logs
kubectl logs -n velora-wear -l app=promtail --tail=50

# Verify Loki is running
kubectl get pods -n velora-wear -l app=loki
```

## Next Steps

📚 Read the full documentation: [README.md](./README.md)

🎨 Create custom dashboards in Grafana

🔔 Set up alerts for critical issues

📊 Track custom business metrics in your code

---

**Need help?** Check the main [monitoring README](./README.md) for detailed documentation.
