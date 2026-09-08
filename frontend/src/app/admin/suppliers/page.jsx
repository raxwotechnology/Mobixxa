'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminSuppliers from '../../../views/admin/AdminSuppliers';

export default function AdminSuppliersRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="suppliers">
      <AdminSuppliers />
    </ProtectedRoute>
  );
}
