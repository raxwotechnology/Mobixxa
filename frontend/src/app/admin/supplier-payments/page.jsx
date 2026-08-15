'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminSupplierPayments from '../../../views/admin/AdminSupplierPayments';

export default function AdminSupplierPaymentsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="suppliers">
      <AdminSupplierPayments />
    </ProtectedRoute>
  );
}
