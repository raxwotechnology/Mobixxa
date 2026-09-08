'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminSettings from '../../../views/admin/AdminSettings';

export default function AdminSettingsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="settings">
      <AdminSettings />
    </ProtectedRoute>
  );
}
