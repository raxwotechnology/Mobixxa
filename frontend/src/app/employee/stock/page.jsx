'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import CashierStock from '../../../views/employee/CashierStock';

export default function EmployeeStockRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'stockEmployee']}>
      <CashierStock />
    </ProtectedRoute>
  );
}
