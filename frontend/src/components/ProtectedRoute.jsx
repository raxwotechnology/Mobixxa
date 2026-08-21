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
      const isSuperAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin';
      if (!isSuperAdmin) {
        if (user.role === 'manager') {
          // Managers have access to management pages unless permission is explicitly disabled (false)
          if (user.permissions && user.permissions[permission] === false) {
            router.replace('/manager');
          }
        } else {
          // Cashiers & employees need explicit true permission or permission mapping
          const hasAccess = user.permissions && (
            user.permissions[permission] === true ||
            (permission === 'reloads' && user.permissions.sales !== false)
          );
          if (!hasAccess) {
            router.replace('/');
          }
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
    const isSuperAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin';
    if (!isSuperAdmin) {
      if (user.role === 'manager') {
        if (user.permissions && user.permissions[permission] === false) {
          return null;
        }
      } else {
        const hasAccess = user.permissions && (
          user.permissions[permission] === true ||
          (permission === 'reloads' && user.permissions.sales !== false)
        );
        if (!hasAccess) {
          return null;
        }
      }
    }
  }

  return children;
};

export default ProtectedRoute;
