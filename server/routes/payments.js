const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, purchaseProduct } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/purchase', authenticate, purchaseProduct);

module.exports = router;
