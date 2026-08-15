'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import OrdersPage from '../../views/OrdersPage';

export default function OrdersRoute() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
}
