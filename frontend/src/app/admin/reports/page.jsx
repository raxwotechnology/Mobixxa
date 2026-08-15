'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminReports from '../../../views/admin/AdminReports';

export default function AdminReportsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="reports">
      <AdminReports />
    </ProtectedRoute>
  );
}
