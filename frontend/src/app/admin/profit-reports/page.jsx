'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminProfitReports from '../../../views/admin/AdminProfitReports';

export default function AdminProfitReportsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="finance">
      <AdminProfitReports />
    </ProtectedRoute>
  );
}
