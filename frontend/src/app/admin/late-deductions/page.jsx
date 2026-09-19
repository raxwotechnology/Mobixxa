'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLateDeductions from '../../../views/admin/AdminLateDeductions';

export default function AdminLateDeductionsRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="finance">
      <AdminLateDeductions />
    </ProtectedRoute>
  );
}
