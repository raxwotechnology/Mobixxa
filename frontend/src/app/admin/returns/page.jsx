'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminReturns from '../../../views/admin/AdminReturns';

export default function AdminReturnsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminReturns />
    </ProtectedRoute>
  );
}
