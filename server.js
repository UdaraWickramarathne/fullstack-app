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

// Basic route
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET / - Root endpoint accessed`);
  res.json({ 
    message: 'Welcome to Velora Wear API',
    documentation: `http://localhost:${process.env.PORT || 5000}/api-docs`,
    version: '1.0.0'
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
