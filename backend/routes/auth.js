import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { usersRegisteredTotal } from '../middleware/metrics.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/auth/register - Registration attempt for email: ${req.body.email}`);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(`[${new Date().toISOString()}] POST /api/auth/register - Validation errors:`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/register - User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'customer'
    });

    if (user) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/register - User registered successfully: ${user.email} (ID: ${user._id})`);
      usersRegisteredTotal.inc();
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/auth/register - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/auth/login - Login attempt for email: ${req.body.email}`);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(`[${new Date().toISOString()}] POST /api/auth/login - Validation errors:`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/login - User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/login - Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[${new Date().toISOString()}] POST /api/auth/login - User logged in successfully: ${user.email} (ID: ${user._id})`);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/auth/login - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/auth/me - User: ${req.user._id}`);
  try {
    const user = await User.findById(req.user._id).select('-password');
    console.log(`[${new Date().toISOString()}] GET /api/auth/me - User details retrieved: ${user.email}`);
    res.json(user);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/auth/me - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /api/auth/profile - User: ${req.user._id} updating profile`);
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        console.log(`[${new Date().toISOString()}] PUT /api/auth/profile - Password update requested for user: ${req.user._id}`);
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      console.log(`[${new Date().toISOString()}] PUT /api/auth/profile - Profile updated successfully: ${updatedUser.email}`);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        token: generateToken(updatedUser._id)
      });
    } else {
      console.log(`[${new Date().toISOString()}] PUT /api/auth/profile - User not found: ${req.user._id}`);
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/auth/profile - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
