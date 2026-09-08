'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import WishlistPage from '../../views/WishlistPage';

export default function WishlistRoute() {
  return (
    <ProtectedRoute>
      <WishlistPage />
    </ProtectedRoute>
  );
}
