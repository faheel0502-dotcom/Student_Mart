const { pool } = require('../config/db');

// GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT w.id, w.created_at,
        p.id as product_id, p.title, p.price, p.status, p.condition_type,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        u.full_name as seller_name
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: { wishlist: items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};

// POST /api/wishlist/:productId
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Already in wishlist' });
    }
    await pool.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
};

// DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
};

// GET /api/wishlist/check/:productId
const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    res.json({ success: true, data: { isWishlisted: rows.length > 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check wishlist' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };
