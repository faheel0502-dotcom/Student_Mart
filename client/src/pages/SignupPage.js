import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiBook } from 'react-icons/fi';

const YEARS = ['1st', '2nd', '3rd', '4th', 'PG', 'PhD', 'Other'];

// ⚠️ MUST be defined OUTSIDE SignupPage to prevent remount on every keystroke
const Field = ({ label, icon, error, children }) => (
  <div className="mb-3">
    <label className="sm-label">
      {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
      {label}
    </label>
    {children}
    {error && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{error}</div>}
  </div>
);

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    college_name: '', department: '', year: '1st',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
    if (!form.college_name.trim()) e.college_name = 'College name required';
    if (!form.department.trim()) e.department = 'Department required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirm_password, ...userData } = form;
      const user = await register(userData);
      toast.success(`Welcome to StudentMart, ${user.full_name.split(' ')[0]}! 🎉`);
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '32px 16px' }}>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <img src="/logo.png" alt="StudentMart" onError={(e) => { e.target.style.display = 'none'; }} />
          <h2 className="auth-title mt-2">Create Account</h2>
          <p className="auth-subtitle">Join thousands of students on StudentMart</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <Field label="Full Name" icon={<FiUser size={13} />} error={errors.full_name}>
                <input
                  className={`sm-input${errors.full_name ? ' error' : ''}`}
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Email" icon={<FiMail size={13} />} error={errors.email}>
                <input
                  type="email"
                  className={`sm-input${errors.email ? ' error' : ''}`}
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Phone" icon={<FiPhone size={13} />} error={errors.phone}>
                <input
                  type="tel"
                  className={`sm-input${errors.phone ? ' error' : ''}`}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-12">
              <Field label="College Name" icon={<FiBook size={13} />} error={errors.college_name}>
                <input
                  className={`sm-input${errors.college_name ? ' error' : ''}`}
                  placeholder="ABC Engineering College"
                  value={form.college_name}
                  onChange={(e) => set('college_name', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-md-8">
              <Field label="Department" error={errors.department}>
                <input
                  className={`sm-input${errors.department ? ' error' : ''}`}
                  placeholder="Computer Science"
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="Year">
                <select
                  className="sm-input"
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                >
                  {YEARS.map((y) => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Password" icon={<FiLock size={13} />} error={errors.password}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`sm-input${errors.password ? ' error' : ''}`}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--outline)', cursor: 'pointer',
                    }}
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Confirm Password" error={errors.confirm_password}>
                <input
                  type="password"
                  className={`sm-input${errors.confirm_password ? ' error' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={(e) => set('confirm_password', e.target.value)}
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 9999, padding: '15px', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
              fontFamily: 'var(--font)', marginTop: 8, transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--outline)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
