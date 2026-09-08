'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminHP from '../../../views/admin/AdminHP';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerHPRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminHP navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
