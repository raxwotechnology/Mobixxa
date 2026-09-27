'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';

const getFallbackHomeForUser = (user) => {
  if (!user) return '/login';
  if (user.role === 'admin' || user.isSuperAdmin) return '/admin';
  if (user.role === 'manager') return '/manager';
  if (['cashier', 'stockEmployee'].includes(user.role)) return '/employee';
  if (user.role === 'deliveryGuy') return '/delivery';
  return '/';
};

const ProtectedRoute = ({ children, roles, permission }) => {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, initAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isHydrated) {
      initAuth();
    }
  }, [isHydrated, initAuth]);

  useEffect(() => {
    if (!mounted || !isHydrated) return;

    let activeUser = user;
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('userInfo');
        if (raw) activeUser = JSON.parse(raw);
      } catch (e) {}
    }

    if (!activeUser) {
      router.replace('/login');
      return;
    }

    // Role authorization check
    if (roles && roles.length > 0) {
      const allowedRoles = [...roles];
      if (!allowedRoles.includes('admin')) allowedRoles.push('admin');

      const isRoleAllowed = allowedRoles.includes(activeUser.role) || activeUser.isSuperAdmin || activeUser.email === 'admin@mobilehub.com';
      if (!isRoleAllowed) {
        router.replace(getFallbackHomeForUser(activeUser));
        return;
      }
      return;
    }

    // Granular Permission check (only if roles wasn't specified)
    if (permission) {
      const isSuperAdminOrAdmin = activeUser.email === 'admin@mobilehub.com' || activeUser.isSuperAdmin || activeUser.role === 'admin' || activeUser.role === 'manager';

      if (!isSuperAdminOrAdmin) {
        const p = activeUser.permissions || {};

        const isCashierStandardTool = activeUser.role === 'cashier' && [
          'sales', 'pos', 'reloads', 'expenses', 'finance', 'hp', 'cheques', 'products', 'inventory', 'repairs', 'barcodes', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const isStockStandardTool = activeUser.role === 'stockEmployee' && [
          'inventory', 'products', 'barcodes', 'repairs', 'returns', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const isDeliveryStandardTool = activeUser.role === 'deliveryGuy' && [
          'deliveries', 'orders', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const hasGrantedPermission = p[permission] === true;

        const isAllowed = isCashierStandardTool || isStockStandardTool || isDeliveryStandardTool || hasGrantedPermission;

        if (!isAllowed) {
          router.replace(getFallbackHomeForUser(activeUser));
        }
      }
    }
  }, [mounted, isHydrated, isAuthenticated, user, roles, permission, router]);

  // Initial SSR and pre-hydration client render: output identical light spinner
  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  let activeUser = user;
  if (!activeUser && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('userInfo');
      if (raw) activeUser = JSON.parse(raw);
    } catch (e) {}
  }

  if (!activeUser) {
    return null;
  }

  if (roles && roles.length > 0) {
    const allowedRoles = [...roles];
    if (!allowedRoles.includes('admin')) allowedRoles.push('admin');
    const isRoleAllowed = allowedRoles.includes(activeUser.role) || activeUser.isSuperAdmin || activeUser.email === 'admin@mobilehub.com';
    if (!isRoleAllowed) return null;
    return children;
  }

  if (permission) {
    const isSuperAdminOrAdmin = activeUser.email === 'admin@mobilehub.com' || activeUser.isSuperAdmin || activeUser.role === 'admin' || activeUser.role === 'manager';
    if (!isSuperAdminOrAdmin) {
      const p = activeUser.permissions || {};

      const isCashierStandardTool = activeUser.role === 'cashier' && [
        'sales', 'pos', 'reloads', 'expenses', 'finance', 'hp', 'cheques', 'products', 'inventory', 'repairs', 'barcodes', 'attendance', 'leaves', 'overtime', 'salary'
      ].includes(permission);

      const isStockStandardTool = activeUser.role === 'stockEmployee' && [
        'inventory', 'products', 'barcodes', 'repairs', 'returns', 'attendance', 'leaves', 'overtime', 'salary'
      ].includes(permission);

      const isDeliveryStandardTool = activeUser.role === 'deliveryGuy' && [
        'deliveries', 'orders', 'attendance', 'leaves', 'overtime', 'salary'
      ].includes(permission);

      const hasGrantedPermission = p[permission] === true;

      const isAllowed = isCashierStandardTool || isStockStandardTool || isDeliveryStandardTool || hasGrantedPermission;
      if (!isAllowed) return null;
    }
  }

  return children;
};

export default ProtectedRoute;
