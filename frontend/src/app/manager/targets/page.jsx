'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerTargets from '../../../views/storeOwner/ManagerTargets';

export default function ManagerTargetsRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <ManagerTargets />
    </ProtectedRoute>
  );
}
