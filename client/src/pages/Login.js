import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const quickLogins = [
  { label: 'Admin', email: 'harsh@gmail.com' },
  { label: 'User', email: 'helly@gmail.com' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success(`💗 Welcome back, ${result.data.name}!`);
      navigate(result.data.role === 'admin' ? '/admin' : '/');
    } else {
      toast.error(result.message);
    }
  };

  const quickLogin = async (qEmail) => {
    const result = await login(qEmail, qEmail);
    if (result.success) { toast.success(`💗 Welcome, ${result.data.name}!`); navigate(result.data.role === 'admin' ? '/admin' : '/'); }
    else toast.error(result.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>💗</div>
          <h1 className="auth-title gradient-text">Welcome Back!</h1>
          <p className="auth-subtitle">Sign in to your Women HubClub account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="ben@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <div className="divider" />

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#636e72', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>QUICK LOGIN (email = password)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {quickLogins.map(q => (
              <button key={q.email} onClick={() => quickLogin(q.email)} className="btn btn-secondary btn-sm" style={{ borderRadius: 20 }}>
                {q.label === 'Admin' ? '⚙️' : '👤'} {q.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 14, color: '#636e72' }}>
          Don't have an account? <Link to="/register" style={{ color: '#6c63ff', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: '#f8f7ff', borderRadius: 12, fontSize: 12, color: '#636e72' }}>
          <strong>Demo Credentials:</strong><br />
          Admin: harsh@gmail.com / harsh@gmail.com<br />
          User: helly@gmail.com / helly@gmail.com<br />
          <em>(email and password are the same for all users)</em>
        </div>
      </div>
    </div>
  );
}
