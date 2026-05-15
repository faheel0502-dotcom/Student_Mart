const { pool } = require('../config/db');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "user"');
    const [[products]] = await pool.query('SELECT COUNT(*) as total FROM products');
    const [[activeProducts]] = await pool.query('SELECT COUNT(*) as total FROM products WHERE status = "active"');
    const [[soldProducts]] = await pool.query('SELECT COUNT(*) as total FROM products WHERE status = "sold"');
    const [[orders]] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE status = "paid"');
    const [[revenue]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "paid"'
    );
    const [[postingFeeRevenue]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "paid" AND payment_type = "posting_fee"'
    );
    const [[platformFeeRevenue]] = await pool.query(
      'SELECT COALESCE(SUM(platform_fee), 0) as total FROM orders WHERE status = "paid"'
    );

    // Recent activity
    const [recentOrders] = await pool.query(
      `SELECT o.*, p.title as product_title, buyer.full_name as buyer_name, seller.full_name as seller_name
       FROM orders o JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id JOIN users seller ON o.seller_id = seller.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        stats: {
          users: users.total,
          totalProducts: products.total,
          activeProducts: activeProducts.total,
          soldProducts: soldProducts.total,
          totalOrders: orders.total,
          totalRevenue: revenue.total,
          postingFeeRevenue: postingFeeRevenue.total,
          platformFeeRevenue: platformFeeRevenue.total,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) { where += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role) { where += ' AND role = ?'; params.push(role); }

    const [users] = await pool.query(
      `SELECT id, full_name, email, phone, college_name, role, is_active, is_banned, created_at,
        (SELECT COUNT(*) FROM products WHERE seller_id = u.id) as products_count,
        (SELECT COUNT(*) FROM orders WHERE buyer_id = u.id) as purchases_count
       FROM users u ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    res.json({ success: true, data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// GET /api/admin/products
const getAdminProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND p.status = ?'; params.push(status); }

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, u.full_name as seller_name, u.email as seller_email,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary=1 LIMIT 1) as primary_image
       FROM products p JOIN categories c ON p.category_id = c.id JOIN users u ON p.seller_id = u.id
       ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${where}`, params
    );
    res.json({ success: true, data: { products, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// GET /api/admin/transactions
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const [payments] = await pool.query(
      `SELECT p.*, u.full_name as user_name, u.email as user_email, pr.title as product_title
       FROM payments p JOIN users u ON p.user_id = u.id LEFT JOIN products pr ON p.product_id = pr.id
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM payments');
    res.json({ success: true, data: { payments, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// PUT /api/admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await pool.query('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?', [reason, id]);
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, "BAN_USER", "user", ?, ?)',
      [req.user.id, id, reason]
    );
    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to ban user' });
  }
};

// PUT /api/admin/users/:id/unban
const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?', [id]);
    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unban user' });
  }
};

// DELETE /api/admin/products/:id
const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET status = "rejected" WHERE id = ?', [id]);
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_type, target_id) VALUES (?, "REMOVE_PRODUCT", "product", ?)',
      [req.user.id, id]
    );
    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove product' });
  }
};

module.exports = { getDashboard, getUsers, getAdminProducts, getTransactions, banUser, unbanUser, removeProduct };
