import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { FiUsers, FiPackage, FiDollarSign, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1></div>
      <div className="row g-3">
        {Array(8).fill(0).map((_, i) => <div key={i} className="col-6 col-md-3"><div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} /></div>)}
      </div>
    </div>
  );

  const { stats, recentOrders } = data || {};

  const statCards = [
    { label: 'Total Users', value: stats?.users?.toLocaleString() || 0, icon: <FiUsers size={20} />, color: '#005674' },
    { label: 'Active Listings', value: stats?.activeProducts?.toLocaleString() || 0, icon: <FiPackage size={20} />, color: '#10b981' },
    { label: 'Total Orders', value: stats?.totalOrders?.toLocaleString() || 0, icon: <FiShoppingBag size={20} />, color: '#8b5cf6' },
    { label: 'Items Sold', value: stats?.soldProducts?.toLocaleString() || 0, icon: <FiTrendingUp size={20} />, color: '#f59e0b' },
    { label: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toLocaleString()}`, icon: <FiDollarSign size={20} />, color: '#005674' },
    { label: 'Posting Fee Rev.', value: `₹${Number(stats?.postingFeeRevenue || 0).toLocaleString()}`, icon: <FiDollarSign size={20} />, color: '#10b981' },
    { label: 'Platform Fee Rev.', value: `₹${Number(stats?.platformFeeRevenue || 0).toLocaleString()}`, icon: <FiDollarSign size={20} />, color: '#f59e0b' },
    { label: 'Total Products', value: stats?.totalProducts?.toLocaleString() || 0, icon: <FiPackage size={20} />, color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: 'var(--on-surface)' }}>Dashboard</h1>

      <div className="row g-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="col-6 col-md-3">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="sm-card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                {['#ID', 'Product', 'Buyer', 'Seller', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--outline)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentOrders || []).map((o, i) => (
                <tr key={o.id} style={{ borderTop: '1px solid var(--outline-variant)', background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>#{o.id}</td>
                  <td style={{ padding: '12px 16px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_title}</td>
                  <td style={{ padding: '12px 16px' }}>{o.buyer_name}</td>
                  <td style={{ padding: '12px 16px' }}>{o.seller_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹{Number(o.total_amount).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: o.status === 'paid' ? '#d1fae5' : '#fef3c7', color: o.status === 'paid' ? '#065f46' : '#92400e' }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--outline)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!recentOrders?.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--outline)' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
