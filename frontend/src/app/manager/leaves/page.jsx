'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLeaves from '../../../views/admin/AdminLeaves';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerLeavesRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminLeaves navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
