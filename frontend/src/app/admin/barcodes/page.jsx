'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminBarcodes from '../../../views/admin/AdminBarcodes';

export default function AdminBarcodesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="products">
      <AdminBarcodes />
    </ProtectedRoute>
  );
}
