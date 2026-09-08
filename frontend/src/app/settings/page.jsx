'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import UserSettings from '../../views/UserSettings';

export default function SettingsRoute() {
  return (
    <ProtectedRoute>
      <UserSettings />
    </ProtectedRoute>
  );
}
