'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminExpenses from '../../../views/admin/AdminExpenses';

export default function AdminExpensesRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager', 'cashier']} permission="finance">
      <AdminExpenses />
    </ProtectedRoute>
  );
}
