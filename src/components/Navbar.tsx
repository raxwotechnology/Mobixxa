'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import AuthModal from './AuthModal';

type AuthMode = 'signin' | 'register' | null;

const navLinks = [
  { label: 'HOME',   href: '/' },
  { label: 'SHOP',   href: '/shop' },
  { label: 'DEALS',  href: '/deals' },
  { label: 'STORES', href: '/stores' },
  { label: 'POS TERMINAL', href: '/pos' },
  { label: 'HP REGISTRY', href: '/admin/installments' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount] = useState(3);
  const [searchFocused, setSearchFocused] = useState(false);
  const [authModal, setAuthModal] = useState<AuthMode>(null);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="relative w-9 h-9 flex items-center justify-center bg-blue-600 rounded-xl shadow-md group-hover:shadow-blue-300 transition-shadow duration-300">
                <Zap size={20} className="text-white" fill="white" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0F172A] group-hover:text-blue-600 transition-colors duration-200">
                Mobixa
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-semibold tracking-widest transition-colors duration-200 rounded-lg
                      ${active
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right Action Controls ── */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search bar */}
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 bg-slate-50
                  ${searchFocused
                    ? 'border-blue-400 shadow-sm shadow-blue-100 bg-white w-52'
                    : 'border-slate-200 w-40 hover:border-blue-300'
                  }`}
              >
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
                />
              </div>

              {/* Cart */}
              <button
                id="cart-btn"
                aria-label="Shopping cart"
                className="relative p-2 rounded-full hover:bg-blue-50 transition-colors duration-200 group"
              >
                <ShoppingCart size={22} className="text-slate-700 group-hover:text-blue-600 transition-colors duration-200" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full shadow">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Sign In */}
              <button
                id="signin-link"
                onClick={() => setAuthModal('signin')}
                className="hidden sm:inline-block text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 px-1"
              >
                Sign In
              </button>

              {/* Register */}
              <button
                id="register-btn"
                onClick={() => setAuthModal('register')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] hover:bg-blue-600 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-200"
              >
                Register
              </button>

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-btn"
                aria-label="Toggle menu"
                onClick={() => setMobileOpen((o) => !o)}
                className="lg:hidden p-2 rounded-full hover:bg-slate-100 transition-colors duration-200"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 pb-5 pt-3 shadow-xl">
            <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-full border border-slate-200 bg-slate-50">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>

            <nav className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-semibold rounded-xl transition-colors duration-200
                      ${active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => { setMobileOpen(false); setAuthModal('signin'); }}
                className="flex-1 text-center py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 border border-slate-200 rounded-full transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileOpen(false); setAuthModal('register'); }}
                className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-blue-600 rounded-full transition-colors duration-200"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Auth Modal ── */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
}
