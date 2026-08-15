'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminSalaryAdvances from '../../../views/admin/AdminSalaryAdvances';

export default function AdminSalaryAdvancesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminSalaryAdvances />
    </ProtectedRoute>
  );
}
