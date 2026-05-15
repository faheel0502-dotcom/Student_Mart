const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getWishlist);
router.post('/:productId', authenticate, addToWishlist);
router.delete('/:productId', authenticate, removeFromWishlist);
router.get('/check/:productId', authenticate, checkWishlist);

module.exports = router;
