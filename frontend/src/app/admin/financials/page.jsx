'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminFinancials from '../../../views/admin/AdminFinancials';

export default function AdminFinancialsRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="finance">
      <AdminFinancials />
    </ProtectedRoute>
  );
}
