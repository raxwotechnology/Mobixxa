'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerSupplierPayments from '../../../views/storeOwner/ManagerSupplierPayments';

export default function ManagerSupplierPaymentsRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <ManagerSupplierPayments />
    </ProtectedRoute>
  );
}
