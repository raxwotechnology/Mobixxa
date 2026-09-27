"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSearch } from "@/context/SearchContext";

const STAFF_DASHBOARD_MAP = {
  admin: "/admin",
  manager: "/manager",
  cashier: "/employee",
  deliveryGuy: "/delivery",
  stockEmployee: "/employee",
};

export default function CustomerNavbar() {
  const pathname = usePathname() || "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { openCart, cartCount } = useCart();
  const { openSearch } = useSearch();

  useEffect(() => {
    const checkUser = () => {
      try {
        const stored = localStorage.getItem("mobixa_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("authChange", checkUser);
    window.addEventListener("storage", checkUser);
    return () => {
      window.removeEventListener("authChange", checkUser);
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("mobixa_user");
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  };

  const navLinks = [
    { label: "HOME", href: "/" },
    { label: "SHOP", href: "/shop" },
    { label: "DEALS", href: "/deals" },
    { label: "STORES", href: "/stores" },
  ];

  const isLinkActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
                Mobixa
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider mt-1">
                MOBILE SHOP ERP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 ml-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative text-xs font-bold tracking-wider transition-colors duration-200 py-2 ${
                    active
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search Input Trigger */}
          <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm mx-4">
            <div
              onClick={openSearch}
              className="relative w-full cursor-pointer group"
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                onClick={openSearch}
                onFocus={openSearch}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-slate-100/90 hover:bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200/60 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer transition-all duration-200 select-none"
              />
            </div>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors duration-200 cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth Buttons or User Badge */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={STAFF_DASHBOARD_MAP[user.role] || "/dashboard"}
                  title={
                    STAFF_DASHBOARD_MAP[user.role]
                      ? "Go to Dashboard"
                      : "View Customer Dashboard"
                  }
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Sign In */}
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-2 py-1.5 transition-colors duration-200"
                >
                  Sign in
                </Link>

                {/* Register Pill Button */}
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-blue-600 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search & Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-4">
            <div
              onClick={() => {
                setMobileMenuOpen(false);
                openSearch();
              }}
              className="relative w-full cursor-pointer"
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer select-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
