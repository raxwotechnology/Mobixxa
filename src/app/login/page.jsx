'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CustomerLayout from '@/components/layout/CustomerLayout';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Welcome back! Signed in with ${email}`);
    }, 1000);
  };

  return (
    <CustomerLayout>
      <div className='min-h-[75vh] flex items-center justify-center px-4 py-12'>
        {/* Center Glowing Card (Desktop - 5) */}
        <div className='w-full max-w-md p-8 sm:p-10 rounded-[36px] bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white shadow-2xl shadow-blue-500/30 border border-blue-400/30 relative overflow-hidden'>
          {/* Subtle Ambient Light Halo */}
          <div className='absolute -top-20 -right-20 w-60 h-60 bg-white/15 rounded-full blur-2xl pointer-events-none' />

          {/* Mobixa Logo Badge */}
          <div className='relative z-10 flex flex-col items-center text-center space-y-4 mb-8'>
            <div className='w-14 h-14 rounded-2xl bg-white text-blue-600 flex items-center justify-center font-black text-2xl shadow-lg'>
              M
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl font-black tracking-tight uppercase'>
                WELCOME BACK
              </h1>
              <p className='text-xs text-blue-100 mt-1 max-w-xs leading-relaxed'>
                Sign in to continue your tech and smart devices shopping
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className='relative z-10 space-y-5'>
            {/* Email Field */}
            <div className='space-y-1.5'>
              <label className='text-[11px] font-bold uppercase tracking-wider text-blue-100 block'>
                EMAIL ADDRESS
              </label>
              <div className='relative'>
                <input
                  type='email'
                  required
                  placeholder='customer@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full bg-white/10 text-white placeholder:text-blue-200/60 text-xs py-3.5 pl-10 pr-4 rounded-2xl border border-white/20 focus:outline-none focus:bg-white/20 focus:border-white transition-all'
                />
                <Mail className='w-4 h-4 text-blue-200 absolute left-3.5 top-1/2 -translate-y-1/2' />
              </div>
            </div>

            {/* Password Field */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-100'>
                <label>PASSWORD</label>
                <Link href='#forgot' className='text-blue-200 hover:text-white transition-colors normal-case font-medium'>
                  Forgot?
                </Link>
              </div>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder='••••••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full bg-white/10 text-white placeholder:text-blue-200/60 text-xs py-3.5 pl-10 pr-10 rounded-2xl border border-white/20 focus:outline-none focus:bg-white/20 focus:border-white transition-all'
                />
                <Lock className='w-4 h-4 text-blue-200 absolute left-3.5 top-1/2 -translate-y-1/2' />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='text-blue-200 hover:text-white p-2 absolute right-2 top-1/2 -translate-y-1/2'
                  aria-label='Toggle password visibility'
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4'
            >
              <span>{isLoading ? 'SIGNING IN...' : 'Sign In'}</span>
              <ArrowRight className='w-4 h-4' />
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className='relative z-10 pt-6 mt-6 border-t border-white/15 text-center text-xs text-blue-100'>
            <span>Don't have an account? </span>
            <Link
              href='/register'
              className='font-bold text-white underline hover:text-blue-200 transition-colors'
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
