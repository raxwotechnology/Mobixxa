'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminRepairs from '../../../views/admin/AdminRepairs';

export default function AdminRepairsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminRepairs />
    </ProtectedRoute>
  );
}
