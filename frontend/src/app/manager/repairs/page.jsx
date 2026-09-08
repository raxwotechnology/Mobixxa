'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagerRepairs from '../../../views/storeOwner/ManagerRepairs';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerRepairsRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <ManagerRepairs navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
