import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services';
import { useAuth } from '../context/AuthContext';
import { FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChatListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatService.getConversations()
      .then(({ data }) => setConversations(data.data.conversations))
      .catch(() => toast.error('Failed to load chats'))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="page-container" style={{ maxWidth: 680, padding: '20px 0 100px' }}>
      <div style={{ padding: '0 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Messages</h1>
        <p style={{ fontSize: 14, color: 'var(--outline)', marginBottom: 20 }}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
            </div>
          </div>
        ))
      ) : conversations.length === 0 ? (
        <div className="text-center py-5">
          <FiMessageCircle size={48} color="var(--outline-variant)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: 'var(--outline)', fontWeight: 700 }}>No messages yet</h3>
          <p style={{ color: 'var(--outline)', fontSize: 14 }}>Chat with sellers when you're interested in a product</p>
          <button className="btn-primary-sm mt-3" onClick={() => navigate('/home')}>Browse Listings</button>
        </div>
      ) : (
        conversations.map((conv) => {
          const isbuyer = conv.buyer_id === user?.id;
          const otherName = isbuyer ? conv.seller_name : conv.buyer_name;
          const otherAvatar = isbuyer ? conv.seller_avatar : conv.buyer_avatar;
          const unread = isbuyer ? conv.buyer_unread : conv.seller_unread;

          return (
            <div
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--outline-variant)',
                background: unread > 0 ? 'rgba(0,86,116,0.03)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
              onMouseLeave={e => e.currentTarget.style.background = unread > 0 ? 'rgba(0,86,116,0.03)' : 'transparent'}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-container)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {otherAvatar
                    ? <img src={otherAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>{otherName?.[0]}</span>
                  }
                </div>
                {unread > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    {unread > 9 ? '9+' : unread}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: unread > 0 ? 800 : 600, fontSize: 15, color: 'var(--on-surface)' }}>{otherName}</span>
                  <span style={{ fontSize: 11, color: 'var(--outline)' }}>{formatTime(conv.last_message_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📦 {conv.product_title}
                </div>
                <div style={{ fontSize: 13, color: unread > 0 ? 'var(--on-surface)' : 'var(--outline)', fontWeight: unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message || 'Start a conversation'}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatListPage;
