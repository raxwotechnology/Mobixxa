'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminInventory from '../../../views/admin/AdminInventory';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerInventoryRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminInventory navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
