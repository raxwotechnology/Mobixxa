'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Phone,
  Globe,
  Flame,
  Menu,
  X,
} from 'lucide-react';

export default function CustomerNavbar({
  cartCount = 2,
  onOpenCart,
  searchQuery = '',
  onSearchChange,
}) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'SHOP', href: '/shop' },
    { label: 'DEALS', href: '/deals' },
    { label: 'STORES', href: '/stores' },
  ];

  return (
    <header className='sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm' suppressHydrationWarning>
      {/* 1. Top Bar */}
      <div className='bg-[#0a0f1d] text-slate-300 text-xs py-2 px-4 md:px-8 border-b border-slate-800/80'>
        <div className='max-w-[1440px] w-full mx-auto flex items-center justify-between'>
          {/* Top Left Announcement */}
          <div className='flex items-center gap-2'>
            <Flame className='w-4 h-4 text-orange-500 fill-orange-500' />
            <span className='font-medium text-slate-200 tracking-wide'>
              Mobixa - Next-Gen Technology & Accessories Store
            </span>
          </div>

          {/* Top Right Contact & Currency */}
          <div className='hidden sm:flex items-center gap-5 text-slate-300 text-[11px] font-medium'>
            <a
              href='tel:+94112555000'
              className='flex items-center gap-1.5 hover:text-white transition-colors'
            >
              <Phone className='w-3.5 h-3.5 text-blue-400' />
              <span>+94 11 255 5000</span>
            </a>
            <span className='text-slate-600'>|</span>
            <div className='flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer'>
              <Globe className='w-3.5 h-3.5 text-slate-400' />
              <span>LKR LK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar */}
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-3.5'>
        <div className='flex items-center justify-between gap-4 md:gap-8'>
          {/* Brand Logo */}
          <Link href='/' className='flex items-center gap-3 flex-shrink-0 group'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform'>
              M
            </div>
            <div className='flex flex-col'>
              <span className='text-2xl font-black text-slate-900 tracking-tight leading-none'>
                Mobixa
              </span>
              <span className='text-[9px] tracking-widest uppercase font-bold text-slate-400 mt-1'>
                MOBILE SHOP ERP
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className='hidden lg:flex items-center gap-8'>
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-xs tracking-wider uppercase transition-colors relative py-1 ${
                    isActive
                      ? 'text-blue-600 font-bold after:content-[""] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600 after:rounded-full'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Section */}
          <div className='flex items-center gap-3 sm:gap-4'>
            {/* Pill Search Input */}
            <div className='relative hidden sm:flex items-center'>
              <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                suppressHydrationWarning
                className='w-36 md:w-52 lg:w-60 bg-slate-100/90 text-xs text-slate-900 placeholder:text-slate-400 py-2 pl-8 pr-3 rounded-full border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-all'
              />
              <Search className='w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none' />
            </div>

            {/* Cart Outline Icon with Badge */}
            <button
              type='button'
              onClick={onOpenCart}
              suppressHydrationWarning
              className='relative p-2 rounded-full text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors'
              aria-label='View Cart'
            >
              <ShoppingCart className='w-5 h-5' />
              {mounted && cartCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white'>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Sign In text button */}
            <Link
              href='/login'
              className='hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors px-2 py-1.5'
            >
              <User className='w-4 h-4 text-slate-500' />
              <span>Sign in</span>
            </Link>

            {/* Register solid blue pill button */}
            <Link
              href='/register'
              className='inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all'
            >
              Register
            </Link>

            {/* Mobile Hamburger Menu Button */}
            <button
              type='button'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              suppressHydrationWarning
              className='lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg'
              aria-label='Toggle menu'
            >
              {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className='mt-2.5 sm:hidden'>
          <div className='relative flex items-center w-full'>
            <input
              type='text'
              placeholder='Search phones, audio, accessories...'
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              suppressHydrationWarning
              className='w-full bg-slate-100 text-xs text-slate-900 placeholder:text-slate-400 py-2 pl-8 pr-3 rounded-full border border-slate-200 focus:outline-none focus:border-blue-500'
            />
            <Search className='w-3.5 h-3.5 text-slate-400 absolute left-3' />
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className='lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2'>
          <nav className='flex flex-col space-y-2'>
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className='pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600'>
            <Link
              href='/login'
              onClick={() => setMobileMenuOpen(false)}
              className='flex items-center gap-1.5 font-semibold text-slate-700'
            >
              <User className='w-4 h-4' />
              <span>Sign In</span>
            </Link>
            <Link
              href='/register'
              onClick={() => setMobileMenuOpen(false)}
              className='text-blue-600 font-bold'
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
