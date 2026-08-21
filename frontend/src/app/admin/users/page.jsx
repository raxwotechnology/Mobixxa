'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminUsers from '../../../views/admin/AdminUsers';

export default function AdminUsersRoute() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminUsers />
    </ProtectedRoute>
  );
}
