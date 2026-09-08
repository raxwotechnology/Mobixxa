'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import Checkout from '../../views/Checkout';

export default function CheckoutRoute() {
  return (
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  );
}
