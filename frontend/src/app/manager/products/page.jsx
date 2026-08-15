'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import StoreProducts from '../../../views/storeOwner/StoreProducts';

export default function ManagerProductsRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <StoreProducts />
    </ProtectedRoute>
  );
}
