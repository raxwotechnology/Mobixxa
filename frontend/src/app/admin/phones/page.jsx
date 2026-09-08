'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminPhones from '../../../views/admin/AdminPhones';

export default function AdminPhonesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="products">
      <AdminPhones />
    </ProtectedRoute>
  );
}
