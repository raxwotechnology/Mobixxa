'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import EmployeeDashboard from '../../views/employee/EmployeeDashboard';

export default function EmployeeDashboardRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}>
      <EmployeeDashboard />
    </ProtectedRoute>
  );
}
