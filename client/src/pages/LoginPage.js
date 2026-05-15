import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="StudentMart" onError={(e) => { e.target.style.display = 'none'; }} />
          <h2 className="auth-title mt-2">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your StudentMart account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="sm-label"><FiMail size={13} style={{ marginRight: 4 }} />Email</label>
            <input
              type="email" className={`sm-input${errors.email ? ' error' : ''}`}
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div className="mb-4">
            <label className="sm-label"><FiLock size={13} style={{ marginRight: 4 }} />Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className={`sm-input${errors.password ? ' error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--outline)', cursor: 'pointer',
              }}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 9999, padding: '15px',
              fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1, fontFamily: 'var(--font)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--outline)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
