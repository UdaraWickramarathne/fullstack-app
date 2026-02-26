import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDatabase from './config/database.js';
import createAdminUser from './scripts/seedAdmin.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import { metricsMiddleware, register } from './middleware/metrics.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OpenAPI specification
const swaggerDocument = YAML.load(join(__dirname, 'openapi.yaml'));

// Load env vars
dotenv.config();

console.log(`[${new Date().toISOString()}] ========================================`);
console.log(`[${new Date().toISOString()}] Starting Velora Wear API Server`);
console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[${new Date().toISOString()}] ========================================`);

// Connect to database and seed admin
console.log(`[${new Date().toISOString()}] Connecting to database...`);
connectDatabase().then(() => {
  console.log(`[${new Date().toISOString()}] Database connected successfully`);
  console.log(`[${new Date().toISOString()}] Seeding admin user...`);
  createAdminUser();
}).catch((error) => {
  console.error(`[${new Date().toISOString()}] Database connection failed:`, error.message);
  process.exit(1);
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware (before request logging)
app.use(metricsMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// API Documentation
console.log(`[${new Date().toISOString()}] Setting up API documentation at /api-docs`);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Velora Wear API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Routes
console.log(`[${new Date().toISOString()}] Registering API routes...`);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
console.log(`[${new Date().toISOString()}] All routes registered successfully`);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET / - Root endpoint accessed`);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ 
    message: 'Welcome to Velora Wear API',
    documentation: `${baseUrl}/api-docs`,
    version: '1.0.0',
    endpoints: {
      auth: `${baseUrl}/api/auth`,
      products: `${baseUrl}/api/products`,
      orders: `${baseUrl}/api/orders`,
      reviews: `${baseUrl}/api/reviews`,
      admin: `${baseUrl}/api/admin`
    }
  });
});

// API info route
app.get('/api', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api - API info endpoint accessed`);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ 
    message: 'Velora Wear API',
    version: '1.0.0',
    documentation: `${baseUrl}/api-docs`,
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile'
      },
      products: {
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        create: 'POST /api/products (Admin)',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)'
      },
      orders: {
        create: 'POST /api/orders',
        myOrders: 'GET /api/orders/myorders',
        get: 'GET /api/orders/:id',
        list: 'GET /api/orders (Admin)',
        updateStatus: 'PUT /api/orders/:id/status (Admin)',
        updatePayment: 'PUT /api/orders/:id/payment (Admin)'
      },
      reviews: {
        list: 'GET /api/reviews',
        create: 'POST /api/reviews'
      },
      admin: {
        stats: 'GET /api/admin/stats (Admin)',
        users: 'GET /api/admin/users (Admin)',
        deleteUser: 'DELETE /api/admin/users/:id (Admin)'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    code: '404',
    message: 'Not Found',
    description: 'The requested resource is not available.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR - ${req.method} ${req.originalUrl}:`, err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal Server Error',
    description: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] ========================================`);
  console.log(`[${new Date().toISOString()}] ✓ Server running on http://localhost:${PORT}`);
  console.log(`[${new Date().toISOString()}] ✓ API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`[${new Date().toISOString()}] ✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[${new Date().toISOString()}] ========================================`);
  console.log(`[${new Date().toISOString()}] Server is ready to accept requests`);
});
