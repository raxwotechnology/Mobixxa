'use client';

import React, { useEffect } from 'react';
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
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Role authorization check
    if (roles && roles.length > 0) {
      const allowedRoles = [...roles];
      if (!allowedRoles.includes('admin')) allowedRoles.push('admin');

      const isRoleAllowed = allowedRoles.includes(user.role) || user.isSuperAdmin || user.email === 'admin@mobilehub.com';
      if (!isRoleAllowed) {
        router.replace(getFallbackHomeForUser(user));
        return;
      }
      // If role is authorized, grant access
      return;
    }

    // Granular Permission check (only if roles wasn't specified)
    if (permission) {
      const isSuperAdminOrAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin' || user.role === 'manager';

      if (!isSuperAdminOrAdmin) {
        const p = user.permissions || {};

        const isCashierStandardTool = user.role === 'cashier' && [
          'sales', 'pos', 'reloads', 'expenses', 'finance', 'hp', 'cheques', 'products', 'inventory', 'repairs', 'barcodes', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const isStockStandardTool = user.role === 'stockEmployee' && [
          'inventory', 'products', 'barcodes', 'repairs', 'returns', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const isDeliveryStandardTool = user.role === 'deliveryGuy' && [
          'deliveries', 'orders', 'attendance', 'leaves', 'overtime', 'salary'
        ].includes(permission);

        const hasGrantedPermission = p[permission] === true;

        const isAllowed = isCashierStandardTool || isStockStandardTool || isDeliveryStandardTool || hasGrantedPermission;

        if (!isAllowed) {
          router.replace(getFallbackHomeForUser(user));
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

  if (roles && roles.length > 0) {
    const allowedRoles = [...roles];
    if (!allowedRoles.includes('admin')) allowedRoles.push('admin');
    const isRoleAllowed = allowedRoles.includes(user.role) || user.isSuperAdmin || user.email === 'admin@mobilehub.com';
    if (!isRoleAllowed) return null;
    return children;
  }

  if (permission) {
    const isSuperAdminOrAdmin = user.email === 'admin@mobilehub.com' || user.isSuperAdmin || user.role === 'admin' || user.role === 'manager';
    if (!isSuperAdminOrAdmin) {
      const p = user.permissions || {};

      const isCashierStandardTool = user.role === 'cashier' && [
        'sales', 'pos', 'reloads', 'expenses', 'finance', 'hp', 'cheques', 'products', 'inventory', 'repairs', 'barcodes', 'attendance', 'leaves', 'overtime', 'salary'
      ].includes(permission);

      const isStockStandardTool = user.role === 'stockEmployee' && [
        'inventory', 'products', 'barcodes', 'repairs', 'returns', 'attendance', 'leaves', 'overtime', 'salary'
      ].includes(permission);

      const isDeliveryStandardTool = user.role === 'deliveryGuy' && [
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
