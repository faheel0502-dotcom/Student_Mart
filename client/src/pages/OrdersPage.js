import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiTag } from 'react-icons/fi';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('purchased');

  useEffect(() => {
    setLoading(true);
    orderService.getAll({ type: tab })
      .then(({ data }) => setOrders(data.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [tab]);

  const statusColor = { pending: '#f59e0b', paid: '#10b981', completed: '#3b82f6', cancelled: '#ef4444', refunded: '#8b5cf6' };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>My Orders</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', padding: 4 }}>
        {[{ id: 'purchased', label: '🛒 Purchased', icon: <FiShoppingBag /> }, { id: 'sold', label: '🏷️ Sold', icon: <FiTag /> }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 14,
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--primary)' : 'var(--outline)',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        Array(3).fill(0).map((_, i) => (
          <div key={i} className="skeleton mb-3" style={{ height: 100, borderRadius: 'var(--radius)' }} />
        ))
      ) : orders.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <h3 style={{ color: 'var(--outline)', fontWeight: 700 }}>No orders yet</h3>
          <p style={{ color: 'var(--outline)', fontSize: 14 }}>
            {tab === 'purchased' ? 'Browse listings and make your first purchase!' : 'Post an item to start selling!'}
          </p>
          <button className="btn-primary-sm mt-3" onClick={() => navigate(tab === 'purchased' ? '/home' : '/post')}>
            {tab === 'purchased' ? 'Browse Listings' : 'Post an Item'}
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="sm-card p-3 mb-3" style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${order.product_id}`)}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={order.product_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.product_title)}&background=c2e8ff&color=005674&size=80`}
                alt={order.product_title}
                style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.product_title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 6 }}>
                  {tab === 'purchased' ? `Seller: ${order.seller_name}` : `Buyer: ${order.buyer_name}`}
                  {' · '}{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
                    ₹{Number(order.total_amount).toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
                    background: `${statusColor[order.status]}20`, color: statusColor[order.status],
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{order.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersPage;
