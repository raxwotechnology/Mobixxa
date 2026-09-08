'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminProducts from '../../../views/admin/AdminProducts';

export default function AdminProductsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="products">
      <AdminProducts />
    </ProtectedRoute>
  );
}
