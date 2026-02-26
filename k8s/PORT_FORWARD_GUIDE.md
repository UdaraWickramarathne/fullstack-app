# Port Forward Guide

Automated script that forwards ports for the app, Grafana, and Prometheus.

**By default**, the script forwards everything (app + monitoring) for maximum convenience!

## Usage

### Default (Everything)

Simply run the script to forward all services:

```bash
cd k8s
./port-forward.sh
```

This forwards:
- App on port 8080
- Grafana on port 3000
- Prometheus on port 9090

### Specific Services

You can also forward specific services:

```bash
./port-forward.sh app        # App only
./port-forward.sh grafana    # Grafana only
./port-forward.sh prometheus # Prometheus only
./port-forward.sh monitoring # Grafana + Prometheus
./port-forward.sh all        # Everything (default)
```

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

✅ **Auto-forwards everything by default** - Just run and go!  
✅ Automatic port conflict detection and resolution  
✅ Multiple services run simultaneously  
✅ Proper cleanup on Ctrl+C  
✅ Service availability checking  
✅ Process tracking with PID files  
✅ Optional mode selection via command-line argument  

## Examples

### Forward everything (default)
```bash
./port-forward.sh
# Automatically forwards app + Grafana + Prometheus
```

### Forward only monitoring tools
```bash
./port-forward.sh monitoring
# Forwards Grafana + Prometheus only
```

### Quick access to Grafana
```bash
./port-forward.sh grafana
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
