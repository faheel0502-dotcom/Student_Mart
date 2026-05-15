const express = require('express');
const router = express.Router();
const {
  getDashboard, getUsers, getAdminProducts,
  getTransactions, banUser, unbanUser, removeProduct
} = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate, isAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/products', getAdminProducts);
router.get('/transactions', getTransactions);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.delete('/products/:id', removeProduct);

module.exports = router;
