'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminTargets from '../../../views/admin/AdminTargets';

export default function AdminTargetsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminTargets />
    </ProtectedRoute>
  );
}
