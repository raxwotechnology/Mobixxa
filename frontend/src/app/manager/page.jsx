'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import StoreOverview from '../../views/storeOwner/StoreOverview';

export default function ManagerOverviewRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <StoreOverview />
    </ProtectedRoute>
  );
}
