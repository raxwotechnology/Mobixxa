'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, roles, permission }) => {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (roles && !roles.includes(user.role)) {
      router.replace('/');
      return;
    }

    if (permission) {
      const isAuthorizedManagerOrAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin' || user.role === 'manager';
      if (!isAuthorizedManagerOrAdmin) {
        // Cashiers & staff employees need explicit true permission
        const hasAccess = user.permissions && (
          user.permissions[permission] === true ||
          (permission === 'reloads' && user.permissions.sales !== false)
        );
        if (!hasAccess) {
          router.replace('/');
        }
      }
    }
  }, [isHydrated, isAuthenticated, user, roles, permission, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    return null;
  }

  if (permission) {
    const isAuthorizedManagerOrAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin' || user.role === 'manager';
    if (!isAuthorizedManagerOrAdmin) {
      const hasAccess = user.permissions && (
        user.permissions[permission] === true ||
        (permission === 'reloads' && user.permissions.sales !== false)
      );
      if (!hasAccess) {
        return null;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
