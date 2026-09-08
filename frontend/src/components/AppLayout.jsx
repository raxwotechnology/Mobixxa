'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import useSettingsStore from '../store/settingsStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function AppLayout({ children }) {
  const pathname = usePathname() || '';
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const settings = useSettingsStore((s) => s.settings);
  const { user } = useAuthStore();
  const { accent, customColor, fontFamily, mode, applyThemeToDocument } = useThemeStore();

  useEffect(() => {
    fetchSettings();
    if (applyThemeToDocument) applyThemeToDocument();
  }, [fetchSettings, accent, customColor, fontFamily, mode]);

  useEffect(() => {
    const titleName = settings?.shopName || 'Mobixa';
    if (typeof document !== 'undefined') {
      document.title = `${titleName} - Premium Mobile Devices & Accessories`;
    }
  }, [settings?.shopName]);

  const isStaff = user && ['admin', 'manager', 'cashier', 'deliveryGuy', 'stockEmployee'].includes(user.role);

  // Pages that should have NO shared Navbar/Footer
  const isNoLayout =
    pathname === '/pos' ||
    pathname === '/cashier-login' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/manager') ||
    pathname.startsWith('/employee') ||
    pathname.startsWith('/delivery') ||
    pathname.startsWith('/barcode') ||
    (isStaff && (pathname === '/settings' || pathname === '/profile'));

  if (isNoLayout) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
