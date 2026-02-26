# Monitoring Setup for Velora Wear

Complete monitoring stack with Grafana, Prometheus, Loki, and Promtail for metrics and logs collection.

## 📊 Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation system
- **Promtail**: Log shipper (DaemonSet on each node)

## 🚀 Quick Start

### 1. Install Monitoring Stack

```bash
# Navigate to monitoring directory
cd k8s/monitoring

# Deploy all monitoring components
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus-deployment.yaml
kubectl apply -f grafana-config.yaml
kubectl apply -f grafana-deployment.yaml
kubectl apply -f loki-deployment.yaml
kubectl apply -f promtail-daemonset.yaml
kubectl apply -f grafana-dashboards.yaml
kubectl apply -f monitoring-ingress.yaml
```

### 2. Install Backend Dependencies

```bash
# Install prom-client for metrics
cd backend
npm install
```

### 3. Update Backend Deployment

The backend deployment has been updated with Prometheus annotations:

```bash
# Redeploy backend with metrics support
cd ../k8s
kubectl apply -f backend.yaml
```

### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n velora-wear

# Expected output:
# prometheus-xxx         1/1     Running
# grafana-xxx            1/1     Running
# loki-xxx               1/1     Running
# promtail-xxx           1/1     Running (on each node)
# velora-backend-xxx     1/1     Running
```

## 🔍 Access Dashboards

### Option 1: Interactive Script (Easiest!)

Use the convenient port-forward script:

```bash
cd k8s
./port-forward.sh
# Choose option 4 (All monitoring) or 5 (Everything)
```

This will automatically forward:
- Grafana on port 3000
- Prometheus on port 9090
- Optionally your app on port 8080

### Option 2: Manual Port Forward

```bash
# Grafana (main dashboard)
kubectl port-forward -n velora-wear svc/grafana 3000:3000

# Prometheus (metrics backend)
kubectl port-forward -n velora-wear svc/prometheus 9090:9090

# Access URLs:
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

**Grafana Login:**
- Username: `admin`
- Password: `admin123` (change this in production!)

### Option 3: Through Ingress

If using ingress (ensure velora.local is in /etc/hosts):

```bash
# Access through ingress
# Grafana: http://velora.local/grafana
# Prometheus: http://velora.local/prometheus
```

## 📈 Available Metrics

### Backend Metrics (Express App)

The backend exposes metrics at `/metrics` endpoint:

#### HTTP Metrics
- `http_requests_total`: Total HTTP requests by method, route, status
- `http_request_duration_seconds`: Request duration histogram
- `http_requests_in_progress`: Currently processing requests

#### Node.js Metrics
- `nodejs_heap_size_used_bytes`: Heap memory used
- `nodejs_heap_size_total_bytes`: Total heap size
- `nodejs_external_memory_bytes`: External memory usage
- `nodejs_eventloop_lag_seconds`: Event loop lag

#### Business Metrics
- `orders_created_total`: Total orders created
- `products_viewed_total`: Product views by product_id
- `users_registered_total`: Total user registrations
- `auth_failures_total`: Authentication failures

#### Database Metrics (custom)
- `db_query_duration_seconds`: Database query duration

### Testing Metrics Endpoint

```bash
# Port forward to backend
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000

# View metrics
curl http://localhost:5000/metrics

# Health check
curl http://localhost:5000/health
```

## 📊 Grafana Dashboards

### Pre-configured Dashboard: "Velora Wear - Backend Metrics"

Includes panels for:
1. **HTTP Request Rate**: Requests per second by endpoint
2. **Response Time**: p50 and p95 percentiles
3. **Error Rate**: 5xx error rate gauge
4. **Status Code Distribution**: Pie chart of response codes
5. **Memory Usage**: Node.js heap usage
6. **Business Metrics**: Orders, Users, Product Views

### Import Additional Dashboards

1. Go to Grafana → Dashboards → Import
2. Import these popular dashboards by ID:
   - **1860**: Node Exporter Full
   - **315**: Kubernetes Cluster Monitoring
   - **11074**: Node.js Application Dashboard

## 📝 Log Exploration with Loki

### Access Logs in Grafana

1. Open Grafana → Explore
2. Select "Loki" as data source
3. Query examples:

```logql
# All backend logs
{namespace="velora-wear", app="velora-backend"}

# Error logs only
{namespace="velora-wear", app="velora-backend"} |= "ERROR"

# Orders-related logs
{namespace="velora-wear", app="velora-backend"} |= "order"

# Logs from last 5 minutes with filters
{namespace="velora-wear"} |= "POST" |= "/api/orders" | json | line_format "{{.msg}}"
```

### Common Log Queries

```logql
# Count errors over time
sum(count_over_time({namespace="velora-wear"} |= "ERROR" [5m])) by (pod)

# Top error messages
topk(10, sum by (pod) (count_over_time({namespace="velora-wear"} |= "ERROR" [1h])))

# Request logs with status codes
{namespace="velora-wear", app="velora-backend"} | json | status_code >= 400
```

## 🔔 Alerting

### Configure Alerts in Grafana

1. Go to Alerting → Alert Rules
2. Create alerts based on:
   - High error rate (>5% 5xx responses)
   - Slow response time (p95 > 2s)
   - High memory usage (>80%)
   - Pod restarts
   - Low request rate (potential outage)

### Sample Alert Configuration

Example: High Error Rate Alert
- **Condition**: `rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05`
- **For**: 5 minutes
- **Action**: Send notification to Slack/Email

## 🎯 Custom Metrics Usage

### Track Custom Business Events

Add custom metrics in your code:

```javascript
import { ordersCreatedTotal, productsViewedTotal } from './middleware/metrics.js';

// In your order creation endpoint
ordersCreatedTotal.inc();

// In your product detail endpoint
productsViewedTotal.inc({ product_id: req.params.id });
```

## 🔧 Configuration

### Storage Retention

Current retention settings:
- **Prometheus**: 30 days (configurable in prometheus.yml)
- **Loki**: 31 days (744h in loki.yaml)

To change retention:

```yaml
# Edit prometheus-config.yaml
# Add to prometheus args:
--storage.tsdb.retention.time=60d

# Edit loki-deployment.yaml
# In limits_config:
retention_period: 1440h  # 60 days
```

### Resource Requirements

Current resource allocations:
- Prometheus: 512Mi memory, 500m CPU
- Grafana: 256Mi memory, 250m CPU
- Loki: 256Mi memory, 200m CPU
- Promtail: 128Mi memory, 100m CPU (per node)

## 🐛 Troubleshooting

### Prometheus Not Scraping Backend

```bash
# Check Prometheus targets
kubectl port-forward -n velora-wear svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Verify backend has annotations
kubectl describe pod -n velora-wear -l app=velora-backend | grep Annotations

# Check metrics endpoint
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000
curl http://localhost:5000/metrics
```

### Loki Not Receiving Logs

```bash
# Check Promtail logs
kubectl logs -n velora-wear -l app=promtail --tail=50

# Verify Loki is running
kubectl logs -n velora-wear -l app=loki --tail=50

# Check if Promtail can reach Loki
kubectl exec -n velora-wear -it <promtail-pod> -- wget -O- http://loki:3100/ready
```

### Grafana Can't Connect to Data Sources

```bash
# Check Grafana logs
kubectl logs -n velora-wear -l app=grafana --tail=50

# Verify services
kubectl get svc -n velora-wear | grep -E "(prometheus|loki)"

# Test connectivity from Grafana pod
kubectl exec -n velora-wear -it <grafana-pod> -- wget -O- http://prometheus:9090/-/healthy
kubectl exec -n velora-wear -it <grafana-pod> -- wget -O- http://loki:3100/ready
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n velora-wear

# If Prometheus is using too much memory, reduce retention or increase resources
# Edit prometheus-deployment.yaml and adjust resources.limits.memory
```

## 📚 Query Examples

### PromQL (Prometheus Queries)

```promql
# Request rate by endpoint
rate(http_requests_total{app="velora-backend"}[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
(rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100

# Memory growth rate
rate(nodejs_heap_size_used_bytes[5m])

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])))
```

### LogQL (Loki Queries)

```logql
# All backend logs
{namespace="velora-wear", app="velora-backend"}

# Parse JSON logs and filter
{app="velora-backend"} | json | level="error"

# Count errors per minute
sum(count_over_time({app="velora-backend"} |= "ERROR" [1m]))

# Pattern matching
{app="velora-backend"} |~ "POST /api/(orders|products)"
```

## 🔐 Security Considerations

### Production Setup

1. **Change Grafana Password**:
   ```bash
   # Edit grafana-deployment.yaml
   # Change GF_SECURITY_ADMIN_PASSWORD environment variable
   ```

2. **Enable Authentication for Prometheus**:
   - Add basic auth or use OAuth proxy
   - Restrict ingress access

3. **Use Secrets for Sensitive Data**:
   ```bash
   kubectl create secret generic grafana-admin -n velora-wear \
     --from-literal=admin-user=admin \
     --from-literal=admin-password=<secure-password>
   ```

4. **Network Policies**:
   - Restrict pod-to-pod communication
   - Allow only necessary traffic

## 📖 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [prom-client Node.js Library](https://github.com/siimon/prom-client)

## 🎓 Best Practices

1. **Label Cardinality**: Don't use high-cardinality labels (user IDs, timestamps)
2. **Query Optimization**: Use recording rules for frequently-used queries
3. **Dashboard Organization**: Organize dashboards by team/service
4. **Alert Fatigue**: Set appropriate thresholds to avoid too many alerts
5. **Regular Cleanup**: Archive old dashboards and delete unused metrics

## 📧 Support

For issues or questions:
1. Check logs: `kubectl logs -n velora-wear <pod-name>`
2. View events: `kubectl get events -n velora-wear --sort-by='.lastTimestamp'`
3. Describe resources: `kubectl describe <resource> -n velora-wear`
