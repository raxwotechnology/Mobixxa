'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminWarranty from '../../../views/admin/AdminWarranty';

export default function ManagerWarrantyRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminWarranty />
    </ProtectedRoute>
  );
}
