const { pool } = require('../config/db');

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { type = 'purchased' } = req.query;
    let query;
    if (type === 'sold') {
      query = `SELECT o.*, p.title as product_title, p.id as product_id,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary=1 LIMIT 1) as product_image,
        u.full_name as buyer_name, u.avatar_url as buyer_avatar, u.phone as buyer_phone
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ? ORDER BY o.created_at DESC`;
    } else {
      query = `SELECT o.*, p.title as product_title, p.id as product_id,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary=1 LIMIT 1) as product_image,
        u.full_name as seller_name, u.avatar_url as seller_avatar, u.phone as seller_phone
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ? ORDER BY o.created_at DESC`;
    }
    const [orders] = await pool.query(query, [req.user.id]);
    res.json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query(
      `SELECT o.*, p.title as product_title, p.description as product_description,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary=1 LIMIT 1) as product_image,
        buyer.full_name as buyer_name, buyer.phone as buyer_phone, buyer.email as buyer_email,
        seller.full_name as seller_name, seller.phone as seller_phone, seller.email as seller_email,
        pay.razorpay_payment_id, pay.status as payment_status
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       LEFT JOIN payments pay ON o.payment_id = pay.id
       WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)`,
      [id, req.user.id, req.user.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { order: orders[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

module.exports = { getOrders, getOrderById };
