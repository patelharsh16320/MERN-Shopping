import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

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
        <div className="login-header">
          <div className="login-icon">💗</div>
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
            <div className="login-pwd-wrap">
              <input className="form-input login-pwd-input" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="login-pwd-toggle">
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg login-submit-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <div className="divider" />

        <div className="login-quick-section">
          <div className="login-quick-label">QUICK LOGIN (email = password)</div>
          <div className="login-quick-row">
            {quickLogins.map(q => (
              <button key={q.email} onClick={() => quickLogin(q.email)} className="btn btn-secondary btn-sm login-quick-btn">
                {q.label === 'Admin' ? '⚙️' : '👤'} {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="login-footer-text">
          Don't have an account? <Link to="/register" className="login-footer-link">Register here</Link>
        </div>
      </div>
    </div>
  );
}
