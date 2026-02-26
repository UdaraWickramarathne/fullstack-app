# Backend API Load Testing

This directory contains load testing scripts to stress test the Velora Wear backend API, specifically testing concurrent user authentication scenarios.

## Available Tests

### 1. K6 Load Test (Recommended)
**File:** `k6-login-stress.js`

A comprehensive load test using k6 that provides:
- Gradual ramp-up of virtual users
- Detailed metrics and statistics
- Integration with Prometheus/Grafana
- Professional load testing capabilities

**Features:**
- Simulates 100 concurrent users logging in simultaneously
- Tests registration → login → authenticated request flow
- Provides detailed response time percentiles
- Checks for errors and threshold violations

### 2. Node.js Stress Test (Simple Alternative)
**File:** `node-stress-test.js`

A simple Node.js script with no external dependencies that:
- Uses native fetch API (Node 18+)
- Easy to run and understand
- Provides detailed console output
- Good for quick tests

## Prerequisites

### For K6 Tests
Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6
```

### For Node.js Tests
- Node.js 18+ (for native fetch support)

## Running the Tests

### Quick Start - Node.js Test

**Test against local backend:**
```bash
# From the load test directory
cd backend/tests/load

# Run with default settings (100 concurrent users)
node node-stress-test.js

# Custom configuration
CONCURRENT_USERS=50 node node-stress-test.js
CONCURRENT_USERS=200 ITERATIONS=3 node node-stress-test.js
```

**Test against Kubernetes backend:**
```bash
# Make sure port-forwarding is active
cd ../../../k8s
./port-forward.sh

# In another terminal, run the test
cd ../backend/tests/load
BASE_URL=http://localhost:3000 node node-stress-test.js
```

### Advanced - K6 Test

**Test against local backend:**
```bash
cd backend/tests/load

# Run k6 test
k6 run k6-login-stress.js

# With custom base URL
k6 run -e BASE_URL=http://localhost:5000 k6-login-stress.js
```

**Test against Kubernetes backend:**
```bash
# Make sure port-forwarding is active
cd k8s
./port-forward.sh

# In another terminal
cd ../backend/tests/load
k6 run -e BASE_URL=http://localhost:3000 k6-login-stress.js
```

**With Prometheus metrics export:**
```bash
# K6 can export metrics to Prometheus
k6 run --out experimental-prometheus-rw k6-login-stress.js
```

## Test Scenarios

### Default K6 Test Profile
- **Stage 1:** Ramp up from 0 to 100 users over 30 seconds
- **Stage 2:** Maintain 100 concurrent users for 1 minute
- **Stage 3:** Ramp down to 0 users over 30 seconds

Each virtual user performs:
1. Register a new user account
2. Login with credentials
3. Make an authenticated request to `/api/auth/me`

### Default Node.js Test Profile
- **Concurrent Users:** 100 (configurable)
- **Iterations:** 1 (configurable)

Each user performs:
1. Register a new user account
2. Login with credentials
3. Verify token with `/api/auth/me`

## Environment Variables

### Node.js Test
| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5000` | Backend API URL |
| `CONCURRENT_USERS` | `100` | Number of concurrent users |
| `ITERATIONS` | `1` | Number of test iterations |

### K6 Test
| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5000` | Backend API URL |

## Interpreting Results

### Node.js Test Output
```
Registration:
  Successful:        100
  Failed:            0

Login Requests:
  Total:             100
  Successful:        98
  Failed:            2
  Success Rate:      98.00%

Response Times (Login):
  Average:           245.32ms
  Min:               89ms
  Max:               892ms
  Median (p50):      212ms
  95th percentile:   456ms
  99th percentile:   780ms
```

**Performance Guidelines:**
- ✅ **Excellent:** Success rate ≥95%, p95 <500ms
- ⚠️  **Good:** Success rate ≥90%, p95 <1000ms
- ❌ **Needs Improvement:** Success rate <90% or p95 >1000ms

### K6 Test Output
K6 provides detailed metrics including:
- `http_req_duration`: Request duration statistics
- `http_req_failed`: Failed request rate
- `iterations`: Number of completed iterations
- Custom metrics for error tracking

## Monitoring During Tests

### Watch Grafana Dashboards
1. Start port forwarding: `./k8s/port-forward.sh`
2. Open Grafana: http://localhost:3001
3. View the "Velora Backend Metrics" dashboard
4. Watch metrics in real-time during load test

### Watch Prometheus Metrics
1. Open Prometheus: http://localhost:9090
2. Query relevant metrics:
   - `rate(http_requests_total[1m])`
   - `http_request_duration_seconds`
   - `nodejs_heap_size_used_bytes`

### Watch Kubernetes Pods
```bash
# Watch pod resource usage
kubectl top pods -n velora-wear

# Watch pod logs
kubectl logs -f -l app=velora-backend -n velora-wear
```

## Troubleshooting

### Connection Refused
**Issue:** Cannot connect to backend
**Solution:** 
- Ensure backend is running: `kubectl get pods -n velora-wear`
- Check port forwarding: `./k8s/port-forward.sh`
- Verify URL is correct

### High Error Rate
**Issue:** Many failed requests during test
**Possible Causes:**
- Database connection limits
- Memory constraints
- CPU throttling
- Network issues

**Solutions:**
- Check pod logs: `kubectl logs -l app=velora-backend -n velora-wear`
- Increase pod resources in `k8s/backend.yaml`
- Scale up replicas: `kubectl scale deployment/velora-backend -n velora-wear --replicas=3`

### Slow Response Times
**Issue:** High latency (p95 >1000ms)
**Solutions:**
- Check database performance
- Add database indexes
- Increase pod CPU limits
- Enable database connection pooling
- Add caching layer (Redis)

## Customizing Tests

### Modify K6 Test Stages
Edit `k6-login-stress.js`:
```javascript
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Slower ramp
    { duration: '30s', target: 200 },  // More users
    { duration: '2m', target: 200 },   // Longer duration
    { duration: '10s', target: 0 },
  ],
};
```

### Add More Test Scenarios
Example: Test product browsing under load
```javascript
// In k6-login-stress.js, after login:
const productsRes = http.get(`${data.baseUrl}/api/products`);
check(productsRes, {
  'products loaded': (r) => r.status === 200,
});
```

## Best Practices

1. **Start Small:** Begin with 10-20 users to establish baseline
2. **Gradual Increase:** Slowly increase load to find breaking point
3. **Monitor Resources:** Watch CPU, memory, and database connections
4. **Run Multiple Times:** Results should be consistent
5. **Test in Isolation:** Don't run other heavy processes during tests
6. **Document Results:** Keep records of performance over time

## Next Steps

After running stress tests:
1. Review Grafana dashboards for bottlenecks
2. Optimize slow endpoints
3. Add caching where appropriate
4. Consider horizontal scaling
5. Implement rate limiting if needed
6. Set up alerts for high error rates

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [HTTP Load Testing Best Practices](https://k6.io/docs/testing-guides/api-load-testing/)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
