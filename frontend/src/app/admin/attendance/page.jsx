'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminAttendance from '../../../views/admin/AdminAttendance';

export default function AdminAttendanceRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminAttendance />
    </ProtectedRoute>
  );
}
