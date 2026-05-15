const express = require('express');
const router = express.Router();
const { getOrders, getOrderById } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);

module.exports = router;
