'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminEmployees from '../../../views/admin/AdminEmployees';

export default function AdminEmployeesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminEmployees />
    </ProtectedRoute>
  );
}
