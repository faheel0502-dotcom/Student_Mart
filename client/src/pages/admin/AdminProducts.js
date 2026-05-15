import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [removing, setRemoving] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getProducts({ status, page, limit: 20 });
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this product listing?')) return;
    setRemoving(id);
    try {
      await adminService.removeProduct(id);
      toast.success('Product removed');
      fetchProducts();
    } catch { toast.error('Failed to remove product'); }
    finally { setRemoving(null); }
  };

  const statusColors = {
    active: { bg: '#d1fae5', color: '#065f46' },
    sold: { bg: '#dbeafe', color: '#1d4ed8' },
    pending: { bg: '#fef3c7', color: '#92400e' },
    rejected: { bg: '#fee2e2', color: '#b91c1c' },
    inactive: { bg: '#f3f4f6', color: '#6b7280' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Products</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="sm-input" style={{ padding: '8px 12px', width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['active', 'sold', 'pending', 'rejected', 'inactive'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="sm-card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                {['', 'Title', 'Seller', 'Category', 'Price', 'Status', 'Views', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--outline)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={9} style={{ padding: 12 }}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
                ))
              ) : products.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--outline-variant)', background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <img src={p.primary_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.title)}&background=c2e8ff&color=005674&size=50`}
                      alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600 }}>{p.seller_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--outline)' }}>{p.seller_email}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{p.category_name}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(p.price).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, ...statusColors[p.status] }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--outline)' }}>{p.views}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--outline)', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {p.status !== 'rejected' && (
                      <button onClick={() => handleRemove(p.id)} disabled={removing === p.id}
                        style={{ background: 'none', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: removing === p.id ? 0.5 : 1 }}>
                        <FiTrash2 size={12} /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !products.length && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--outline)' }}>No products found</td></tr>
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

export default AdminProducts;
