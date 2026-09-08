'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminCustomerHistory from '../../../views/admin/AdminCustomerHistory';

export default function AdminCustomerHistoryRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="reports">
      <AdminCustomerHistory />
    </ProtectedRoute>
  );
}
