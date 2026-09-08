'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import CartPage from '../../views/CartPage';

export default function CartRoute() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  );
}
