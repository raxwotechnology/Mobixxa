'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import OrderConfirmation from '../../../views/OrderConfirmation';

export default function OrderConfirmationRoute() {
  return (
    <ProtectedRoute>
      <OrderConfirmation />
    </ProtectedRoute>
  );
}
