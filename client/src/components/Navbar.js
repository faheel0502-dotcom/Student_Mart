import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiSearch, FiMessageCircle, FiUser,
  FiLogOut, FiShoppingBag, FiShield
} from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/home?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sm-navbar">
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center gap-3">
          {/* Logo */}
          <Link to="/home" className="sm-navbar-brand">
            <img src="/logo.png" alt="StudentMart" onError={(e) => { e.target.style.display = 'none'; }} />
            <span>StudentMart</span>
          </Link>

          {/* Search - visible on desktop */}
          <form onSubmit={handleSearch} className="sm-search-bar d-none d-md-block" style={{ flex: 1 }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search books, electronics, furniture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Desktop Nav Items */}
          <div className="d-none d-md-flex align-items-center gap-2 ms-auto">
            <Link to="/chat" className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1">
              <FiMessageCircle /> Chats
            </Link>

            {/* User Dropdown */}
            <div className="position-relative">
              <button
                className="btn btn-sm rounded-pill d-flex align-items-center gap-2"
                style={{ background: 'var(--primary-container)', color: 'var(--primary)', fontWeight: 600 }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                  : <FiUser />
                }
                {user?.full_name?.split(' ')[0]}
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, minWidth: 180,
                  background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--outline-variant)', padding: '8px 0',
                  zIndex: 200,
                }}>
                  <Link to="/profile" className="dropdown-link" onClick={() => setShowDropdown(false)}>
                    <FiUser /> Profile
                  </Link>
                  <Link to="/orders" className="dropdown-link" onClick={() => setShowDropdown(false)}>
                    <FiShoppingBag /> Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-link" onClick={() => setShowDropdown(false)}>
                      <FiShield /> Admin Panel
                    </Link>
                  )}
                  <hr style={{ margin: '6px 0', borderColor: 'var(--outline-variant)' }} />
                  <button className="dropdown-link w-100 text-start" style={{ color: 'var(--error)' }} onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-primary-sm"
              onClick={() => navigate('/post')}
            >
              + Sell
            </button>
          </div>

          {/* Mobile search icon */}
          <button className="d-md-none btn btn-light btn-sm rounded-circle ms-auto" onClick={() => navigate('/home?focus=search')}>
            <FiSearch />
          </button>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="sm-search-bar d-md-none mt-2">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <style>{`
        .dropdown-link {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; color: var(--on-surface);
          text-decoration: none; font-size: 14px; font-weight: 500;
          transition: background 0.15s; cursor: pointer;
          background: none; border: none; width: 100%;
        }
        .dropdown-link:hover { background: var(--surface-container); color: var(--primary); }
      `}</style>
    </nav>
  );
};

export default Navbar;
