const { pool } = require('../config/db');
const { deleteImage } = require('../config/cloudinary');

// GET /api/products - Fetch all active products with filters
const getProducts = async (req, res) => {
  try {
    const { search, category, condition, min_price, max_price, sort = 'newest', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE p.status = "active"';
    const params = [];

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      whereClause += ' AND c.slug = ?';
      params.push(category);
    }
    if (condition) {
      whereClause += ' AND p.condition_type = ?';
      params.push(condition);
    }
    if (min_price) { whereClause += ' AND p.price >= ?'; params.push(min_price); }
    if (max_price) { whereClause += ' AND p.price <= ?'; params.push(max_price); }

    const orderMap = {
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
    };
    const orderBy = orderMap[sort] || 'p.created_at DESC';

    const query = `
      SELECT p.*, 
        c.name as category_name, c.slug as category_slug,
        u.full_name as seller_name, u.college_name as seller_college, u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM wishlist WHERE product_id = p.id) as wishlist_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const [products] = await pool.query(query, params);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        products,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        u.id as seller_id, u.full_name as seller_name, u.college_name as seller_college,
        u.avatar_url as seller_avatar, u.phone as seller_phone, u.email as seller_email,
        u.created_at as seller_since
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = ? AND p.status = "active"`,
      [id]
    );

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
      [id]
    );

    // Similar products
    const [similar] = await pool.query(
      `SELECT p.*, 
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.status = "active"
       LIMIT 6`,
      [products[0].category_id, id]
    );

    // Increment views
    await pool.query('UPDATE products SET views = views + 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      data: { product: { ...products[0], images }, similar },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// POST /api/products - Create product after payment verification
const createProduct = async (req, res) => {
  try {
    const { title, description, category_id, price, original_price, condition_type, location, is_negotiable, payment_id } = req.body;
    const files = req.files;

    // Verify posting fee payment
    const [payment] = await pool.query(
      'SELECT * FROM payments WHERE id = ? AND user_id = ? AND payment_type = "posting_fee" AND status = "paid"',
      [payment_id, req.user.id]
    );
    if (!payment.length) {
      return res.status(403).json({ success: false, message: 'Posting fee payment required' });
    }

    // Sanitize & cast types (FormData sends everything as strings)
    const isNeg = is_negotiable === true || is_negotiable === 'true' || is_negotiable === '1' ? 1 : 0;
    const priceVal = parseFloat(price) || 0;
    const origPriceVal = original_price ? parseFloat(original_price) : null;

    // Create product
    const [result] = await pool.query(
      `INSERT INTO products (seller_id, category_id, title, description, price, original_price, condition_type, location, is_negotiable, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "active")`,
      [req.user.id, category_id, title, description, priceVal, origPriceVal, condition_type, location || '', isNeg]
    );

    const productId = result.insertId;

    // Save images — supports both Cloudinary (file.path = https url) and local storage (file.filename)
    if (files && files.length) {
      const imageValues = files.map((file, i) => {
        // Cloudinary gives a full https URL in file.path; local storage gives a filename
        const imageUrl = file.path.startsWith('http')
          ? file.path
          : `/uploads/products/${file.filename}`;
        const publicId = file.filename || file.public_id || file.path;
        return [productId, imageUrl, publicId, i === 0 ? 1 : 0, i];
      });
      await pool.query(
        'INSERT INTO product_images (product_id, image_url, public_id, is_primary, sort_order) VALUES ?',
        [imageValues]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: { productId },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (!products.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = products[0];
    if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete images from Cloudinary
    const [images] = await pool.query('SELECT public_id FROM product_images WHERE product_id = ?', [id]);
    for (const img of images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

// GET /api/products/my-listings
const getMyListings = async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: { products } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

module.exports = { getProducts, getProductById, createProduct, deleteProduct, getMyListings };
