// Example: How to use custom metrics in your routes

import { 
  ordersCreatedTotal, 
  productsViewedTotal, 
  usersRegisteredTotal,
  authFailuresTotal
} from '../middleware/metrics.js';

// Example 1: Track order creation
router.post('/orders', protect, async (req, res) => {
  try {
    const order = await Order.create({
      user: req.user._id,
      items: req.body.items,
      // ... other fields
    });

    // Increment order metric
    ordersCreatedTotal.inc();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Example 2: Track product views
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Track product view with product ID as label
    productsViewedTotal.inc({ product_id: req.params.id });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Example 3: Track user registration
router.post('/auth/register', async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });

    // Increment user registration metric
    usersRegisteredTotal.inc();

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Example 4: Track authentication failures
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Track failure reason
      authFailuresTotal.inc({ reason: 'user_not_found' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Track failure reason
      authFailuresTotal.inc({ reason: 'invalid_password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Example 5: Advanced - Track database query duration
import { dbQueryDuration } from '../middleware/metrics.js';

router.get('/orders', protect, async (req, res) => {
  const start = Date.now();
  
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product');

    // Record query duration
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    dbQueryDuration.observe(
      { operation: 'find', collection: 'orders' },
      duration
    );

    res.json(orders);
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe(
      { operation: 'find_error', collection: 'orders' },
      duration
    );
    res.status(500).json({ message: error.message });
  }
});

// Example 6: Track specific business events
import { Counter } from 'prom-client';

// Create a custom metric (add to metrics.js)
const checkoutAbandoned = new Counter({
  name: 'checkout_abandoned_total',
  help: 'Total number of abandoned checkouts',
  labelNames: ['step']
});

// Use in checkout flow
router.post('/checkout/abandon', protect, async (req, res) => {
  const { step } = req.body; // e.g., 'payment', 'shipping', 'review'
  
  checkoutAbandoned.inc({ step });
  
  res.json({ message: 'Checkout state saved' });
});
