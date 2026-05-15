const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, deleteProduct, getMyListings } = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');
const { pool } = require('../config/db');

router.get('/', optionalAuth, getProducts);
router.get('/my-listings', authenticate, getMyListings);
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: { categories: rows } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to fetch categories' }); }
});
router.get('/:id', optionalAuth, getProductById);
router.post('/', authenticate, uploadProduct.array('images', 5), createProduct);
router.delete('/:id', authenticate, deleteProduct);

module.exports = router;
