'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminCategories from '../../../views/admin/AdminCategories';

export default function AdminCategoriesRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="products">
      <AdminCategories />
    </ProtectedRoute>
  );
}
