'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminPromotions from '../../../views/admin/AdminPromotions';

export default function AdminPromotionsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminPromotions />
    </ProtectedRoute>
  );
}
