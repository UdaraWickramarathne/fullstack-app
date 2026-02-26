# Port Forward Guide

Updated script that can forward ports for the app, Grafana, and Prometheus.

## Usage

```bash
cd k8s
./port-forward.sh
```

## Options

The script provides an interactive menu:

1. **App only** - Forward port 8080 to your frontend/backend
2. **Grafana only** - Forward port 3000 to Grafana dashboard
3. **Prometheus only** - Forward port 9090 to Prometheus
4. **All monitoring** - Forward both Grafana and Prometheus
5. **Everything** - Forward app + Grafana + Prometheus
6. **Custom selection** - Choose exactly what you want

## Access URLs

After running the script:

### App
- **URL**: http://velora.local:8080
- **Port**: 8080

### Grafana
- **URL**: http://localhost:3000
- **Port**: 3000
- **Username**: admin
- **Password**: admin123

### Prometheus
- **URL**: http://localhost:9090
- **Port**: 9090

## Features

✅ Interactive menu-driven interface  
✅ Automatic port conflict detection and resolution  
✅ Multiple services can run simultaneously  
✅ Proper cleanup on Ctrl+C  
✅ Service availability checking  
✅ Process tracking with PID files  

## Examples

### Forward everything (recommended for development)
```bash
./port-forward.sh
# Choose option 5
```

### Forward only monitoring tools
```bash
./port-forward.sh
# Choose option 4
```

### Quick access to Grafana
```bash
./port-forward.sh
# Choose option 2
# Open http://localhost:3000
```

## Stopping Port Forwards

Simply press **Ctrl+C** in the terminal where the script is running. It will automatically clean up all port forwards.

## Troubleshooting

### Port already in use
The script will detect this and offer to kill the existing process.

### Service not found
Make sure the services are deployed:
```bash
kubectl get svc -n velora-wear
```

### kubectl not found
Install kubectl or ensure it's in your PATH.

## Manual Port Forwarding

If you prefer manual commands:

```bash
# Grafana
kubectl port-forward -n velora-wear svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n velora-wear svc/prometheus 9090:9090

# Backend directly
kubectl port-forward -n velora-wear svc/velora-backend-service 5000:5000

# Frontend directly
kubectl port-forward -n velora-wear svc/velora-frontend-service 3001:80
```

## Tips

- The script runs in foreground and keeps port forwards active
- All forwards stop when you press Ctrl+C
- You can check active forwards by looking at `/tmp/velora-pf-*.pid` files
- If the script crashes, manually clean up: `rm /tmp/velora-pf-*.pid`
