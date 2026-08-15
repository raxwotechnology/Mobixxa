'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminOrders from '../../../views/admin/AdminOrders';

export default function AdminOrdersRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminOrders />
    </ProtectedRoute>
  );
}
