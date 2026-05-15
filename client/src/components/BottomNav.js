import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiHeart, FiPlusCircle, FiMessageCircle, FiUser } from 'react-icons/fi';

const BottomNav = () => {


  const items = [
    { to: '/home', icon: <FiHome />, label: 'Home' },
    { to: '/orders', icon: <FiHeart />, label: 'Orders' },
    { to: '/post', icon: <FiPlusCircle size={30} />, label: 'Sell', isAction: true },
    { to: '/chat', icon: <FiMessageCircle />, label: 'Chat' },
    { to: '/profile', icon: <FiUser />, label: 'Profile' },
  ];

  return (
    <nav className="sm-bottom-nav d-md-none">
      {items.map(({ to, icon, label, isAction }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `sm-nav-item${isActive ? ' active' : ''}`}
          style={isAction ? {
            background: 'var(--primary)', color: '#fff',
            borderRadius: '50%', width: 52, height: 52,
            marginTop: -20, boxShadow: '0 4px 16px rgba(0,86,116,0.35)',
            padding: 0, justifyContent: 'center',
          } : {}}
        >
          {icon}
          {!isAction && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
