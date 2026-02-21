import express from 'express';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/orders - User: ${req.user._id} creating order`);
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      console.log(`[${new Date().toISOString()}] POST /api/orders - No order items provided`);
      return res.status(400).json({ message: 'No order items' });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    });

    console.log(`[${new Date().toISOString()}] POST /api/orders - Order created successfully: ${order._id} (Total: $${totalPrice})`);
    res.status(201).json(order);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/orders - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/myorders
// @desc    Get logged in user orders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/orders/myorders - User: ${req.user._id}`);
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    console.log(`[${new Date().toISOString()}] GET /api/orders/myorders - Retrieved ${orders.length} orders for user: ${req.user._id}`);
    res.json(orders);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/orders/myorders - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/orders/${req.params.id} - User: ${req.user._id}`);
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      console.log(`[${new Date().toISOString()}] GET /api/orders/${req.params.id} - Order not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure user is owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log(`[${new Date().toISOString()}] GET /api/orders/${req.params.id} - Unauthorized access attempt by user: ${req.user._id}`);
      return res.status(401).json({ message: 'Not authorized' });
    }

    console.log(`[${new Date().toISOString()}] GET /api/orders/${req.params.id} - Order retrieved successfully`);
    res.json(order);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/orders/${req.params.id} - Error:`, error.message);
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/orders - Admin: ${req.user._id} retrieving all orders`);
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    console.log(`[${new Date().toISOString()}] GET /api/orders - Retrieved ${orders.length} total orders`);
    res.json(orders);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/orders - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/status - Admin: ${req.user._id} updating to: ${req.body.status}`);
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/status - Order not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = req.body.status;

    if (req.body.status === 'Delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
      console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/status - Order marked as delivered`);
    }

    const updatedOrder = await order.save();
    console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/status - Order status updated successfully`);

    res.json(updatedOrder);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/status - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update order payment status
// @access  Private/Admin
router.put('/:id/payment', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/payment - Admin: ${req.user._id} updating to: ${req.body.status}`);
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/payment - Order not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = req.body.status;
    const updatedOrder = await order.save();
    console.log(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/payment - Payment status updated successfully`);

    res.json(updatedOrder);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/orders/${req.params.id}/payment - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
