'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLetters from '../../../views/admin/AdminLetters';

export default function AdminLettersRoute() {
  return (
    <ProtectedRoute roles={['admin']} permission="employees">
      <AdminLetters />
    </ProtectedRoute>
  );
}
