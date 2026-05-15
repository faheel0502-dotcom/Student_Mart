const { pool } = require('../config/db');

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const [conversations] = await pool.query(
      `SELECT c.*,
        p.title as product_title, p.status as product_status,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
        buyer.full_name as buyer_name, buyer.avatar_url as buyer_avatar,
        seller.full_name as seller_name, seller.avatar_url as seller_avatar,
        CASE WHEN c.buyer_id = ? THEN c.buyer_unread ELSE c.seller_unread END as unread_count
       FROM conversations c
       JOIN products p ON c.product_id = p.id
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId]
    );
    res.json({ success: true, data: { conversations } });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// GET /api/chat/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const [conv] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [id, userId, userId]
    );
    if (!conv.length) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const [messages] = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ? ORDER BY m.created_at ASC`,
      [id]
    );

    // Mark messages as read
    await pool.query(
      'UPDATE messages SET is_read = 1, read_at = NOW() WHERE conversation_id = ? AND sender_id != ?',
      [id, userId]
    );

    // Reset unread count
    const field = conv[0].buyer_id === userId ? 'buyer_unread' : 'seller_unread';
    await pool.query(`UPDATE conversations SET ${field} = 0 WHERE id = ?`, [id]);

    res.json({ success: true, data: { messages, conversation: conv[0] } });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// POST /api/chat/conversations
const createOrGetConversation = async (req, res) => {
  try {
    const { seller_id, product_id } = req.body;
    const buyer_id = req.user.id;

    if (buyer_id === seller_id) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    // Find existing conversation
    const [existing] = await pool.query(
      'SELECT * FROM conversations WHERE buyer_id = ? AND seller_id = ? AND product_id = ?',
      [buyer_id, seller_id, product_id]
    );

    if (existing.length) {
      return res.json({ success: true, data: { conversation: existing[0] } });
    }

    // Create new conversation
    const [result] = await pool.query(
      'INSERT INTO conversations (buyer_id, seller_id, product_id) VALUES (?, ?, ?)',
      [buyer_id, seller_id, product_id]
    );

    const [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: { conversation: conv[0] } });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// POST /api/chat/conversations/:id/messages (REST fallback)
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const [conv] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [id, userId, userId]
    );
    if (!conv.length) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
      [id, userId, message]
    );

    const otherUnread = conv[0].buyer_id === userId ? 'seller_unread' : 'buyer_unread';
    await pool.query(
      `UPDATE conversations SET last_message = ?, last_message_at = NOW(), ${otherUnread} = ${otherUnread} + 1 WHERE id = ?`,
      [message, id]
    );

    res.json({ success: true, data: { messageId: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = { getConversations, getMessages, createOrGetConversation, sendMessage };
