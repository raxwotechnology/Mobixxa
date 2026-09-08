'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminPredictions from '../../../views/admin/AdminPredictions';

export default function AdminPredictionsRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="reports">
      <AdminPredictions />
    </ProtectedRoute>
  );
}
