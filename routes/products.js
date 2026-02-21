import express from 'express';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/products - Query params:`, req.query);
  try {
    const { category, gender, search, sort, featured, newArrivals } = req.query;
    
    let query = {};

    if (category) {
      query.category = category;
    }

    if (gender) {
      query.gender = gender;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (newArrivals === 'true') {
      query.isNewArrival = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = {};
    if (sort === 'price-low') {
      sortOption.price = 1;
    } else if (sort === 'price-high') {
      sortOption.price = -1;
    } else if (sort === 'newest') {
      sortOption.createdAt = -1;
    } else {
      sortOption.createdAt = -1;
    }

    const products = await Product.find(query).sort(sortOption);
    console.log(`[${new Date().toISOString()}] GET /api/products - Retrieved ${products.length} products`);

    res.json(products);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/products - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/products/${req.params.id}`);
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      console.log(`[${new Date().toISOString()}] GET /api/products/${req.params.id} - Product not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log(`[${new Date().toISOString()}] GET /api/products/${req.params.id} - Product retrieved: ${product.name}`);
    res.json(product);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/products/${req.params.id} - Error:`, error.message);
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/products - Admin: ${req.user._id} creating product: ${req.body.name}`);
  try {
    const product = await Product.create(req.body);
    console.log(`[${new Date().toISOString()}] POST /api/products - Product created successfully: ${product.name} (ID: ${product._id})`);
    res.status(201).json(product);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/products - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /api/products/${req.params.id} - Admin: ${req.user._id} updating product`);
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      console.log(`[${new Date().toISOString()}] PUT /api/products/${req.params.id} - Product not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log(`[${new Date().toISOString()}] PUT /api/products/${req.params.id} - Product updated successfully: ${product.name}`);
    res.json(product);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/products/${req.params.id} - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/products/${req.params.id} - Admin: ${req.user._id}`);
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      console.log(`[${new Date().toISOString()}] DELETE /api/products/${req.params.id} - Product not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    console.log(`[${new Date().toISOString()}] DELETE /api/products/${req.params.id} - Product deleted: ${product.name}`);

    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/products/${req.params.id} - Error:`, error.message);
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
