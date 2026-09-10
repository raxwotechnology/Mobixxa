'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminCashierAccountability from '../../../views/admin/AdminCashierAccountability';

export default function AdminCashierAccountabilityRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="finance">
      <AdminCashierAccountability />
    </ProtectedRoute>
  );
}
