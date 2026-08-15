'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminGRN from '../../../views/admin/AdminGRN';

export default function AdminGRNRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="suppliers">
      <AdminGRN />
    </ProtectedRoute>
  );
}
