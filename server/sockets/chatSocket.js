const { pool } = require('../config/db');

const initSocket = (io) => {
  // Track online users: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins with their userId
    socket.on('user:join', (userId) => {
      if (userId) {
        onlineUsers.set(String(userId), socket.id);
        socket.userId = String(userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        console.log(`👤 User ${userId} joined`);
      }
    });

    // Join a specific conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send a message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, senderId, message, messageType = 'text' } = data;

        // Verify sender is part of conversation
        const [conv] = await pool.query(
          'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
          [conversationId, senderId, senderId]
        );
        if (!conv.length) return;

        // Save message to DB
        const [result] = await pool.query(
          'INSERT INTO messages (conversation_id, sender_id, message, message_type) VALUES (?, ?, ?, ?)',
          [conversationId, senderId, message, messageType]
        );

        const otherUnread = conv[0].buyer_id === senderId ? 'seller_unread' : 'buyer_unread';
        await pool.query(
          `UPDATE conversations SET last_message = ?, last_message_at = NOW(), ${otherUnread} = ${otherUnread} + 1 WHERE id = ?`,
          [message, conversationId]
        );

        // Get message with sender info
        const [messages] = await pool.query(
          `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
           FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
          [result.insertId]
        );

        const newMessage = messages[0];

        // Emit to all in the conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', newMessage);

        // Notify the other user if they're online
        const otherUserId = conv[0].buyer_id === senderId ? conv[0].seller_id : conv[0].buyer_id;
        const otherSocketId = onlineUsers.get(String(otherUserId));
        if (otherSocketId) {
          io.to(otherSocketId).emit('conversation:update', {
            conversationId,
            lastMessage: message,
            lastMessageAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message:error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
    });

    // Mark messages as read
    socket.on('messages:read', async ({ conversationId, userId }) => {
      try {
        await pool.query(
          'UPDATE messages SET is_read = 1, read_at = NOW() WHERE conversation_id = ? AND sender_id != ?',
          [conversationId, userId]
        );
        const field = (await pool.query('SELECT buyer_id FROM conversations WHERE id = ?', [conversationId]))[0][0]?.buyer_id === userId
          ? 'buyer_unread' : 'seller_unread';
        await pool.query(`UPDATE conversations SET ${field} = 0 WHERE id = ?`, [conversationId]);

        socket.to(`conversation:${conversationId}`).emit('messages:read', { conversationId, userId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        console.log(`❌ User ${socket.userId} disconnected`);
      }
    });
  });
};

module.exports = initSocket;
