'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminAccounts from '../../../views/admin/AdminAccounts';

export default function AdminAccountsRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager']} permission="finance">
      <AdminAccounts />
    </ProtectedRoute>
  );
}
