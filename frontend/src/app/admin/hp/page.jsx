'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminHP from '../../../views/admin/AdminHP';

export default function AdminHPRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="finance">
      <AdminHP />
    </ProtectedRoute>
  );
}
