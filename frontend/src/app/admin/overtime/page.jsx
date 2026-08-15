'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminOvertime from '../../../views/admin/AdminOvertime';

export default function AdminOvertimeRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="finance">
      <AdminOvertime />
    </ProtectedRoute>
  );
}
