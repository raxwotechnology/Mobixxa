'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminVouchers from '../../../views/admin/AdminVouchers';

export default function AdminVouchersRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminVouchers />
    </ProtectedRoute>
  );
}
