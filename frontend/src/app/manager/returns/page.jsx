'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerReturns from '../../../views/storeOwner/ManagerReturns';

export default function ManagerReturnsRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <ManagerReturns />
    </ProtectedRoute>
  );
}
