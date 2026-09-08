'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeSalary from '../../../views/employee/EmployeeSalary';

export default function EmployeeSalaryRoute() {
  return (
    <ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}>
      <EmployeeSalary />
    </ProtectedRoute>
  );
}
