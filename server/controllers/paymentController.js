const { pool } = require('../config/db');
const crypto = require('crypto');

// Helper: generate mock IDs
const mockId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

// POST /api/payments/create-order
// Creates a mock payment record and returns a "session" to the client
const createOrder = async (req, res) => {
  try {
    const { amount, type, productId } = req.body;

    const mockOrderId = mockId('order');
    const mockSessionId = mockId('session');

    // Save payment record as 'created'
    const [result] = await pool.query(
      `INSERT INTO payments (user_id, razorpay_order_id, amount, payment_type, status, product_id)
       VALUES (?, ?, ?, ?, 'created', ?)`,
      [req.user.id, mockOrderId, amount, type || 'posting_fee', productId || null]
    );

    res.json({
      success: true,
      data: {
        orderId: mockOrderId,
        sessionId: mockSessionId,
        paymentDbId: result.insertId,
        amount,
        currency: 'INR',
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment session' });
  }
};

// POST /api/payments/verify
// Marks the payment as paid (mock — no signature check needed)
const verifyPayment = async (req, res) => {
  try {
    const { payment_db_id, mock_payment_id } = req.body;

    const paymentId = mock_payment_id || mockId('pay');

    await pool.query(
      `UPDATE payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = 'mock_verified'
       WHERE id = ? AND user_id = ?`,
      [paymentId, payment_db_id, req.user.id]
    );

    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [payment_db_id]);
    if (!payments.length) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.json({
      success: true,
      message: 'Payment verified',
      data: { paymentId: payment_db_id, transactionId: paymentId },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// POST /api/payments/purchase
// Complete product purchase after mock payment
const purchaseProduct = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { productId, paymentDbId, mock_payment_id } = req.body;
    const buyerId = req.user.id;
    const paymentId = mock_payment_id || mockId('pay');

    // Get product
    const [products] = await conn.query(
      'SELECT * FROM products WHERE id = ? AND status = "active"',
      [productId]
    );
    if (!products.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Product not available' });
    }
    const product = products[0];

    if (product.seller_id === buyerId) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cannot buy your own listing' });
    }

    const platformFee = Math.round(product.price * 0.05); // 5% platform fee
    const sellerAmount = product.price - platformFee;

    // Save payment record
    const [payResult] = await conn.query(
      `INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, payment_type, status, product_id)
       VALUES (?, ?, ?, 'mock_verified', ?, 'purchase', 'paid', ?)`,
      [buyerId, mockId('order'), paymentId, product.price, productId]
    );

    // Create order
    await conn.query(
      `INSERT INTO orders (buyer_id, seller_id, product_id, payment_id, product_price, platform_fee, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [buyerId, product.seller_id, productId, payResult.insertId, product.price, platformFee, Number(product.price) + platformFee]
    );

    // Mark product as sold
    await conn.query('UPDATE products SET status = "sold" WHERE id = ?', [productId]);

    await conn.commit();
    res.json({ success: true, message: 'Purchase successful! 🎉' });
  } catch (error) {
    await conn.rollback();
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, message: 'Purchase failed' });
  } finally {
    conn.release();
  }
};

module.exports = { createOrder, verifyPayment, purchaseProduct };
