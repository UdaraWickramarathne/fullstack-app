# Multi-stage build for Velora Wear Frontend

# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Set default environment variables (can be overridden at runtime)
ENV API_URL=http://localhost:5000/api

# Copy custom nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache config.js - it needs to be runtime configurable
    location = /config.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Serve index.html for all routes (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy config template for runtime configuration
COPY --from=builder /app/public/config.template.js /usr/share/nginx/html/config.template.js

# Create startup script to handle runtime environment variables
RUN cat > /docker-entrypoint.d/40-generate-config.sh <<'EOF'
#!/bin/sh
set -e

# Generate config.js from environment variables
API_URL=${API_URL:-http://localhost:5000/api}

cat > /usr/share/nginx/html/config.js <<CONFIG
// Runtime Environment Configuration
// This file is generated from environment variables at container startup
window.configs = {
  apiUrl: '${API_URL}'
};
CONFIG

echo "Generated config.js with API_URL: ${API_URL}"
EOF

# Make the script executable
RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

# Create a non-root user and set permissions
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Update nginx.conf to run as non-root user
RUN sed -i 's/user  nginx;/user  nginx-user;/' /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# nginx will be started by the base image entrypoint
