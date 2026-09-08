'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeProfile from '../../../views/employee/EmployeeProfile';

export default function EmployeeProfileRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}>
      <EmployeeProfile />
    </ProtectedRoute>
  );
}
