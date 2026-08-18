'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Zap, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';

type ModalMode = 'signin' | 'register';

interface AuthModalProps {
  initialMode: ModalMode;
  onClose: () => void;
}

export default function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Reset when mode changes
  useEffect(() => {
    setSubmitted(false);
    setShowPassword(false);
    setShowConfirm(false);
  }, [mode]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 1800);
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-[#0F172A]/70 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label={mode === 'signin' ? 'Sign In' : 'Create Account'}
    >
      <div className="relative w-full max-w-md animate-[modalIn_0.25s_ease-out]">
        {/* Glow ring */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/40 to-indigo-600/30 rounded-3xl blur-xl" />

        {/* Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Blue header band */}
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-8 pt-8 pb-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-xl">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">Mobixa</span>
            </div>

            {/* Title */}
            <h2 className="text-white text-2xl font-extrabold mb-1">
              {mode === 'signin' ? 'Welcome back 👋' : 'Create account ✨'}
            </h2>
            <p className="text-blue-200 text-sm">
              {mode === 'signin'
                ? 'Sign in to continue to your account.'
                : 'Join Mobixa — it only takes a minute.'}
            </p>

            {/* Close btn */}
            <button
              id="auth-modal-close"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors duration-200"
            >
              <X size={16} />
            </button>

            {/* Wave cutout */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-white rounded-t-3xl" />
          </div>

          {/* Form area */}
          <div className="px-8 pb-8 -mt-1">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 mb-6 bg-slate-100 rounded-2xl">
              {(['signin', 'register'] as const).map((m) => (
                <button
                  key={m}
                  id={`auth-tab-${m}`}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200
                    ${mode === m
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  {mode === 'signin' ? 'Signed in!' : 'Account created!'}
                </p>
                <p className="text-slate-500 text-sm text-center">Redirecting you to Mobixa…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Full name – register only */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                      Full Name
                    </label>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm focus-within:shadow-blue-100 transition-all duration-200">
                      <User size={16} className="text-slate-400 shrink-0" />
                      <input
                        id="register-name"
                        type="text"
                        required
                        placeholder="John Perera"
                        autoComplete="name"
                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm focus-within:shadow-blue-100 transition-all duration-200">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <input
                      id={`${mode}-email`}
                      type="email"
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm focus-within:shadow-blue-100 transition-all duration-200">
                    <Lock size={16} className="text-slate-400 shrink-0" />
                    <input
                      id={`${mode}-password`}
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition-colors duration-150 shrink-0"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password – register only */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                      Confirm Password
                    </label>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm focus-within:shadow-blue-100 transition-all duration-200">
                      <Lock size={16} className="text-slate-400 shrink-0" />
                      <input
                        id="register-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="text-slate-400 hover:text-slate-600 transition-colors duration-150 shrink-0"
                        aria-label="Toggle confirm visibility"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot password – signin only */}
                {mode === 'signin' && (
                  <div className="text-right -mt-1">
                    <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                      Forgot password?
                    </a>
                  </div>
                )}

                {/* Terms – register only */}
                {mode === 'register' && (
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      id="register-terms"
                      className="mt-0.5 w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:underline font-semibold">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a>.
                    </span>
                  </label>
                )}

                {/* Submit */}
                <button
                  id={`${mode}-submit`}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-blue-300 hover:shadow-lg active:scale-[0.98] mt-1"
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Toggle link */}
                <p className="text-center text-sm text-slate-500">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
                    className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    {mode === 'signin' ? 'Register' : 'Sign In'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
