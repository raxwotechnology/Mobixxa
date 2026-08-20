'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminCheques from '../../../views/admin/AdminCheques';

export default function AdminChequesRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="finance">
      <AdminCheques />
    </ProtectedRoute>
  );
}
