import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

const AdminTransactions = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getTransactions({ page, limit: 20 });
      setPayments(data.data.payments);
      setPagination(data.data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const typeColor = {
    posting_fee: { bg: '#dbeafe', color: '#1d4ed8', label: 'Posting Fee' },
    purchase: { bg: '#d1fae5', color: '#065f46', label: 'Purchase' },
    platform_fee: { bg: '#fef3c7', color: '#92400e', label: 'Platform Fee' },
  };
  const statusColor = {
    paid: { bg: '#d1fae5', color: '#065f46' },
    created: { bg: '#fef3c7', color: '#92400e' },
    failed: { bg: '#fee2e2', color: '#b91c1c' },
    refunded: { bg: '#ede9fe', color: '#5b21b6' },
  };

  const total = payments.reduce((sum, p) => p.status === 'paid' ? sum + Number(p.amount) : sum, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Transactions</h1>
        <div className="stat-card" style={{ padding: '12px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--outline)', fontWeight: 600 }}>Page Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>₹{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="sm-card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                {['#ID', 'User', 'Type', 'Amount', 'Product', 'Razorpay ID', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--outline)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: 12 }}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
                ))
              ) : payments.map((p, i) => {
                const tc = typeColor[p.payment_type] || { bg: '#f3f4f6', color: '#6b7280', label: p.payment_type };
                const sc = statusColor[p.status] || { bg: '#f3f4f6', color: '#6b7280' };
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--outline-variant)', background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--outline)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{p.user_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--outline)' }}>{p.user_email}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color }}>{tc.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--outline)' }}>{p.product_title || '—'}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--outline)' }}>
                      {p.razorpay_payment_id ? p.razorpay_payment_id.substring(0, 18) + '...' : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, ...sc }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--outline)', whiteSpace: 'nowrap' }}>
                      {new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {!loading && !payments.length && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--outline)' }}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: page === p ? 'var(--primary)' : 'var(--surface-container)', color: page === p ? '#fff' : 'var(--on-surface)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
