'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminStores from '../../../views/admin/AdminStores';

export default function AdminStoresRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="settings">
      <AdminStores />
    </ProtectedRoute>
  );
}
