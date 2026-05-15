const express = require('express');
const router = express.Router();
const { getConversations, getMessages, createOrGetConversation, sendMessage } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, createOrGetConversation);
router.get('/conversations/:id/messages', authenticate, getMessages);
router.post('/conversations/:id/messages', authenticate, sendMessage);

module.exports = router;
