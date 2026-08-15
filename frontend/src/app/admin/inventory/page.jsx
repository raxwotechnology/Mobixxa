'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminInventory from '../../../views/admin/AdminInventory';

export default function AdminInventoryRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="products">
      <AdminInventory />
    </ProtectedRoute>
  );
}
