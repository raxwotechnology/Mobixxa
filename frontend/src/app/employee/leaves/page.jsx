'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeLeaves from '../../../views/employee/EmployeeLeaves';

export default function EmployeeLeavesRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}>
      <EmployeeLeaves />
    </ProtectedRoute>
  );
}
