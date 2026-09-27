'use client';

import { useState } from 'react';
import { Link, useNavigate } from '../utils/navigation';
import { Eye, EyeOff, LogOut, Mail, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { loginUser } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated, logout } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandLogoUrl = getImageUrl(settings?.logoUrl || settings?.logo || '') || '/logo.png';
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data);
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      toast.success(`Welcome back, ${data.name}!`);
      const redirectMap = { admin: '/admin', manager: '/manager', cashier: '/employee', deliveryGuy: '/employee', stockEmployee: '/employee' };
      const dest = redirectMap[data.role] || '/';
      setTimeout(() => { window.location.href = dest; }, 300);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    logout();
    toast.info('Logged out. You can now sign in with a different account.');
  };

  /* ── Already logged in ── */
  if (isAuthenticated && user) {
    const redirectMap = { admin: '/admin', manager: '/manager', cashier: '/employee', deliveryGuy: '/employee', stockEmployee: '/employee' };
    const dashPath = redirectMap[user.role] || '/';
    return (
      <div className="ds-auth-page">
        <div className="ds-auth-card" style={{ maxWidth: 420 }}>
          <div className="ds-auth-card-header">
            <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
                <img src={brandLogoUrl} alt={brandName} className="w-full h-full rounded-[10px] object-cover bg-white"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }} />
              </div>
              <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-bold text-lg tracking-tight">{brandName}</span>
            </Link>
            <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: '0.25rem 0 0.25rem' }}>Already Signed In</h1>
            <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', margin: 0 }}>Continue with your current session or switch account</p>
          </div>

          <div className="ds-auth-card-body">
            <div style={{ background: 'var(--ds-primary-10)', border: '1px solid var(--ds-primary-30)', borderRadius: 'var(--ds-r-lg)', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--ds-primary) 0%, #7c3aed 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.5rem', margin: '0 auto 0.75rem', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: 'var(--ds-text-md)', fontWeight: 700, color: 'var(--ds-text-head)', margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', margin: '0.25rem 0 0.75rem' }}>{user.email}</p>
              <span className="ds-badge ds-badge-primary">{user.role}</span>
            </div>

            <button onClick={() => navigate(dashPath)} className="ds-btn ds-btn-primary w-full" style={{ justifyContent: 'center', padding: '0.7rem 1rem' }}>
              <ArrowRight size={16} /> Continue as {user.name.split(' ')[0]}
            </button>
            <button onClick={handleSwitchAccount} className="ds-btn ds-btn-secondary w-full" style={{ justifyContent: 'center', padding: '0.7rem 1rem' }}>
              <LogOut size={15} /> Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Login ── */
  return (
    <div className="ds-auth-page">
      <div className="ds-auth-card">
        {/* Header */}
        <div className="ds-auth-card-header">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={brandLogoUrl} alt={brandName} className="w-full h-full rounded-[10px] object-cover bg-white"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }} />
            </div>
            <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-bold text-lg tracking-tight">{brandName}</span>
          </Link>
          <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: '0 0 0.375rem' }}>Welcome Back</h1>
          <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', margin: 0, fontWeight: 400 }}>Sign in to continue your tech &amp; smart devices shopping</p>
        </div>

        {/* Form */}
        <div className="ds-auth-card-body">
          <form onSubmit={submitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            <div className="ds-form-group">
              <label className="ds-label" htmlFor="login-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email" id="login-email" className="ds-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>
            </div>

            <div className="ds-form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="ds-label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-primary)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'} id="login-password" className="ds-input"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-muted)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="ds-btn ds-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem 1rem', marginTop: '0.5rem', fontSize: 'var(--ds-text-sm)', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <><div className="ds-spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Signing In...</>
              ) : (
                <><ArrowRight size={16} /> Sign In</>
              )}
            </button>
          </form>
        </div>

        <div className="ds-auth-card-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
