'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLeaves from '../../../views/admin/AdminLeaves';

export default function AdminLeavesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminLeaves />
    </ProtectedRoute>
  );
}
