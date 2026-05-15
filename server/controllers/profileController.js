const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, college_name, department, year, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const [listingsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = "active"', [req.user.id]
    );
    const [soldCount] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE seller_id = ?', [req.user.id]
    );
    const [purchasedCount] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE buyer_id = ?', [req.user.id]
    );

    res.json({
      success: true,
      data: {
        user: rows[0],
        stats: {
          listings: listingsCount[0].count,
          sold: soldCount[0].count,
          purchased: purchasedCount[0].count,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, college_name, department, year } = req.body;
    let avatar_url = null;

    if (req.file) {
      // Cloudinary gives a full https URL; local disk gives an absolute path
      avatar_url = req.file.path.startsWith('http')
        ? req.file.path
        : `/uploads/avatars/${req.file.filename}`;
    }

    const updateFields = [];
    const values = [];

    if (full_name) { updateFields.push('full_name = ?'); values.push(full_name); }
    if (phone) { updateFields.push('phone = ?'); values.push(phone); }
    if (college_name) { updateFields.push('college_name = ?'); values.push(college_name); }
    if (department) { updateFields.push('department = ?'); values.push(department); }
    if (year) { updateFields.push('year = ?'); values.push(year); }
    if (avatar_url) { updateFields.push('avatar_url = ?'); values.push(avatar_url); }

    if (!updateFields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      'SELECT id, full_name, email, phone, college_name, department, year, role, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, message: 'Profile updated', data: { user: updated[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// PUT /api/profile/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
