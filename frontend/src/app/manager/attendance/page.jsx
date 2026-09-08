'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminAttendance from '../../../views/admin/AdminAttendance';
import { managerNavGroups } from '../../../views/storeOwner/managerNavItems';

export default function ManagerAttendanceRoute() {
  return (
    <ProtectedRoute roles={['manager']}>
      <AdminAttendance navItems={managerNavGroups} />
    </ProtectedRoute>
  );
}
