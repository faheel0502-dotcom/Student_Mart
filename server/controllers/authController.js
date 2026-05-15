const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, college_name, department, year } = req.body;

    // Check existing user
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, college_name, department, year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, hashedPassword, college_name, department, year]
    );

    const { accessToken, refreshToken } = generateTokens(result.insertId);

    // Save refresh token
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, result.insertId]);

    const [user] = await pool.query(
      'SELECT id, full_name, email, phone, college_name, department, year, role, avatar_url FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: user[0], accessToken, refreshToken },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (user.is_banned) {
      return res.status(403).json({ success: false, message: `Account banned: ${user.ban_reason || 'Policy violation'}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    const safeUser = {
      id: user.id, full_name: user.full_name, email: user.email,
      phone: user.phone, college_name: user.college_name,
      department: user.department, year: user.year,
      role: user.role, avatar_url: user.avatar_url,
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser, accessToken, refreshToken },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, token]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefresh, decoded.id]);

    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, college_name, department, year, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: { user: rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
