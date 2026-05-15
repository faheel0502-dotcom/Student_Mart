import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiSend } from 'react-icons/fi';

const ChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await chatService.getMessages(id);
      setMessages(data.data.messages);
      setConversation(data.data.conversation);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchMessages();
    socket?.joinConversation(id);
    socket?.markRead({ conversationId: id, userId: user?.id });
    return () => socket?.leaveConversation(id);
  }, [id, socket, user, fetchMessages]);

  useEffect(() => {
    const handleNew = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender_id !== user?.id) {
        socket?.markRead({ conversationId: id, userId: user?.id });
      }
    };
    const handleTypingStart = ({ userId }) => { if (userId !== user?.id) setIsTyping(true); };
    const handleTypingStop = ({ userId }) => { if (userId !== user?.id) setIsTyping(false); };

    socket?.on('message:new', handleNew);
    socket?.on('typing:start', handleTypingStart);
    socket?.on('typing:stop', handleTypingStop);
    return () => {
      socket?.off('message:new', handleNew);
      socket?.off('typing:start', handleTypingStart);
      socket?.off('typing:stop', handleTypingStop);
    };
  }, [socket, user, id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket?.startTyping({ conversationId: id, userId: user?.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.stopTyping({ conversationId: id, userId: user?.id });
    }, 1500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setText('');
    socket?.stopTyping({ conversationId: id, userId: user?.id });

    // Optimistic UI
    const tempMsg = { id: `temp_${Date.now()}`, conversation_id: id, sender_id: user?.id, message: msg, sender_name: user?.full_name, created_at: new Date().toISOString(), is_read: false };
    setMessages((prev) => [...prev, tempMsg]);

    socket?.sendMessage({ conversationId: id, senderId: user?.id, message: msg });
  };

  const otherUser = conversation
    ? (conversation.buyer_id === user?.id
      ? { name: conversation.seller_name || 'Seller', avatar: conversation.seller_avatar }
      : { name: conversation.buyer_name || 'Buyer', avatar: conversation.buyer_avatar })
    : null;

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--outline-variant)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate('/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 4 }}>
          <FiChevronLeft size={22} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-container)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {otherUser?.avatar
            ? <img src={otherUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{otherUser?.name?.[0]}</span>
          }
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{otherUser?.name || 'Chat'}</div>
          {isTyping && <div style={{ fontSize: 12, color: 'var(--primary)', fontStyle: 'italic' }}>typing...</div>}
        </div>
        {conversation && (
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--outline)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📦 {conversation.product_title}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}><div className="sm-spinner" style={{ margin: '0 auto' }} /></div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--outline)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <div style={{ fontWeight: 700 }}>Start the conversation!</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ask about the product or make an offer</div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                <span style={{ fontSize: 11, color: 'var(--outline)', background: 'var(--surface-container)', padding: '4px 12px', borderRadius: 9999 }}>{date}</span>
              </div>
              {msgs.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>{msg.message}</div>
                      <div className="chat-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                        {formatTime(msg.created_at)}
                        {isMine && <span style={{ marginLeft: 4 }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="text" value={text} onChange={handleTyping}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px 16px', border: '1.5px solid var(--outline-variant)', borderRadius: 9999, fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--surface)' }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
        />
        <button type="submit" disabled={!text.trim()} style={{
          width: 44, height: 44, background: text.trim() ? 'var(--primary)' : 'var(--surface-container)',
          color: text.trim() ? '#fff' : 'var(--outline)', border: 'none', borderRadius: '50%',
          cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0,
        }}>
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
