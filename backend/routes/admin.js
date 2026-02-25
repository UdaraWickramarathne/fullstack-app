import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/admin/stats - Admin: ${req.user._id} retrieving dashboard stats`);
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`[${new Date().toISOString()}] GET /api/admin/stats - Stats retrieved: ${totalUsers} users, ${totalOrders} orders, $${totalRevenue.toFixed(2)} revenue`);
    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      recentOrders
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/admin/stats - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/admin/users - Admin: ${req.user._id} retrieving all users`);
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    console.log(`[${new Date().toISOString()}] GET /api/admin/users - Retrieved ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/admin/users - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/admin/users/${req.params.id} - Admin: ${req.user._id}`);
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      console.log(`[${new Date().toISOString()}] DELETE /api/admin/users/${req.params.id} - User not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    console.log(`[${new Date().toISOString()}] DELETE /api/admin/users/${req.params.id} - User deleted: ${user.email}`);
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/admin/users/${req.params.id} - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
