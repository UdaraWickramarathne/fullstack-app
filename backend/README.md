# Velora Wear Backend

Backend API for Velora Wear clothing shop built with Express.js and MongoDB.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/velora-wear
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (Protected)
- PUT `/api/auth/profile` - Update profile (Protected)

### Products
- GET `/api/products` - Get all products (with filters)
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (Admin)
- PUT `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Orders
- POST `/api/orders` - Create order (Protected)
- GET `/api/orders/myorders` - Get user orders (Protected)
- GET `/api/orders/:id` - Get order by ID (Protected)
- GET `/api/orders` - Get all orders (Admin)
- PUT `/api/orders/:id/status` - Update order status (Admin)
- PUT `/api/orders/:id/payment` - Update payment status (Admin)

### Reviews
- GET `/api/reviews` - Get all reviews
- POST `/api/reviews` - Create review

### Admin
- GET `/api/admin/stats` - Get dashboard stats (Admin)
- GET `/api/admin/users` - Get all users (Admin)
- DELETE `/api/admin/users/:id` - Delete user (Admin)

## Default Admin Account

To create an admin account, register a normal user and then manually update the role in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```
