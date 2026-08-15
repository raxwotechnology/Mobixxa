'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminOverview from '../../views/admin/AdminOverview';

export default function AdminOverviewRoute() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminOverview />
    </ProtectedRoute>
  );
}
