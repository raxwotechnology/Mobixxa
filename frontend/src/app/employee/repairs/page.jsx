'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeRepairs from '../../../views/employee/EmployeeRepairs';

export default function EmployeeRepairsRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'stockEmployee']}>
      <EmployeeRepairs />
    </ProtectedRoute>
  );
}
