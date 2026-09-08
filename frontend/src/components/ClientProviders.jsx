'use client';

import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useSettingsStore from '../store/settingsStore';

export default function ClientProviders({ children }) {
  const [mounted, setMounted] = useState(false);
  const initAuth = useAuthStore((s) => s.initAuth);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const { accent, customColor, fontFamily, mode, applyThemeToDocument } = useThemeStore();

  useEffect(() => {
    initAuth();
    fetchSettings();
    if (applyThemeToDocument) {
      applyThemeToDocument();
    }
    setMounted(true);

    // Global protection: Prevent mouse wheel scrolling from changing any numeric input value in any form across the system
    const handleGlobalWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  useEffect(() => {
    if (mounted && applyThemeToDocument) {
      applyThemeToDocument();
    }
  }, [mounted, accent, customColor, fontFamily, mode]);

  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
}
