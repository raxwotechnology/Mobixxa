'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeAttendance from '../../../views/employee/EmployeeAttendance';

export default function EmployeeAttendanceRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}>
      <EmployeeAttendance />
    </ProtectedRoute>
  );
}
