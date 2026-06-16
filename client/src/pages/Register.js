import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Register.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const result = await register(form.name, form.email, form.password);
    if (result.success) { toast.success('🎉 Account created successfully!'); navigate('/'); }
    else toast.error(result.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="register-header">
          <div className="register-icon">💗</div>
          <h1 className="auth-title gradient-text">Create Account</h1>
          <p className="auth-subtitle">Join the Women HubClub sisterhood today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="register-pwd-wrap">
              <input className="form-input register-pwd-input" type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="register-pwd-toggle">
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-lg register-submit-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Creating...' : '🌸 Create Account'}
          </button>
        </form>

        <div className="register-footer-text">
          Already have an account? <Link to="/login" className="register-footer-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
