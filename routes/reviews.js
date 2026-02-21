import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/reviews - Retrieving latest reviews`);
  try {
    const reviews = await Review.find().populate('user', 'name').sort({ createdAt: -1 }).limit(10);
    console.log(`[${new Date().toISOString()}] GET /api/reviews - Retrieved ${reviews.length} reviews`);
    res.json(reviews);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/reviews - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Public (for demo purposes)
router.post('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/reviews - Creating review for user: ${req.body.user}`);
  try {
    const review = await Review.create(req.body);
    console.log(`[${new Date().toISOString()}] POST /api/reviews - Review created successfully: ${review._id} (Rating: ${review.rating})`);
    res.status(201).json(review);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/reviews - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
