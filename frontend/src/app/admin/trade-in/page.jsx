'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminTradeIn from '../../../views/admin/AdminTradeIn';

export default function AdminTradeInRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']}>
      <AdminTradeIn />
    </ProtectedRoute>
  );
}
