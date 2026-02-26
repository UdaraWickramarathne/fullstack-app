import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route']
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2]
});

const ordersCreatedTotal = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created'
});

const productsViewedTotal = new client.Counter({
  name: 'products_viewed_total',
  help: 'Total number of product views',
  labelNames: ['product_id']
});

const usersRegisteredTotal = new client.Counter({
  name: 'users_registered_total',
  help: 'Total number of users registered'
});

const authFailuresTotal = new client.Counter({
  name: 'auth_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['reason']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(ordersCreatedTotal);
register.registerMetric(productsViewedTotal);
register.registerMetric(usersRegisteredTotal);
register.registerMetric(authFailuresTotal);

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();
  const route = req.route ? req.route.path : req.path;
  
  // Track request in progress
  httpRequestsInProgress.inc({ method: req.method, route });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );
    httpRequestTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestsInProgress.dec({ method: req.method, route });

    originalEnd.apply(res, args);
  };

  next();
};

// Export metrics and register
export {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestsInProgress,
  dbQueryDuration,
  ordersCreatedTotal,
  productsViewedTotal,
  usersRegisteredTotal,
  authFailuresTotal
};
