'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminSalesTracking from '../../../views/admin/AdminSalesTracking';

export default function AdminSalesTrackingRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="sales">
      <AdminSalesTracking />
    </ProtectedRoute>
  );
}
