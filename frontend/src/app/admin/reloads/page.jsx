'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminReloads from '../../../views/admin/AdminReloads';

export default function AdminReloadsRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager', 'cashier']}>
      <AdminReloads />
    </ProtectedRoute>
  );
}
