'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminEmployees from '../../../views/admin/AdminEmployees';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerEmployeesRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminEmployees navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
