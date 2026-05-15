import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiUsers, FiPackage, FiDollarSign,
  FiLogOut, FiMenu, FiX
} from 'react-icons/fi';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', icon: <FiGrid />, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: <FiUsers />, label: 'Users' },
    { to: '/admin/products', icon: <FiPackage />, label: 'Products' },
    { to: '/admin/transactions', icon: <FiDollarSign />, label: 'Transactions' },
  ];

  const SidebarContent = () => (
    <>
      <div style={{ padding: '0 20px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 4 }}>
          StudentMart
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Admin Panel</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navLinks.map(({ to, icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderRight: isActive ? '3px solid #c2e8ff' : '3px solid transparent',
              transition: 'all 0.2s',
            })}
            onClick={() => setSidebarOpen(false)}
          >
            <span style={{ fontSize: 18 }}>{icon}</span> {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 }}>
          {user?.full_name}
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(186,26,26,0.3)', color: '#fff',
            border: '1px solid rgba(186,26,26,0.5)', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
          }}
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0,
        background: 'var(--primary-dark)', padding: '12px 16px',
        zIndex: 300, alignItems: 'center', justifyContent: 'space-between',
      }}
        className="admin-mobile-bar"
      >
        <span style={{ color: '#fff', fontWeight: 800 }}>StudentMart Admin</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 250,
          background: 'rgba(0,0,0,0.5)',
        }} onClick={() => setSidebarOpen(false)} />
      )}
      {sidebarOpen && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
          background: 'var(--primary-dark)', zIndex: 260,
          display: 'flex', flexDirection: 'column', padding: '24px 0',
        }}>
          <SidebarContent />
        </aside>
      )}

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
