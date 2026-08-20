'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminPayroll from '../../../views/admin/AdminPayroll';

export default function AdminPayrollRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="employees">
      <AdminPayroll />
    </ProtectedRoute>
  );
}
