'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import Profile from '../../views/customer/Profile';

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
