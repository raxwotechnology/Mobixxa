'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerPerformance from '../../../views/storeOwner/ManagerPerformance';

export default function ManagerPerformanceRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <ManagerPerformance />
    </ProtectedRoute>
  );
}
