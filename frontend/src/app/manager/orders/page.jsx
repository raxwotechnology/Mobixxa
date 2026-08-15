'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminOrders from '../../../views/admin/AdminOrders';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerOrdersRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminOrders navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
