'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminWarranty from '../../../views/admin/AdminWarranty';

export default function AdminWarrantyRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminWarranty />
    </ProtectedRoute>
  );
}
