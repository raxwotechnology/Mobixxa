'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeOvertime from '../../../views/employee/EmployeeOvertime';

export default function EmployeeOvertimeRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee', 'manager']}>
      <EmployeeOvertime />
    </ProtectedRoute>
  );
}
