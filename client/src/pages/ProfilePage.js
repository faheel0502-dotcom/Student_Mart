import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, productService } from '../services';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import { FiUser, FiEdit2, FiLogOut, FiPackage, FiShoppingBag, FiTag, FiCamera } from 'react-icons/fi';

const ProfilePage = () => {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    Promise.all([
      profileService.get(),
      productService.getMyListings(),
    ]).then(([profileRes, listingsRes]) => {
      setProfile(profileRes.data.data.user);
      setStats(profileRes.data.data.stats);
      setListings(listingsRes.data.data.products);
      setEditForm(profileRes.data.data.user);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      ['full_name', 'phone', 'college_name', 'department', 'year'].forEach(k => {
        if (editForm[k]) fd.append(k, editForm[k]);
      });
      if (avatarRef.current?.files[0]) fd.append('avatar', avatarRef.current.files[0]);
      const { data } = await profileService.update(fd);
      setProfile(data.data.user);
      updateUser(data.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="skeleton mb-4" style={{ height: 160, borderRadius: 'var(--radius-md)' }} />
      <div className="skeleton mb-3" style={{ height: 80, borderRadius: 'var(--radius)' }} />
      <div className="row g-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="col-6"><div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius)' }} /></div>)}
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      {/* Profile Header */}
      <div className="sm-card p-4 mb-4">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-container)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <FiUser size={32} color="var(--primary)" />
              }
            </div>
            {editing && (
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <FiCamera size={12} />
                <input type="file" accept="image/*" hidden ref={avatarRef} />
              </label>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input className="sm-input mb-2" value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" style={{ fontSize: 16, fontWeight: 700 }} />
            ) : (
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{profile?.full_name}</h2>
            )}
            <div style={{ fontSize: 13, color: 'var(--outline)' }}>{profile?.email}</div>
            {profile?.college_name && <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>🎓 {profile.college_name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-outline-sm" style={{ padding: '8px 14px', fontSize: 13 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary-sm" style={{ padding: '8px 14px', fontSize: 13 }}>
                  {saving ? '...' : 'Save'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-outline-sm" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiEdit2 size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {editing && (
          <div className="row g-2">
            <div className="col-md-6">
              <input className="sm-input" placeholder="College name" value={editForm.college_name || ''} onChange={e => setEditForm(f => ({ ...f, college_name: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <input className="sm-input" placeholder="Department" value={editForm.department || ''} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <input className="sm-input" placeholder="Phone" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <select className="sm-input" value={editForm.year || '1st'} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}>
                {['1st', '2nd', '3rd', '4th', 'PG', 'PhD', 'Other'].map(y => <option key={y} value={y}>{y} Year</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { label: 'Listings', value: stats.listings || 0, icon: <FiPackage /> },
            { label: 'Sold', value: stats.sold || 0, icon: <FiTag /> },
            { label: 'Purchased', value: stats.purchased || 0, icon: <FiShoppingBag /> },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'var(--surface-container)', borderRadius: 'var(--radius)', padding: '12px 8px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--outline)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', padding: 4 }}>
        {[{ id: 'listings', label: 'My Listings' }, { id: 'orders', label: 'Orders' }].map(t => (
          <button key={t.id} onClick={() => t.id === 'orders' ? navigate('/orders') : setTab(t.id)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-full)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--primary)' : 'var(--outline)',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-4">
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ color: 'var(--outline)', fontWeight: 600 }}>No listings yet</div>
          <button className="btn-primary-sm mt-3" onClick={() => navigate('/post')}>Post an Item</button>
        </div>
      ) : (
        <div className="row g-3">
          {listings.map(p => (
            <div key={p.id} className="col-6">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout} style={{
        width: '100%', marginTop: 32, background: 'rgba(186,26,26,0.08)', color: 'var(--error)',
        border: '1.5px solid rgba(186,26,26,0.2)', borderRadius: 'var(--radius-full)',
        padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <FiLogOut /> Log Out
      </button>
    </div>
  );
};

export default ProfilePage;
