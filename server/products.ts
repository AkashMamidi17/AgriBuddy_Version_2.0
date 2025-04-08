import { Router } from 'express';
import { storage } from './storage.js';
import { insertProductSchema, insertBidSchema } from './schema.js';
import { Product, Bid } from './types.js';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await storage.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct({
      ...data,
      userId: req.user?.id,
      currentBid: null,
      biddingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active'
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Invalid product data' });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    await storage.updateProduct(productId, { status: 'deleted' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Place a bid on a product
router.post('/:id/bid', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ error: 'Product is not available for bidding' });
    }

    if (new Date(product.biddingEndTime) < new Date()) {
      return res.status(400).json({ error: 'Bidding has ended for this product' });
    }

    const { amount } = insertBidSchema.parse(req.body);
    if (amount <= (product.currentBid || product.price)) {
      return res.status(400).json({ error: 'Bid amount must be higher than current bid' });
    }

    const bid = await storage.createBid({
      productId,
      userId: req.user?.id,
      amount
    });

    await storage.updateProduct(productId, { currentBid: amount });
    res.json(bid);
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(400).json({ error: 'Invalid bid data' });
  }
});

export function setupProductRoutes(app: Express) {
  app.use('/api/products', router);
} 