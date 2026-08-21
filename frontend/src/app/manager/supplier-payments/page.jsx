'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerSupplierPayments from '../../../views/storeOwner/ManagerSupplierPayments';

export default function ManagerSupplierPaymentsRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager', 'cashier']}>
      <ManagerSupplierPayments />
    </ProtectedRoute>
  );
}
