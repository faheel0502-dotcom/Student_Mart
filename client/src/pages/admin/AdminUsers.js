import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { FiSearch, FiSlash, FiCheckCircle } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banTarget, setBanTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ search, page, limit: 20 });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBan = async () => {
    if (!banTarget || !banReason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading(banTarget);
    try {
      await adminService.banUser(banTarget, banReason);
      toast.success('User banned');
      setBanTarget(null); setBanReason('');
      fetchUsers();
    } catch { toast.error('Failed to ban user'); }
    finally { setActionLoading(null); }
  };

  const handleUnban = async (id) => {
    setActionLoading(id);
    try {
      await adminService.unbanUser(id);
      toast.success('User unbanned');
      fetchUsers();
    } catch { toast.error('Failed to unban user'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Users</h1>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
          <input
            className="sm-input" style={{ paddingLeft: 36, width: 280 }}
            placeholder="Search users..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Ban Modal */}
      {banTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 28, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 16, color: 'var(--error)' }}>Ban User</h3>
            <textarea className="sm-input" rows={3} placeholder="Reason for ban..." value={banReason} onChange={e => setBanReason(e.target.value)} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setBanTarget(null); setBanReason(''); }} className="btn-outline-sm" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleBan} style={{ flex: 1, background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>Confirm Ban</button>
            </div>
          </div>
        </div>
      )}

      <div className="sm-card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                {['ID', 'Name', 'Email', 'College', 'Role', 'Products', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--outline)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: 16 }}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
                ))
              ) : users.map((u, i) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--outline-variant)', background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--outline)' }}>#{u.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--outline)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.college_name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1d4ed8' : 'var(--outline)' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{u.products_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: u.is_banned ? '#fee2e2' : '#d1fae5', color: u.is_banned ? '#b91c1c' : '#065f46' }}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role !== 'admin' && (
                      u.is_banned
                        ? <button onClick={() => handleUnban(u.id)} disabled={actionLoading === u.id} style={{ background: 'none', border: '1px solid #10b981', color: '#10b981', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiCheckCircle size={12} /> Unban
                          </button>
                        : <button onClick={() => setBanTarget(u.id)} style={{ background: 'none', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiSlash size={12} /> Ban
                          </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !users.length && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--outline)' }}>No users found</td></tr>
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

export default AdminUsers;
