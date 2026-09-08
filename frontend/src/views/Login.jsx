'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from '../utils/navigation';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
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
      toast.success(`Welcome back, ${data.name}!`);
      const redirectMap = { admin: '/admin', manager: '/manager', cashier: '/employee', deliveryGuy: '/employee', stockEmployee: '/employee' };
      navigate(redirectMap[data.role] || '/');
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



  // If already logged in, show continue/switch options
  if (isAuthenticated && user) {
    const redirectMap = { admin: '/admin', manager: '/manager', cashier: '/employee', deliveryGuy: '/employee', stockEmployee: '/employee' };
    const dashPath = redirectMap[user.role] || '/';

    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/50 py-16 px-4">
        <motion.div
          className="glass-card p-8 md:p-10 rounded-[2rem] w-full max-w-md"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <Link to="/" className="text-3xl font-extrabold inline-flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
                <img
                  src={brandLogoUrl}
                  alt={brandName}
                  className="w-full h-full rounded-[10px] object-cover bg-white"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
              </div>
              <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-black">{brandName}</span>
            </Link>
            <h1 className="text-2xl font-black text-slate-800 mt-0 mb-2">Already Signed In</h1>
          </div>

          <div className="bg-brand-indigo/5 border border-brand-indigo/10 rounded-2xl p-5 mb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-indigo to-brand-violet rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md mx-auto mb-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-bold text-slate-800 m-0">{user.name}</p>
            <p className="text-xs text-slate-400 m-0 mt-0.5">{user.email}</p>
            <span className="inline-block mt-3.5 text-[10px] font-bold uppercase bg-brand-indigo/10 text-brand-indigo px-3 py-1 rounded-full">{user.role}</span>
          </div>

          <button
            onClick={() => navigate(dashPath)}
            className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] mb-3 cursor-pointer"
          >
            Continue as {user.name.split(' ')[0]}
          </button>

          <button
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-sm"
          >
            <LogOut size={15} />
            Switch Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/50 py-16 px-4">
      <motion.div
        className="glass-card p-8 md:p-10 rounded-[2rem] w-full max-w-md"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="w-full h-full rounded-[10px] object-cover bg-white"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            </div>
            <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-black">{brandName}</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-800 mt-0 mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm m-0 font-medium">Sign in to continue your tech and smart devices shopping</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="login-email">
              Email Address
            </label>
            <input
              type="email"
              id="login-email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none transition-all text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-brand-indigo font-semibold hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none transition-all text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-indigo font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
