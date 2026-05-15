import React from 'react';
import { useNavigate } from 'react-router-dom';

const SplashPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #003d55 0%, #005674 50%, #007095 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', color: '#fff', textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <img src="/logo.png" alt="StudentMart" style={{ height: 100, filter: 'brightness(0) invert(1)' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
        StudentMart
      </h1>
      <p style={{ fontSize: 16, opacity: 0.8, maxWidth: 320, lineHeight: 1.6, marginBottom: 48 }}>
        The campus marketplace for students. Buy & sell used items with ease.
      </p>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
        {['📚 Textbooks', '💻 Electronics', '🪑 Furniture', '🚲 Cycles', '🎸 Instruments'].map((f) => (
          <span key={f} style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            padding: '8px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.25)',
          }}>{f}</span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 12, flexDirection: 'column', width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => navigate('/signup')}
          style={{
            background: '#fff', color: 'var(--primary)', fontWeight: 700, fontSize: 16,
            border: 'none', borderRadius: 9999, padding: '16px 32px', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'all 0.2s',
          }}
        >
          Get Started — It's Free
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 15,
            border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 9999, padding: '15px 32px',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Sign In
        </button>
      </div>

      <p style={{ marginTop: 32, fontSize: 12, opacity: 0.5 }}>
        Trusted by 10,000+ students across campuses
      </p>
    </div>
  );
};

export default SplashPage;
